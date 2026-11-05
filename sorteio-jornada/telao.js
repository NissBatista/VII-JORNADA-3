// ================= TELÃO (notebook do organizador) =================
const $ = id => document.getElementById(id);
const auth = firebase.auth();
let estado = { status: "aguardando" };
let sorteando = false;

// ---- QR Code: aponta para participar.html na mesma pasta/host ----
const urlParticipar = new URL("participar.html", location.href).href;
new QRCode($("qrcode"), { text: urlParticipar, width: 512, height: 512, correctLevel: QRCode.CorrectLevel.M });

// ---- Login do organizador (só ele pode iniciar/reiniciar) ----
auth.onAuthStateChanged(u => {
  $("login").hidden = !!u;
  $("controles").hidden = !u;
  if (u) verificarFim();
});
$("btn-entrar").onclick = () =>
  auth.signInWithEmailAndPassword($("email").value, $("senha").value)
      .catch(() => alert("E-mail ou senha incorretos."));

// ---- Botões ----
$("btn-iniciar").onclick = async () => {
  await NUMEROS.remove();                       // começa do zero
  await ESTADO.set({ status: "captando", fim: agora() + DURACAO_MS });
};
$("btn-reiniciar").onclick = async () => {
  await ESTADO.set({ status: "aguardando" });
  await NUMEROS.remove();
  $("vencedor").classList.remove("on", "final");
  sorteando = false;
};
$("btn-fechar").onclick = () => $("vencedor").classList.remove("on");

// ---- Estado em tempo real ----
ESTADO.on("value", s => {
  estado = s.val() || { status: "aguardando" };
  $("btn-iniciar").disabled = estado.status === "captando" || estado.status === "encerrado";
  $("qr-legenda").textContent =
    estado.status === "captando" ? "Escaneie agora!" :
    estado.status === "aguardando" ? "Aguardando início da captação" : "Captação encerrada";
  if (estado.status === "sorteado") mostrarVencedor(estado.vencedor);
  if (estado.status === "aguardando") { $("relogio").textContent = "03:00"; $("relogio").classList.remove("fim"); }
});

// ---- Lista em tempo real: cada número que entra no banco aparece aqui ----
let total = 0;
NUMEROS.on("child_added", s => {
  total++; $("contador").textContent = total;
  const c = document.createElement("span");
  c.className = "chip"; c.id = "n" + s.key; c.textContent = s.key;
  $("chips").prepend(c);
});
NUMEROS.on("child_removed", s => {
  total = Math.max(0, total - 1); $("contador").textContent = total;
  const c = $("n" + s.key); if (c) c.remove();
});

// ---- Cronômetro (usa a hora do servidor) ----
setInterval(() => {
  if (estado.status !== "captando") return;
  const resta = Math.max(0, estado.fim - agora());
  const seg = Math.ceil(resta / 1000);
  $("relogio").textContent = String(Math.floor(seg / 60)).padStart(2, "0") + ":" + String(seg % 60).padStart(2, "0");
  $("relogio").classList.toggle("fim", resta <= 10000);
  if (resta <= 0) verificarFim();
}, 200);

// ---- Fim da captação -> bloqueia e sorteia ----
async function verificarFim() {
  if (sorteando || !auth.currentUser) return;
  if (estado.status !== "captando" || agora() < estado.fim) return;
  sorteando = true;
  // As regras do banco já recusam novos números após 'fim'. Marcamos como encerrado:
  await ESTADO.update({ status: "encerrado" });
  const snap = await NUMEROS.once("value");
  const lista = Object.keys(snap.val() || {});
  if (!lista.length) { alert("Nenhum participante entrou."); sorteando = false; return; }
  await animarSorteio(lista);
}

// Sorteio justo: índice vindo de crypto (sem viés de módulo)
function indiceSeguro(max) {
  const lim = Math.floor(0x100000000 / max) * max;
  const a = new Uint32Array(1);
  do { crypto.getRandomValues(a); } while (a[0] >= lim);
  return a[0] % max;
}

async function animarSorteio(lista) {
  const tela = $("vencedor");
  tela.classList.add("on"); tela.classList.remove("final");
  $("v-titulo").textContent = "Sorteando...";
  $("btn-fechar").hidden = true;
  const vencedor = lista[indiceSeguro(lista.length)];

  let atraso = 50;
  const fim = Date.now() + 5000;                // ~5 s de animação, desacelerando
  while (Date.now() < fim) {
    $("v-num").textContent = lista[indiceSeguro(lista.length)];
    await new Promise(r => setTimeout(r, atraso));
    atraso = Math.min(atraso * 1.08, 400);
  }
  await ESTADO.update({ status: "sorteado", vencedor });   // celulares também são avisados
}

function mostrarVencedor(n) {
  const tela = $("vencedor");
  tela.classList.add("on", "final");
  $("v-titulo").textContent = "🎉 NÚMERO VENCEDOR";
  $("v-num").textContent = n;
  $("btn-fechar").hidden = false;
}
