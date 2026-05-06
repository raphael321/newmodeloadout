# Newmode Loadout

Perfilador psicológico Big Five + ACSI para esports.
Descobre se o jogador é **FLEX**, **ENTRY**, **IGL** ou **ANCHOR**.

---

## 🚀 Rodar local

Pré-requisitos: **Node.js 18+** e **npm** (ou pnpm/yarn).

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Para acessar pelo celular na mesma rede Wi-Fi (testar mobile):
- O `--host` já está no script. Vite vai mostrar um IP de rede tipo `http://192.168.x.x:5173`.
- Acesse esse IP do celular conectado no mesmo Wi-Fi.

---

## 🌐 Deploy na Vercel (recomendado)

### Opção A — Via GitHub (deploy automático)

1. Suba este projeto pra um repositório no GitHub:
   ```bash
   git init
   git add .
   git commit -m "init: newmode loadout"
   git branch -M main
   git remote add origin git@github.com:SEU_USER/newmode-loadout.git
   git push -u origin main
   ```
2. Acesse [vercel.com/new](https://vercel.com/new), conecte o GitHub e importe o repo.
3. A Vercel detecta o `vercel.json` e o framework Vite automaticamente. Só clicar em **Deploy**.
4. URL fica disponível em ~30s. Cada `git push` na `main` redeploya sozinho.

### Opção B — Via CLI (mais rápido, sem GitHub)

```bash
npm install -g vercel
vercel
```

Responda as perguntas (link to existing? **N** / project name / etc) — em ~1 min está no ar com URL pública.
Depois `vercel --prod` pra promover pro domínio principal.

---

## ⚡ Quick test sem instalar nada — StackBlitz

1. Acesse [stackblitz.com](https://stackblitz.com)
2. New project → Vite + React
3. Substitua o conteúdo de `src/App.jsx` pelo arquivo deste projeto
4. No `package.json`, adicione `"recharts": "^2.12.7"` em `dependencies`
5. URL de preview já é pública e compartilhável

---

## 📁 Estrutura

```
newmode-loadout/
├── src/
│   ├── App.jsx        ← lógica completa do perfilador (1 arquivo)
│   ├── main.jsx       ← entry React
│   └── index.css      ← Tailwind + reset global
├── index.html         ← entry HTML (PWA-ready, mobile meta tags)
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json        ← config de deploy (SPA rewrite + cache)
└── .gitignore
```

---

## 🔌 Integração com Supabase (próximo passo)

O arquivo `src/App.jsx` tem a função `submitToBackend(payload)` marcada com `// TODO`.
Quando quiser plugar:

```bash
npm install @supabase/supabase-js
```

Crie `src/lib/supabase.js`:
```js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

Crie `.env.local` (não commitar):
```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

E substitua o stub de `submitToBackend` no `App.jsx` pela chamada RPC do schema SQL já entregue.

Na Vercel, adicione as mesmas variáveis em **Project Settings → Environment Variables**.

---

## 📝 Trocar nome da marca

No topo de `src/App.jsx`, altere:

```js
const BRAND = {
  name: "NEWMODE LOADOUT",     // ← aqui
  tagline: "PSYCHOLOGICAL PROFILE / ESPORTS",
};
```
