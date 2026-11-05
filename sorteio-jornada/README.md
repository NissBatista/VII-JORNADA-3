# Sorteio ao vivo — VII Jornada de Administração (UFPI)

Site estático (HTML/CSS/JS) + Firebase Realtime Database. Sem servidor próprio.

## Passo a passo (≈10 min)
1. https://console.firebase.google.com → **Adicionar projeto**.
2. **Build > Realtime Database > Criar banco** (modo bloqueado).
3. **Build > Authentication > Sign-in method > E-mail/senha** → ativar. Aba *Users* → **Adicionar usuário** (e-mail e senha do organizador).
4. **Realtime Database > Regras**: cole `database.rules.json` e troque `ORGANIZADOR@EMAIL.COM` pelo e-mail criado. **Publicar**.
5. **Configurações do projeto > Seus apps > Web (</>)**: copie o `firebaseConfig` para `firebase-config.js`.
6. Hospede (precisa de HTTPS para os celulares): `npm i -g firebase-tools && firebase login && firebase init hosting && firebase deploy`
   (alternativas: Netlify Drop ou GitHub Pages).
7. No notebook abra `https://SEU-PROJETO.web.app/` (F11 para tela cheia), faça login, e clique em **Iniciar Captação**.

## Fluxo
Celular → `participante.js` → transaction em `sorteio/numeros/{n}` → Firebase → `child_added` no `telao.js` → chip aparece no telão.
Ao zerar, as regras bloqueiam novas escritas (`now <= fim`), o telão sorteia com `crypto` e grava `estado/vencedor`; os celulares recebem o resultado.

## Teste antes do evento
Abra o telão, inicie e escaneie com 2–3 celulares (ou abas anônimas).
