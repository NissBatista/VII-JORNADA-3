// ================= CELULAR DO PARTICIPANTE =================
const $ = id => document.getElementById(id);

// Identidade anônima deste aparelho (não exige login nem dados pessoais)
const DEVICE_ID = localStorage.getItem("deviceId") ||
  (() => { const id = crypto.randomUUID(); localStorage.setItem("deviceId", id); return id; })();

let estado = null, meuNumero = null, reservando = false;

/* ----------------------------------------------------------------
   VALIDAÇÃO DE UNICIDADE (100% garantida pelo servidor)
   Cada número é uma CHAVE em sorteio/numeros/{n}. A transaction só grava
   se a chave estiver vazia (null). Se dois celulares tentam o mesmo número
   ao mesmo tempo, o Firebase aceita um e re-executa o outro com o valor
   real, que então aborta. Além disso, as regras do banco rejeitam qualquer
   escrita em uma chave já existente (!data.exists()).
---------------------------------------------------------------- */
function numeroAleatorio() {
  const faixa = NUM_MAX - NUM_MIN + 1;
  const lim = Math.floor(0x100000000 / faixa) * faixa;
  const a = new Uint32Array(1);
  do { crypto.getRandomValues(a); } while (a[0] >= lim);
  return NUM_MIN + (a[0] % faixa);
}

async function reservarNumeroUnico() {
  for (let tentativa = 0; tentativa < 60; tentativa++) {
    const n = numeroAleatorio();
    const res = await NUMEROS.child(String(n)).transaction(atual =>
      atual === null ? DEVICE_ID : undefined          // undefined = aborta (já ocupado)
    );
    if (res.committed && res.snapshot.val() === DEVICE_ID) return n;   // reservado!
  }
  throw new Error("SEM_NUMERO_LIVRE");
}

async function entrarNoSorteio() {
  if (reservando || meuNumero) return;
  reservando = true;
  try {
    // Já tem número nesta rodada? (recarregou a página) — reaproveita
    const salvo = JSON.parse(localStorage.getItem("rodada") || "null");
    if (salvo && salvo.fim === estado.fim) {
      const s = await NUMEROS.child(String(salvo.n)).once("value");
      if (s.val() === DEVICE_ID) { meuNumero = salvo.n; mostrar(); return; }
    }
    const n = await reservarNumeroUnico();
    meuNumero = n;
    localStorage.setItem("rodada", JSON.stringify({ fim: estado.fim, n }));
    mostrar();
  } catch (e) {
    $("titulo").textContent = "Captação encerrada";
    $("msg").textContent = "O tempo acabou antes de registrar seu número.";
  } finally { reservando = false; }
}

function mostrar() {
  $("titulo").textContent = "Seu número é";
  $("numero").textContent = fmt(meuNumero);
  $("msg").textContent = "Fique atento ao telão. Boa sorte!";
}

// Escuta o estado do sorteio em tempo real
ESTADO.on("value", s => {
  estado = s.val() || { status: "aguardando" };
  const cartao = $("cartao");

  if (estado.status === "sorteado") {
    if (meuNumero !== null) {
      const ganhou = String(estado.vencedor) === String(meuNumero);
      cartao.classList.toggle("ganhou", ganhou);
      $("titulo").textContent = ganhou ? "🎉 VOCÊ GANHOU!" : "Sorteio finalizado";
      $("msg").textContent = ganhou ? "Procure a organização para retirar o prêmio." :
                                      "Número sorteado: " + estado.vencedor + ". Obrigado por participar!";
    } else {
      $("titulo").textContent = "Sorteio finalizado";
      $("msg").textContent = "A captação já foi encerrada.";
    }
  } else if (estado.status === "captando" && agora() < estado.fim) {
    if (meuNumero === null) { $("titulo").textContent = "Gerando seu número..."; entrarNoSorteio(); }
  } else if (estado.status === "aguardando") {
    meuNumero = null; cartao.classList.remove("ganhou");
    $("numero").textContent = "";
    $("titulo").textContent = "Aguarde";
    $("msg").textContent = "A captação ainda não começou. Esta tela atualiza sozinha.";
  } else if (meuNumero === null) {
    $("titulo").textContent = "Captação encerrada";
    $("msg").textContent = "O tempo para entrar no sorteio acabou.";
  }
});
