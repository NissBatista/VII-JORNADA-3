// ============================================================
//  CONFIGURAÇÃO — preencha com os dados do SEU projeto Firebase
//  (Console Firebase > Configurações do projeto > Seus apps > Web)
// ============================================================
const FIREBASE_CONFIG = {
  apiKey: "COLE_AQUI",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  databaseURL: "https://SEU-PROJETO-default-rtdb.firebaseio.com",
  projectId: "SEU-PROJETO",
  appId: "COLE_AQUI"
};

// Faixa dos números sorteáveis (3 dígitos = 900 números possíveis)
const NUM_MIN = 100;
const NUM_MAX = 999;

// Duração da captação em milissegundos (exatamente 3 minutos)
const DURACAO_MS = 3 * 60 * 1000;

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();
const SORTEIO = db.ref("sorteio");
const ESTADO = SORTEIO.child("estado");
const NUMEROS = SORTEIO.child("numeros");

// Relógio sincronizado com o servidor (evita erro por hora errada no celular)
let offsetServidor = 0;
db.ref(".info/serverTimeOffset").on("value", s => { offsetServidor = s.val() || 0; });
const agora = () => Date.now() + offsetServidor;
const fmt = n => String(n).padStart(3, "0");
