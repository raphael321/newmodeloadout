import { useState, useEffect, useRef } from "react";
import { supabase, hasSupabase } from "./lib/supabase";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
} from "recharts";

/* ============================================================
   NEWMODE LOADOUT — Perfilador Big Five + ACSI
   Paleta: Rainbow Six Siege
   ============================================================ */

const BRAND = {
  name: "NEWMODE LOADOUT",
  tagline: "PSYCHOLOGICAL PROFILE / ESPORTS",
};

const STORAGE_KEY = "newmode_mind_state_v1";

/* ---- Paleta R6 ---- */
const C = {
  bg:        "#0B1215",   // preto cinza
  surface:   "#111B1F",
  elevated:  "#18262C",
  border:    "#20333B",
  primary:   "#FF2400",   // laranja magma
  primaryDk: "#D61E00",
  accent:    "#FF5E4D",
  danger:    "#FF2400",
  defense:   "#2080E5",
  text:      "#f6f6f6",   // cinza claro
  textMute:  "#9EB2B9",
  textDim:   "#5B767F",
};

/* ---- Dimensões ---- */
const DIMENSIONS = {
  abertura:       { label: "Abertura",        radarLabel: "ABERTURA",       invert: false },
  consciencia:    { label: "Consciência",     radarLabel: "CONSCIÊNCIA",    invert: false },
  extroversao:    { label: "Extroversão",     radarLabel: "EXTROVERSÃO",    invert: false },
  agradabilidade: { label: "Agradabilidade",  radarLabel: "AGRADABILIDADE", invert: false },
  neuroticismo:   { label: "Neuroticismo",    radarLabel: "ESTABILIDADE",   invert: true  },
  confianca:      { label: "Confiança",       radarLabel: "CONFIANÇA",      invert: false },
  concentracao:   { label: "Concentração",    radarLabel: "CONCENTRAÇÃO",   invert: false },
  pressao:        { label: "Pressão",         radarLabel: "PRESSÃO",        invert: false },
  adversidade:    { label: "Adversidade",     radarLabel: "ADVERSIDADE",    invert: false },
};

/* ---- 19 perguntas ---- */
const QUESTIONS = [
  { id: "ab1", dim: "abertura",       text: "Busco soluções diferentes durante a partida" },
  { id: "ab2", dim: "abertura",       text: "Improviso bem durante o game" },
  { id: "co1", dim: "consciencia",    text: "Sigo o plano do time" },
  { id: "co2", dim: "consciencia",    text: "Cumpro minha função dentro do time" },
  { id: "ex1", dim: "extroversao",    text: "Me comunico bastante" },
  { id: "ex2", dim: "extroversao",    text: "Tomo iniciativa dentro do time" },
  { id: "ag1", dim: "agradabilidade", text: "Priorizo o time" },
  { id: "ag2", dim: "agradabilidade", text: "Escuto meus companheiros" },
  { id: "ag3", dim: "agradabilidade", text: "Evito conflitos e tilts (estresse) da equipe" },
  { id: "ne1", dim: "neuroticismo",   text: "Fico tiltado (nervoso) fácil" },
  { id: "ne2", dim: "neuroticismo",   text: "Me abalo com erros" },
  { id: "cf1", dim: "confianca",      text: "Confio nas calls (informações) passadas da equipe" },
  { id: "cf2", dim: "confianca",      text: "Me sinto seguro jogando, não dou pinadas" },
  { id: "cc1", dim: "concentracao",   text: "Não perco o foco em partidas demoradas" },
  { id: "cc2", dim: "concentracao",   text: "Ignoro distrações durante o game" },
  { id: "pr1", dim: "pressao",        text: "Não pipoco em decisão" },
  { id: "pr2", dim: "pressao",        text: "Gosto de pressão, farmo aura" },
  { id: "ad1", dim: "adversidade",    text: "Continuo jogando bem mesmo quando estou perdendo" },
  { id: "ad2", dim: "adversidade",    text: "Consigo me recuperar rápido após erros" },
];

/* ---- 4 funções (com identidade R6) ---- */
const ROLES = {
  FLEX: {
    code: "FLEX",
    title: "O Multifuncional",
    side: "VERSATILE",
    color: C.primary,
    desc: "Versátil, adaptável e criativo. Você troca de função sob demanda, lê o jogo e improvisa soluções que ninguém vê. Cérebro flexível, calmo e técnico.",
    formula: (d) =>
      d.abertura * 0.3 +
      d.concentracao * 0.2 +
      d.consciencia * 0.2 +
      d.pressao * 0.3,
  },
  ENTRY: {
    code: "ENTRY",
    title: "O Abridor",
    side: "ATTACKER",
    color: C.danger,
    desc: "Primeiro a entrar, peito aberto. Alta confiança, atira primeiro pra criar espaço. Quando o time precisa de coragem, é você quem abre o site.",
    formula: (d) =>
      d.confianca * 0.4 +
      d.pressao * 0.3 +
      (5 - d.neuroticismo) * 0.3,
  },
  IGL: {
    code: "IGL",
    title: "O Capitão",
    side: "COMMANDER",
    color: C.accent,
    desc: "In-Game Leader. Comanda, comunica, decide. Você organiza o time em tempo real, lê o adversário e chama a estratégia certa no timing certo.",
    formula: (d) =>
      d.extroversao * 0.3 +
      d.pressao * 0.3 +
      d.concentracao * 0.2 +
      d.consciencia * 0.2,
  },
  ANCHOR: {
    code: "ANCHOR",
    title: "A Âncora",
    side: "DEFENDER",
    color: C.defense,
    desc: "Defesa sólida, paciente, foco cirúrgico. Você segura a posição até o último segundo, sem hesitar e sem se abalar. Nervos de aço.",
    formula: (d) =>
      d.concentracao * 0.4 +
      d.pressao * 0.3 +
      (5 - d.neuroticismo) * 0.3,
  },
  ENTRY_2: {
    code: "ENTRY_2",
    title: "Entry 2",
    formula: (d) =>
      d.confianca * 0.3 +
      d.pressao * 0.3 +
      d.abertura * 0.2 +
      d.adversidade * 0.2,
  },
  SUPPORT: {
    code: "SUPPORT",
    title: "Suporte",
    formula: (d) =>
      d.agradabilidade * 0.4 +
      d.concentracao * 0.3 +
      d.consciencia * 0.3,
  },
  ROAMER: {
    code: "ROAMER",
    title: "Roamer",
    formula: (d) =>
      d.abertura * 0.4 +
      d.confianca * 0.3 +
      d.pressao * 0.3,
  },
}

const SCALE = [
  { value: 1, label: "Discordo totalmente" },
  { value: 2, label: "Discordo" },
  { value: 3, label: "Neutro" },
  { value: 4, label: "Concordo" },
  { value: 5, label: "Concordo totalmente" },
];

/* ============================================================
   LÓGICA (PURA)
   ============================================================ */

function computeDimensions(answers) {
  const sums = {}, counts = {};
  for (const q of QUESTIONS) {
    const v = answers[q.id];
    if (typeof v !== "number") continue;
    sums[q.dim] = (sums[q.dim] || 0) + v;
    counts[q.dim] = (counts[q.dim] || 0) + 1;
  }
  const out = {};
  for (const dim of Object.keys(DIMENSIONS)) {
    out[dim] = counts[dim] ? sums[dim] / counts[dim] : 0;
  }
  return out;
}

function computeRoles(d) {
  const r = {};
  for (const [code, role] of Object.entries(ROLES)) r[code] = role.formula(d);
  return r;
}

function pickWinner(scores) {
  const candidates = ["FLEX", "ENTRY", "IGL", "ANCHOR"];
  let win = null, max = -Infinity;
  for (const k of candidates) {
    if (scores[k] !== undefined && scores[k] > max) {
      max = scores[k];
      win = k;
    }
  }
  return win;
}

function buildPayload({ participant, answers, dimensions, roleScores, winner }) {
  return {
    schema_version: 1,
    participant_id: participant.id,
    participant: {
      name: participant.name,
      phone: participant.phone || null,
      age: participant.age || null,
      gender: participant.gender || null,
      email: participant.email || null,
    },
    timestamps: {
      started_at: participant.started_at,
      completed_at: new Date().toISOString(),
    },
    answers: QUESTIONS.map((q) => ({
      question_id: q.id, dimension: q.dim, value: answers[q.id],
    })),
    dimensions,
    role_scores: roleScores,
    winner_role: winner,
  };
}

function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* ---- localStorage ---- */
function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (_) {} }
function loadState() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch (_) { return null; } }
function clearState() { try { localStorage.removeItem(STORAGE_KEY); } catch (_) {} }

/* ---- backend ---- */
async function submitToBackend(payload) {
  if (!hasSupabase) {
    // Sem env vars — modo offline (dev local sem .env)
    await new Promise((r) => setTimeout(r, 200));
    console.log("[newmode_loadout] OFFLINE payload:", payload);
    return { ok: true, payload, offline: true };
  }

  const row = {
    schema_version: payload.schema_version,
    participant_id: payload.participant_id,
    participant_name: payload.participant.name,
    participant_phone: payload.participant.phone,
    participant_age: payload.participant.age,
    participant_gender: payload.participant.gender,
    participant_email: payload.participant.email,
    winner_role: payload.winner_role,
    dimensions: payload.dimensions,
    role_scores: payload.role_scores,
    answers: payload.answers,
    started_at: payload.timestamps.started_at,
    completed_at: payload.timestamps.completed_at,
  };

  const { data, error } = await supabase
    .from("assessments")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("[newmode_loadout] insert failed:", error);
    return { ok: false, error: error.message, payload };
  }
  return { ok: true, payload, id: data.id };
}

/* ============================================================
   UI HELPERS
   ============================================================ */

function FontLoader() {
  useEffect(() => {
    const id = "newmode-loadout-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
}

const F = {
  display: "Chakra Petch, sans-serif",
  body:    "Chakra Petch, sans-serif",
  mono:    "JetBrains Mono, ui-monospace, monospace",
};

function NoiseBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: C.bg }}
    >
      {/* radial glows */}
      <div
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(circle at 15% 0%, rgba(255,36,0,0.08), transparent 45%),
             radial-gradient(circle at 85% 100%, rgba(158,178,185,0.04), transparent 45%)`,
        }}
      />
      {/* scanline sutil */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)",
        }}
      />
    </div>
  );
}

function HudHeader({ onAdminClick }) {
  return (
    <div
      className="flex items-center justify-between border-b pb-3 mb-6 select-none"
      style={{ borderColor: C.border, fontFamily: F.mono }}
    >
      <div 
        className="flex items-center gap-2 text-[10px] tracking-[0.3em] cursor-pointer" 
        style={{ color: C.primary }}
        onClick={onAdminClick}
      >
        <span className="inline-block w-2 h-2" style={{ background: C.primary }} />
        {BRAND.name}
      </div>
      <div className="text-[10px] tracking-[0.3em]" style={{ color: C.textDim }}>
        {BRAND.tagline}
      </div>
    </div>
  );
}

function Bracket({ children, color = C.primary }) {
  return (
    <span style={{ fontFamily: F.mono, color }}>
      [ <span style={{ color: C.text }}>{children}</span> ]
    </span>
  );
}

/* corner-cut box (clip-path) */
const cutCorners = {
  clipPath:
    "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
};

function ProgressBar({ current, total }) {
  const pct = (current / total) * 100;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2" style={{ fontFamily: F.mono }}>
        <span className="text-[10px] tracking-[0.3em]" style={{ color: C.primary }}>
          [ {String(current).padStart(2, "0")} / {String(total).padStart(2, "0")} ]
        </span>
        <span className="text-[10px] tracking-[0.3em]" style={{ color: C.textDim }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-[3px] w-full overflow-hidden" style={{ background: C.border }}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
            boxShadow: `0 0 10px ${C.primary}99`,
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   WELCOME
   ============================================================ */

function WelcomeScreen({ onStart, hasResume, onResume, onDiscardResume, onAdminClick }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const validName = name.trim().length >= 2;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validAge = age.trim() !== "" && !isNaN(age) && Number(age) >= 5 && Number(age) <= 100;
  const validGender = gender !== "";

  const valid = validName && validAge && validGender && validEmail;

  return (
    <div className="min-h-screen flex flex-col px-5 py-6">
      <FontLoader />
      <NoiseBg />
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <HudHeader onAdminClick={onAdminClick} />

        {/* hero */}
        <div className="mb-8">
          <div
            className="text-[10px] tracking-[0.4em] mb-3 flex items-center gap-2"
            style={{ fontFamily: F.mono, color: C.accent }}
          >
            <span>›</span> OPERATION BRIEFING
          </div>
          <h1
            className="leading-[0.88] uppercase mb-4"
            style={{
              fontFamily: F.display,
              fontWeight: 800,
              fontSize: "clamp(48px, 13vw, 86px)",
              color: C.text,
              letterSpacing: "-0.01em",
            }}
          >
            QUAL É A SUA<br />
            <span style={{ color: C.primary }}>FUNÇÃO</span> NO TIME?
          </h1>
          <p
            className="text-[15px] leading-relaxed"
            style={{ fontFamily: F.body, color: C.textMute }}
          >
            {QUESTIONS.length} perguntas rápidas. No final, identificamos seu papel:{" "}
            <span style={{ color: C.primary, fontWeight: 700 }}>FLEX</span>,{" "}
            <span style={{ color: C.danger, fontWeight: 700 }}>ENTRY</span>,{" "}
            <span style={{ color: C.accent, fontWeight: 700 }}>IGL</span> ou{" "}
            <span style={{ color: C.defense, fontWeight: 700 }}>ANCHOR</span>.
          </p>
        </div>

        {/* resume card */}
        {hasResume && (
          <div
            className="mb-6 p-4 border"
            style={{
              ...cutCorners,
              borderColor: C.primary,
              background: "rgba(255,107,0,0.06)",
              fontFamily: F.body,
            }}
          >
            <div className="text-sm mb-3" style={{ color: C.text }}>
              <span style={{ fontFamily: F.mono, color: C.primary }}>›</span>{" "}
              Operação em andamento detectada.
            </div>
            <div className="flex gap-2">
              <button
                onClick={onResume}
                className="flex-1 py-2 px-3 text-xs tracking-[0.2em] font-bold"
                style={{
                  fontFamily: F.mono,
                  background: C.primary,
                  color: "#000",
                  ...cutCorners,
                }}
              >
                CONTINUAR ›
              </button>
              <button
                onClick={onDiscardResume}
                className="flex-1 py-2 px-3 text-xs tracking-[0.2em]"
                style={{
                  fontFamily: F.mono,
                  background: C.surface,
                  color: C.textMute,
                  border: `1px solid ${C.border}`,
                }}
              >
                NOVO
              </button>
            </div>
          </div>
        )}

        {/* form */}
        <div className="space-y-5 mb-8">
          <div>
            <label
              className="block text-[10px] tracking-[0.3em] mb-2"
              style={{ fontFamily: F.mono, color: C.textMute }}
            >
              › CALLSIGN / NOME <span style={{ color: C.danger }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Ex: Lucas Silva"
              maxLength={60}
              className="w-full px-4 py-3 outline-none"
              style={{
                fontFamily: F.body,
                background: C.surface,
                border: `1px solid ${touched && !validName ? C.danger : C.border}`,
                color: C.text,
              }}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
            />
            {touched && !validName && (
              <p className="text-xs mt-1" style={{ color: C.danger, fontFamily: F.body }}>
                Mínimo de 2 caracteres.
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-[10px] tracking-[0.3em] mb-2"
              style={{ fontFamily: F.mono, color: C.textMute }}
            >
              › E-MAIL <span style={{ color: C.danger }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Ex: lucas@email.com"
              maxLength={100}
              className="w-full px-4 py-3 outline-none"
              style={{
                fontFamily: F.body,
                background: C.surface,
                border: `1px solid ${touched && !validEmail ? C.danger : C.border}`,
                color: C.text,
              }}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
            />
            {touched && !validEmail && (
              <p className="text-xs mt-1" style={{ color: C.danger, fontFamily: F.body }}>
                E-mail inválido.
              </p>
            )}
          </div>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4">
              <label
                className="block text-[10px] tracking-[0.3em] mb-2"
                style={{ fontFamily: F.mono, color: C.textMute }}
              >
                › IDADE <span style={{ color: C.danger }}>*</span>
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Ex: 22"
                min="5"
                max="100"
                className="w-full px-4 py-3 outline-none"
                style={{
                  fontFamily: F.body,
                  background: C.surface,
                  border: `1px solid ${touched && !validAge ? C.danger : C.border}`,
                  color: C.text,
                }}
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
              />
              {touched && !validAge && (
                <p className="text-xs mt-1" style={{ color: C.danger, fontFamily: F.body }}>
                  Idade inválida (5-100).
                </p>
              )}
            </div>

            <div className="col-span-8">
              <label
                className="block text-[10px] tracking-[0.3em] mb-2"
                style={{ fontFamily: F.mono, color: C.textMute }}
              >
                › WHATSAPP <span style={{ color: C.textDim }}>(OPCIONAL)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+()\-\s]/g, ""))}
                placeholder="(85) 99999-9999"
                maxLength={20}
                className="w-full px-4 py-3 outline-none"
                style={{
                  fontFamily: F.body,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  color: C.text,
                }}
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-[10px] tracking-[0.3em] mb-2"
              style={{ fontFamily: F.mono, color: C.textMute }}
            >
              › SEXO <span style={{ color: C.danger }}>*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "Masculino", label: "MASCULINO" },
                { value: "Feminino", label: "FEMININO" },
                { value: "Outro", label: "OUTRO" },
                { value: "Prefiro nao dizer", label: "NÃO DECLARAR" },
              ].map((opt) => {
                const isSelected = gender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    className="py-3 px-2 text-[10px] font-bold tracking-widest border transition-all active:scale-[0.98]"
                    style={{
                      fontFamily: F.mono,
                      background: isSelected ? C.primary : C.surface,
                      color: isSelected ? "#000" : C.textMute,
                      borderColor: isSelected ? C.primary : C.border,
                      ...cutCorners,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {touched && !validGender && (
              <p className="text-xs mt-1" style={{ color: C.danger, fontFamily: F.body }}>
                Selecione uma opção.
              </p>
            )}
          </div>
        </div>

        <button
          disabled={!valid}
          onClick={() =>
            onStart({
              id: uuid(),
              name: name.trim(),
              phone: phone.trim(),
              age: Number(age),
              gender: gender,
              email: email.trim(),
              started_at: new Date().toISOString(),
            })
          }
          className="w-full py-4 font-bold tracking-[0.3em] text-base transition-transform active:scale-[0.98] disabled:cursor-not-allowed"
          style={{
            fontFamily: F.mono,
            background: valid ? C.primary : C.surface,
            color: valid ? "#000" : C.textDim,
            ...cutCorners,
            boxShadow: valid ? `0 0 24px ${C.primary}66` : "none",
          }}
        >
          DEPLOY ›››
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   QUESTION LIST (todas as perguntas na mesma tela)
   ============================================================ */

function ScaleRow({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {SCALE.map((s) => {
        const selected = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange(s.value)}
            aria-label={`${s.value} — ${s.label}`}
            title={s.label}
            className="flex-1 h-11 flex items-center justify-center font-bold text-base transition-all active:scale-95"
            style={{
              fontFamily: F.mono,
              background: selected ? C.primary : C.surface,
              color: selected ? "#000" : C.textMute,
              border: `1px solid ${selected ? C.primary : C.border}`,
            }}
          >
            {s.value}
          </button>
        );
      })}
    </div>
  );
}

function QuestionListScreen({ answers, onAnswer, onSubmit, submitting }) {
  // Agrupa perguntas por dimensao
  const groups = Object.entries(DIMENSIONS).map(([key, meta]) => ({
    key,
    label: meta.label,
    questions: QUESTIONS.filter((q) => q.dim === key),
  }));

  const total = QUESTIONS.length;
  const answered = QUESTIONS.filter((q) => typeof answers[q.id] === "number").length;
  const complete = answered === total;

  // Auto-scroll pra proxima pergunta nao respondida ao selecionar
  const handlePick = (qId, value) => {
    onAnswer(qId, value);
    requestAnimationFrame(() => {
      const idx = QUESTIONS.findIndex((q) => q.id === qId);
      const nextUnansweredIdx = QUESTIONS.findIndex(
        (q, i) => i > idx && typeof answers[q.id] !== "number" && q.id !== qId
      );
      if (nextUnansweredIdx >= 0) {
        const el = document.getElementById(`q-${QUESTIONS[nextUnansweredIdx].id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  };

  return (
    <div className="min-h-screen px-5 py-6">
      <FontLoader />
      <NoiseBg />
      <div className="max-w-md mx-auto">
        <HudHeader />

        {/* progresso sticky */}
        <div
          className="sticky top-0 z-20 -mx-5 px-5 py-3 mb-4"
          style={{
            background: `${C.bg}f2`,
            borderBottom: `1px solid ${C.border}`,
            backdropFilter: "blur(8px)",
          }}
        >
          <ProgressBar current={answered} total={total} />
        </div>

        {/* legenda da escala */}
        <div
          className="mb-6 p-3 text-[10px] tracking-[0.15em] flex justify-between"
          style={{
            fontFamily: F.mono,
            color: C.textDim,
            background: C.surface,
            border: `1px solid ${C.border}`,
          }}
        >
          <span>1 = DISCORDO</span>
          <span>3 = NEUTRO</span>
          <span>5 = CONCORDO</span>
        </div>

        {/* grupos */}
        <div className="space-y-8 mb-8">
          {groups.map((g) => (
            <section key={g.key}>
              <div
                className="text-[10px] tracking-[0.4em] mb-3 flex items-center gap-2"
                style={{ fontFamily: F.mono, color: C.primary }}
              >
                <span>›</span> {g.label.toUpperCase()}
              </div>
              <div className="space-y-4">
                {g.questions.map((q) => {
                  const v = answers[q.id];
                  const filled = typeof v === "number";
                  return (
                    <div
                      key={q.id}
                      id={`q-${q.id}`}
                      className="p-4"
                      style={{
                        background: C.surface,
                        border: `1px solid ${filled ? C.border : C.elevated}`,
                      }}
                    >
                      <div
                        className="text-sm mb-3 leading-snug"
                        style={{
                          fontFamily: F.body,
                          color: filled ? C.text : C.textMute,
                          fontWeight: filled ? 600 : 500,
                        }}
                      >
                        {q.text}
                      </div>
                      <ScaleRow value={v} onChange={(val) => handlePick(q.id, val)} />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* botao submit */}
        <button
          onClick={onSubmit}
          disabled={!complete || submitting}
          className="w-full py-4 font-bold tracking-[0.3em]"
          style={{
            fontFamily: F.mono,
            background: complete ? C.primary : C.elevated,
            color: complete ? "#000" : C.textDim,
            border: complete ? "none" : `1px solid ${C.border}`,
            cursor: complete && !submitting ? "pointer" : "not-allowed",
            opacity: submitting ? 0.6 : 1,
            ...cutCorners,
            boxShadow: complete ? `0 0 24px ${C.primary}55` : "none",
          }}
        >
          {submitting
            ? "PROCESSING..."
            : complete
            ? "GENERATE DOSSIER ›››"
            : `${answered}/${total} ANSWERED`}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   CUSTOM ROLE TEXTS & VISUALS (R6 STYLE)
   ============================================================ */

const CUSTOM_ROLE_TEXTS = {
  IGL: {
    roleName: "IGL",
    parabens: "Você parece ser um ótimo IGL!",
    description: "Seu perfil demonstra fortes características de liderança e tomada de decisão, indicando grande potencial para atuar como IGL da equipe.",
    parabens_desc: "Você apresenta capacidade de organização, comunicação e leitura de jogo, sendo capaz de direcionar o time mesmo em situações de pressão.",
    strengths: [
      { title: "Comunicação", desc: "Você consegue transmitir informações importantes e manter o time organizado." },
      { title: "Leitura tática", desc: "Seu perfil mostra boa capacidade de entender o andamento da partida e adaptar estratégias." },
      { title: "Controle emocional", desc: "Você mantém estabilidade mesmo em situações tensas." },
      { title: "Tomada de decisão", desc: "Você demonstra capacidade para decidir rapidamente e assumir responsabilidade." },
      { title: "Liderança", desc: "Seu comportamento tende a influenciar positivamente a equipe." }
    ],
    evolve: [
      { title: "Excesso de pressão", desc: "Evite carregar sozinho toda responsabilidade da equipe." },
      { title: "Clareza nas calls", desc: "Busque transmitir informações de forma ainda mais objetiva." },
      { title: "Consistência emocional", desc: "Mesmo líderes precisam controlar frustração em momentos difíceis." }
    ],
    final_message: "Você possui perfil de liderança competitiva. Sua capacidade de organizar, comunicar e decidir pode transformar o desempenho coletivo da equipe. Continue evoluindo sua clareza, confiança e estabilidade emocional para se tornar uma referência dentro do servidor.",
    tagline: "LIDERE. ORGANIZE. VENÇA. ESSE É O NEWMODE."
  },
  FLEX: {
    roleName: "FLEX",
    parabens: "Você parece ser um ótimo FLEX!",
    description: "Jogadores Flex são adaptáveis, inteligentes e consistentes. Você se destaca em diferentes situações e funções dentro do time.",
    parabens_desc: "Seu perfil mostra equilíbrio entre adaptação, tomada de decisão e controle emocional. Continue assim e você será peça-chave em qualquer lineup!",
    strengths: [
      { title: "Adaptabilidade", desc: "Você se adapta bem a diferentes funções e estratégias." },
      { title: "Tomada de Decisão", desc: "Boa leitura de jogo e decisões consistentes." },
      { title: "Controle Emocional", desc: "Mantém a calma e atua bem sob pressão." },
      { title: "Trabalho em Equipe", desc: "Você consegue contribuir positivamente em diferentes funções." }
    ],
    evolve: [
      { title: "Comunicação", desc: "Busque tornar suas calls ainda mais objetivas." },
      { title: "Especialização", desc: "Desenvolver ainda mais uma função específica pode elevar sua performance." },
      { title: "Confiança", desc: "Confiar mais nas suas decisões pode aumentar sua consistência." }
    ],
    final_message: "Seu perfil demonstra grande potencial competitivo. Sua capacidade de adaptação e estabilidade faz de você uma peça extremamente valiosa para qualquer lineup. Continue treinando seus pontos de atenção e você alcançará um nível ainda mais alto!",
    tagline: "ADAPTE. EVOLUA. SUPERE. ESSE É O NEWMODE."
  },
  ENTRY: {
    roleName: "ENTRY",
    parabens: "Você parece ser um ótimo ENTRY!",
    description: "Seu perfil demonstra características extremamente fortes para atuar como ENTRY dentro da equipe. Você apresenta confiança, iniciativa e coragem para assumir os primeiros confrontos.",
    parabens_desc: "Você cria espaço e oportunidades para o time avançar. Jogadores dessa função costumam ditar o ritmo ofensivo e pressionar os adversários constantemente.",
    strengths: [
      { title: "Iniciativa", desc: "Você não hesita em agir e consegue assumir responsabilidade em momentos importantes da partida." },
      { title: "Confiança", desc: "Seu perfil demonstra coragem para realizar jogadas agressivas e abrir espaço para a equipe." },
      { title: "Decisão rápida", desc: "Você reage bem em situações intensas e consegue tomar decisões com velocidade." },
      { title: "Pressão", desc: "Você tende a performar bem em rounds acelerados e momentos decisivos." },
      { title: "Impacto ofensivo", desc: "Seu estilo cria oportunidades e força os adversários a reagirem constantemente." }
    ],
    evolve: [
      { title: "Controle emocional", desc: "Evite deixar eliminações, erros ou rounds ruins influenciarem suas próximas decisões." },
      { title: "Comunicação", desc: "Aprimorar suas calls durante entradas pode aumentar ainda mais a eficiência coletiva da equipe." },
      { title: "Consistência", desc: "Buscar equilíbrio entre agressividade e inteligência tática pode elevar seu nível competitivo." },
      { title: "Disciplina", desc: "Nem toda situação exige confronto imediato. Saber desacelerar também faz parte de um grande Entry." }
    ],
    final_message: "Você possui perfil de jogador agressivo, decisivo e impactante. Sua iniciativa e confiança podem mudar completamente o ritmo de uma partida e abrir caminho para o sucesso da equipe. Continue evoluindo sua comunicação, estabilidade emocional e leitura de jogo.",
    tagline: "ENTRE. PRESSIONE. DOMINE. ESSE É O NEWMODE."
  },
  ANCHOR: {
    roleName: "ANCHOR",
    parabens: "Você parece ser um ótimo ANCHOR!",
    description: "Seu perfil apresenta características ideais para atuar como ANCHOR. Você demonstra calma, concentração e estabilidade emocional, fundamentais para segurar posições.",
    parabens_desc: "Você demonstra excelentes qualidades para segurar posições sob fogo cruzado, manter-se calmo em situações de desvantagem numérica e atuar bem sob pressão.",
    strengths: [
      { title: "Controle emocional", desc: "Você mantém a calma em momentos críticos." },
      { title: "Concentração", desc: "Seu foco permanece estável durante partidas longas e difíceis." },
      { title: "Decisão sob pressão", desc: "Você consegue pensar com clareza em situações importantes." },
      { title: "Consistência", desc: "Você demonstra confiabilidade dentro do servidor." }
    ],
    evolve: [
      { title: "Comunicação", desc: "Aprimorar suas informações pode aumentar ainda mais seu impacto defensivo." },
      { title: "Iniciativa", desc: "Em alguns momentos, assumir mais protagonismo pode beneficiar a equipe." },
      { title: "Confiança ofensiva", desc: "Trabalhar agressividade controlada pode tornar seu jogo mais completo." }
    ],
    final_message: "Você possui perfil extremamente confiável para momentos decisivos. Sua calma e estabilidade fazem diferença em rounds difíceis e situações de pressão. Continue evoluindo e mantendo sua consistência.",
    tagline: "RESISTA. CONTROLE. DECIDA. ESSE É O NEWMODE."
  }
};

function getIconForTitle(title, color = "currentColor") {
  const t = title.toLowerCase();
  if (t.includes("adaptabilidade")) {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={color} strokeWidth="2.5" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke={color} />
        <circle cx="12" cy="12" r="6" stroke={color} />
        <circle cx="12" cy="12" r="2" stroke={color} />
      </svg>
    );
  }
  if (t.includes("decisão") || t.includes("decidir") || t.includes("tomada")) {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
  }
  if (t.includes("controle emocional") || t.includes("consistência emocional") || t.includes("estabilidade") || t.includes("consistência")) {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    );
  }
  if (t.includes("comunicação") || t.includes("calls") || t.includes("clareza")) {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    );
  }
  if (t.includes("leitura") || t.includes("tática")) {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  }
  if (t.includes("liderança")) {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.477 3.477 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.477 3.477 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.477 3.477 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.477 3.477 0 013.138-3.138z" />
      </svg>
    );
  }
  if (t.includes("trabalho") || t.includes("equipe")) {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    );
  }
  if (t.includes("iniciativa") || t.includes("pressão") || t.includes("disciplina")) {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  if (t.includes("concentração") || t.includes("foco")) {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  }
  if (t.includes("confiança")) {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function RecruitHelmetIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12 flex-shrink-0" fill="none">
      <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" stroke="#FF2400" strokeWidth="4" fill="rgba(255, 36, 0, 0.15)" />
      <path d="M50,22 C34,22 30,30 30,45 C30,48 31,52 33,55 L35,53 C34,50 33,47 33,45 C33,35 37,27 50,27 C63,27 67,35 67,45 C67,47 66,50 65,53 L67,55 C69,52 70,48 70,45 C70,30 66,22 50,22 Z" fill="#FFFFFF" />
      <path d="M34,44 C34,41 38,39 50,39 C62,39 66,41 66,44 C66,47 62,49 50,49 C38,49 34,47 34,44 Z" fill="#FFFFFF" />
      <rect x="42" y="42" width="16" height="4" rx="1" fill="#18262C" />
      <path d="M38,56 C38,68 44,74 50,74 C56,74 62,68 62,56 C57,59 53,60 50,60 C47,60 43,59 38,56 Z" fill="#FFFFFF" />
      <circle cx="50" cy="67" r="2.5" fill="#18262C" />
      <rect x="44" y="62" width="2" height="4" fill="#18262C" />
      <rect x="54" y="62" width="2" height="4" fill="#18262C" />
    </svg>
  );
}

async function exportDossierPNG(node, callsign) {
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(node, {
    backgroundColor: "#0B1215",
    scale: 3,
    useCORS: true,
    logging: false,
    windowWidth: 1000,
  });
  const imgData = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  const safeName = (callsign || "operator").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  link.download = `newmode_loadout_${safeName}.png`;
  link.href = imgData;
  link.click();
}

async function exportDossierPDF(node, callsign) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(node, {
    backgroundColor: "#0B1215",
    scale: 2.5,
    useCORS: true,
    logging: false,
    windowWidth: 1000,
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const ratio = canvas.width / canvas.height;
  let w = maxW, h = maxW / ratio;
  if (h > maxH) { h = maxH; w = maxH * ratio; }
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;
  pdf.setFillColor(11, 18, 21);
  pdf.rect(0, 0, pageW, pageH, "F");
  pdf.addImage(imgData, "PNG", x, y, w, h, undefined, "FAST");
  const safeName = (callsign || "operator").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  pdf.save(`newmode_loadout_${safeName}.pdf`);
}

function ResultsScreen({ payload, onRestart }) {
  const { role_scores, winner_role, participant } = payload;
  const dossierRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const customTexts = CUSTOM_ROLE_TEXTS[winner_role] || CUSTOM_ROLE_TEXTS.FLEX;

  // Calculate winner score out of 100
  const rawWinnerScore = role_scores[winner_role] || 3.7;
  const generalScore = Math.min(100, Math.max(10, Math.round(rawWinnerScore * 20)));

  const handleExportPNG = async () => {
    if (!dossierRef.current || exporting) return;
    setExporting(true);
    try {
      await exportDossierPNG(dossierRef.current, participant.name);
    } catch (e) {
      console.error("[newmode_loadout] png export failed:", e);
      alert("Falha ao gerar Imagem. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!dossierRef.current || exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportDossierPDF(dossierRef.current, participant.name);
    } catch (e) {
      console.error("[newmode_loadout] pdf export failed:", e);
      alert("Falha ao gerar PDF. Tente novamente.");
    } finally {
      setExportingPdf(false);
    }
  };

  // Recharts radar data with 7 axes exactly like the user's reference image
  const radarData = [
    { subject: "Entry", value: Number(((role_scores.ENTRY || 3) * 1.6).toFixed(2)) },
    { subject: "IGL", value: Number(((role_scores.IGL || 3) * 1.6).toFixed(2)) },
    { subject: "Entry 2", value: Number(((role_scores.ENTRY_2 || 3) * 1.6).toFixed(2)) },
    { subject: "Suporte", value: Number(((role_scores.SUPPORT || 3) * 1.6).toFixed(2)) },
    { subject: "Flex", value: Number(((role_scores.FLEX || 3) * 1.6).toFixed(2)) },
    { subject: "Anchor", value: Number(((role_scores.ANCHOR || 3) * 1.6).toFixed(2)) },
    { subject: "Roamer", value: Number(((role_scores.ROAMER || 3) * 1.6).toFixed(2)) },
  ];

  return (
    <div className="min-h-screen px-5 py-6 flex flex-col items-center">
      <FontLoader />
      <NoiseBg />
      
      {/* Outer wrapper to prevent layout distortion and allow horizontal scroll on mobile */}
      <div className="w-full overflow-x-auto flex justify-center py-4">
        
        {/* Dossier Card Container (1000px wide for exact proportions) */}
        <div 
          ref={dossierRef} 
          className="w-[1000px] bg-[#0B1215] p-6 rounded-3xl border border-[#20333B] flex flex-col gap-4 text-white relative select-none"
          style={{ fontFamily: F.body }}
        >
          {/* Top Row: Info & Parabens */}
          <div className="grid grid-cols-12 gap-4">
            
            {/* Top Left Box: Seu Perfil */}
            <div className="col-span-6 bg-[#18262C] p-5 rounded-2xl border border-[#20333B] flex flex-col justify-between h-[220px]">
              <div className="flex items-center gap-4">
                <RecruitHelmetIcon />
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold tracking-wider text-white" style={{ fontFamily: F.display }}>
                    SEU PERFIL
                  </h2>
                  <span className="text-[10px] text-[#FF2400] font-bold tracking-widest">
                    ANÁLISE DE FUNÇÕES – R6
                  </span>
                </div>
              </div>
              
              <div className="bg-[#0B1215] p-4 rounded-xl border border-[#20333B] mt-3 flex-1 flex flex-col justify-center">
                <span className="text-[9px] text-[#9EB2B9] uppercase font-bold tracking-widest">
                  SUA FUNÇÃO
                </span>
                <span className="text-3xl font-extrabold text-[#FF2400] tracking-wider italic mt-0.5" style={{ fontFamily: F.display }}>
                  {customTexts.roleName}
                </span>
                <p className="text-[11px] text-[#9EB2B9] mt-1 leading-relaxed line-clamp-3">
                  {customTexts.description}
                </p>
              </div>
            </div>

            {/* Top Right Box: Parabens */}
            <div className="col-span-6 bg-[#18262C] p-5 rounded-2xl border border-[#20333B] flex flex-col h-[220px]">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#48BB78] fill-[#48BB78]" viewBox="0 0 24 24">
                  <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"/>
                </svg>
                <h3 className="text-sm font-bold text-[#48BB78] tracking-widest">
                  PARABÉNS!
                </h3>
              </div>
              
              <div className="mt-3 flex-1 flex flex-col justify-center">
                <span className="text-base font-bold text-white leading-tight">
                  {customTexts.parabens}
                </span>
                <p className="text-[11px] text-[#9EB2B9] mt-2 leading-relaxed">
                  {customTexts.parabens_desc}
                </p>
              </div>
            </div>

          </div>

          {/* Middle Row: Radar Chart & Strengths/Weaknesses */}
          <div className="grid grid-cols-12 gap-4">
            
            {/* Middle Left: Radar Chart Box */}
            <div className="col-span-7 bg-[#18262C] p-5 rounded-2xl border border-[#20333B] flex flex-col justify-between h-[420px]">
              <div>
                <h3 className="text-xs font-bold tracking-widest text-[#9EB2B9]">
                  SEU DESEMPENHO POR FUNÇÃO
                </h3>
              </div>
              
              <div className="flex-1 w-full h-[320px] flex items-center justify-center mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                    <PolarGrid stroke="#20333B" strokeWidth={1} />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#9EB2B9", fontSize: 10, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 8]}
                      tick={{ fill: "#5B767F", fontSize: 8 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#FF2400"
                      fill="#FF2400"
                      fillOpacity={0.25}
                      strokeWidth={2.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-[#9EB2B9] font-semibold">
                <span className="w-5 h-1.5 bg-[#FF2400] rounded" />
                <span>Score</span>
              </div>
            </div>

            {/* Middle Right: Strengths & Evolve */}
            <div className="col-span-5 flex flex-col gap-4 h-[420px]">
              
              {/* Upper Box: Strengths */}
              <div className="bg-[#18262C] p-4 rounded-2xl border border-[#20333B] flex-1 flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-[#48BB78] tracking-widest mb-3">
                  SEUS PONTOS FORTES
                </h3>
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {customTexts.strengths.map((s, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <div className="mt-0.5 text-[#48BB78]">
                        {getIconForTitle(s.title, "#48BB78")}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-[#48BB78] leading-none">
                          {s.title}
                        </span>
                        <p className="text-[10px] text-[#9EB2B9] mt-0.5 leading-snug">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lower Box: Points to Evolve */}
              <div className="bg-[#18262C] p-4 rounded-2xl border border-[#20333B] flex-1 flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-[#DD6B20] tracking-widest mb-3">
                  PONTOS DE ATENÇÃO
                </h3>
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {customTexts.evolve.map((e, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <div className="mt-0.5 text-[#DD6B20]">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="#DD6B20" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-[#DD6B20] leading-none">
                          {e.title}
                        </span>
                        <p className="text-[10px] text-[#9EB2B9] mt-0.5 leading-snug">
                          {e.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Row: Resumo Geral & Score Geral */}
          <div className="col-span-12 bg-[#18262C] p-5 rounded-2xl border border-[#20333B] flex justify-between items-center h-[120px]">
            
            {/* Left part: Resumo Geral */}
            <div className="flex-1 pr-6 border-r border-[#20333B] flex gap-3.5 items-center">
              <svg className="w-10 h-10 text-[#FF2400] flex-shrink-0" fill="none" stroke="#FF2400" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                <path d="M12 2a6 6 0 0 1 6 6v3c0 2.5-1.5 4.5-4 5.5h-4C7.5 15.5 6 13.5 6 11V8a6 6 0 0 1 6-6z" fill="rgba(255, 36, 0, 0.1)" />
              </svg>
              
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#FF2400] tracking-wider">
                  RESUMO GERAL
                </span>
                <p className="text-[10.5px] text-[#9EB2B9] mt-1.5 leading-relaxed line-clamp-3">
                  {customTexts.final_message}{" "}
                  <span className="text-[#FF2400] font-bold tracking-wider ml-1">
                    {customTexts.tagline}
                  </span>
                </p>
              </div>
            </div>

            {/* Right part: Score Geral */}
            <div className="w-[180px] pl-6 flex flex-col justify-center items-center">
              <span className="text-[9px] text-[#5B767F] uppercase font-bold tracking-widest">
                SCORE GERAL
              </span>
              <span className="text-4xl font-extrabold text-[#FF2400] tracking-tighter mt-1" style={{ fontFamily: F.display }}>
                {generalScore} <span className="text-lg text-[#5B767F] font-bold">/100</span>
              </span>
              
              {/* Small cyan bar underneath */}
              <div className="w-20 h-1 bg-[#20333B] rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-[#FF2400] rounded-full" 
                  style={{ width: `${generalScore}%` }} 
                />
              </div>
            </div>

          </div>

          {/* Footer Line */}
          <div className="text-center text-[9px] text-[#4A5568] tracking-wide mt-1.5">
            Análise baseada em desempenho, tomada de decisão, comunicação, controle emocional e adaptação tática.
          </div>

        </div>

      </div>

      {/* Buttons to download or restart */}
      <div className="w-full max-w-md mt-6 flex flex-col gap-3">
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleExportPNG}
            disabled={exporting}
            className="flex-1 py-4 font-bold tracking-[0.2em] text-xs font-bold"
            style={{
              fontFamily: F.mono,
              background: "transparent",
              color: C.primary,
              border: `1px solid ${C.primary}`,
              opacity: exporting ? 0.5 : 1,
              cursor: exporting ? "wait" : "pointer",
              ...cutCorners,
            }}
          >
            {exporting ? "GERANDO..." : "BAIXAR IMAGEM (PNG)"}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exportingPdf}
            className="flex-1 py-4 font-bold tracking-[0.2em] text-xs font-bold"
            style={{
              fontFamily: F.mono,
              background: "transparent",
              color: C.primary,
              border: `1px solid ${C.primary}`,
              opacity: exportingPdf ? 0.5 : 1,
              cursor: exportingPdf ? "wait" : "pointer",
              ...cutCorners,
            }}
          >
            {exportingPdf ? "GERANDO..." : "BAIXAR PDF"}
          </button>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 font-bold tracking-[0.3em]"
          style={{
            fontFamily: F.mono,
            background: C.primary,
            color: "#000",
            ...cutCorners,
            boxShadow: `0 0 24px ${C.primary}55`,
          }}
        >
          NEW OPERATOR ›››
        </button>

        <details className="mt-6">
          <summary
            className="cursor-pointer text-xs tracking-[0.3em]"
            style={{ fontFamily: F.mono, color: C.textDim }}
          >
            › PAYLOAD (DEBUG)
          </summary>
          <pre
            className="mt-2 p-3 overflow-auto text-[10px]"
            style={{
              fontFamily: F.mono,
              background: "#000",
              color: C.textMute,
              border: `1px solid ${C.border}`,
              maxHeight: 240,
            }}
          >
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

/* ============================================================
   CSV EXPORT & ADMIN SCREEN
   ============================================================ */

function downloadCSV(data) {
  const headers = [
    "ID", "Nome", "E-mail", "Idade", "Sexo", "WhatsApp", 
    "Funcao Ideal", "Score Geral", "Inicio", "Conclusao"
  ];
  
  const csvRows = [headers.join(",")];
  
  for (const row of data) {
    const values = [
      row.id,
      `"${(row.participant_name || "").replace(/"/g, '""')}"`,
      `"${(row.participant_email || "").replace(/"/g, '""')}"`,
      row.participant_age || "",
      row.participant_gender || "",
      `"${(row.participant_phone || "").replace(/"/g, '""')}"`,
      row.winner_role,
      row.role_scores && row.role_scores[row.winner_role] 
        ? Math.round(row.role_scores[row.winner_role] * 20) 
        : "",
      row.started_at || "",
      row.completed_at || ""
    ];
    csvRows.push(values.join(","));
  }
  
  const csvContent = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "newmode_loadout_results.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function AdminScreen({ onBack }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!hasSupabase) {
        setError("Supabase não configurado. Exibindo dados locais ou mockados.");
        setLoading(false);
        return;
      }
      try {
        const { data: rows, error: err } = await supabase
          .from("assessments")
          .select("*")
          .order("completed_at", { ascending: false });
        if (err) throw err;
        setData(rows || []);
      } catch (e) {
        setError(e.message || "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = () => {
    if (data.length === 0) {
      alert("Nenhum registro para exportar!");
      return;
    }
    downloadCSV(data);
  };

  return (
    <div className="min-h-screen px-5 py-6 flex flex-col">
      <FontLoader />
      <NoiseBg />
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b pb-3 mb-6" style={{ borderColor: C.border, fontFamily: F.mono }}>
          <div className="text-[10px] tracking-[0.3em]" style={{ color: C.primary }}>
            [ ADMIN DASHBOARD ]
          </div>
          <button onClick={onBack} className="text-xs text-[#718096] hover:text-white" style={{ fontFamily: F.mono }}>
            VOLTAR ›
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-wider" style={{ fontFamily: F.display }}>
            RESULTADOS DOS JOGADORES ({data.length})
          </h2>
          <button
            onClick={handleExport}
            disabled={loading}
            className="py-2.5 px-5 bg-[#38A169] text-black font-bold text-xs tracking-wider rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ fontFamily: F.mono }}
          >
            EXPORTAR CSV (EXCEL)
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-xs tracking-widest text-[#718096]" style={{ fontFamily: F.mono }}>
            CARREGANDO DADOS...
          </div>
        ) : error && data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-2xl" style={{ borderColor: C.border }}>
            <span className="text-xs text-[#E63946] font-semibold" style={{ fontFamily: F.mono }}>{error}</span>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto border rounded-xl" style={{ borderColor: C.border, background: C.surface }}>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: C.border, background: "#0A0D14" }}>
                  <th className="p-3 font-semibold text-[#718096]" style={{ fontFamily: F.mono }}>JOGADOR</th>
                  <th className="p-3 font-semibold text-[#718096]" style={{ fontFamily: F.mono }}>E-MAIL</th>
                  <th className="p-3 font-semibold text-[#718096]" style={{ fontFamily: F.mono }}>IDADE</th>
                  <th className="p-3 font-semibold text-[#718096]" style={{ fontFamily: F.mono }}>SEXO</th>
                  <th className="p-3 font-semibold text-[#718096]" style={{ fontFamily: F.mono }}>WHATSAPP</th>
                  <th className="p-3 font-semibold text-[#718096]" style={{ fontFamily: F.mono }}>FUNÇÃO</th>
                  <th className="p-3 font-semibold text-[#718096]" style={{ fontFamily: F.mono }}>SCORE</th>
                  <th className="p-3 font-semibold text-[#718096]" style={{ fontFamily: F.mono }}>DATA</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: C.border }}>
                {data.map((row) => {
                  const score = row.role_scores && row.role_scores[row.winner_role]
                    ? Math.round(row.role_scores[row.winner_role] * 20)
                    : "-";
                  const date = row.completed_at 
                    ? new Date(row.completed_at).toLocaleDateString("pt-BR")
                    : "-";
                  return (
                    <tr key={row.id} className="hover:bg-[#1A2233]">
                      <td className="p-3 font-bold text-white">{row.participant_name}</td>
                      <td className="p-3 text-[#A0AEC0]">{row.participant_email || "-"}</td>
                      <td className="p-3 text-[#A0AEC0]">{row.participant_age || "-"}</td>
                      <td className="p-3 text-[#A0AEC0]">{row.participant_gender || "-"}</td>
                      <td className="p-3 text-[#A0AEC0]">{row.participant_phone || "-"}</td>
                      <td className="p-3 font-bold text-[#FF2400]">{row.winner_role}</td>
                      <td className="p-3 font-bold text-white">{score}</td>
                      <td className="p-3 text-[#A0AEC0]">{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */

export default function App() {
  const [stage, setStage] = useState("welcome");
  const [participant, setParticipant] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [resultPayload, setResultPayload] = useState(null);
  const [hasResume, setHasResume] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const saved = loadState();
    if (saved && saved.stage === "question" && saved.participant) setHasResume(true);
    
    // Check if URL has ?admin=true
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true") {
      setStage("admin");
    }
  }, []);

  useEffect(() => {
    if (stage === "question") saveState({ stage, participant, answers, currentIdx });
  }, [stage, participant, answers, currentIdx]);

  const handleStart = (p) => {
    clearState();
    setParticipant(p);
    setAnswers({});
    setCurrentIdx(0);
    setStage("question");
    setHasResume(false);
  };

  const handleResume = () => {
    const s = loadState();
    if (!s) return;
    setParticipant(s.participant);
    setAnswers(s.answers || {});
    setCurrentIdx(s.currentIdx || 0);
    setStage("question");
    setHasResume(false);
  };

  const handleDiscardResume = () => { clearState(); setHasResume(false); };

  const handleAnswer = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = () => {
    const all = QUESTIONS.every((q) => typeof answers[q.id] === "number");
    if (!all) return;
    finalize(answers);
  };

  const finalize = async (finalAnswers) => {
    setStage("submitting");
    const dimensions = computeDimensions(finalAnswers);
    const roleScores = computeRoles(dimensions);
    const winner = pickWinner(roleScores);
    const payload = buildPayload({ participant, answers: finalAnswers, dimensions, roleScores, winner });
    try {
      await submitToBackend(payload);
      setSubmitError(null);
    } catch (err) {
      console.error("[newmode_mind] submit error:", err);
      setSubmitError(err.message || "Erro");
    } finally {
      setResultPayload(payload);
      clearState();
      setStage("results");
    }
  };

  const handleRestart = () => {
    setParticipant(null);
    setAnswers({});
    setCurrentIdx(0);
    setResultPayload(null);
    setSubmitError(null);
    setStage("welcome");
  };

  const handleAdminClick = () => {
    const pwd = prompt("Digite a senha de administrador:");
    if (pwd === "newmodeadmin123" || pwd === "admin") {
      setStage("admin");
    } else if (pwd !== null) {
      alert("Senha incorreta!");
    }
  };

  if (stage === "welcome") {
    return (
      <WelcomeScreen
        onStart={handleStart}
        hasResume={hasResume}
        onResume={handleResume}
        onDiscardResume={handleDiscardResume}
        onAdminClick={handleAdminClick}
      />
    );
  }

  if (stage === "admin") {
    return <AdminScreen onBack={() => setStage("welcome")} />;
  }

  if (stage === "question") {
    return (
      <QuestionListScreen
        answers={answers}
        onAnswer={handleAnswer}
        onSubmit={handleSubmit}
        submitting={false}
      />
    );
  }

  if (stage === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FontLoader />
        <NoiseBg />
        <div
          className="tracking-[0.4em] animate-pulse text-sm"
          style={{ fontFamily: F.mono, color: C.primary }}
        >
          ››› ANALYZING OPERATOR PROFILE ‹‹‹
        </div>
      </div>
    );
  }

  if (stage === "results" && resultPayload) {
    return (
      <>
        {submitError && (
          <div
            className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1 text-[10px] tracking-[0.3em]"
            style={{
              fontFamily: F.mono,
              background: C.danger,
              color: "#fff",
            }}
          >
            ⚠ OFFLINE — LOCAL RESULT
          </div>
        )}
        <ResultsScreen payload={resultPayload} onRestart={handleRestart} />
      </>
    );
  }

  return null;
}
