import { useState, useEffect, useRef } from "react";
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
  bg:        "#0B0B0D",
  surface:   "#15151A",
  elevated:  "#1F1F26",
  border:    "#2A2A33",
  primary:   "#FF6B00",   // laranja R6
  primaryDk: "#CC4B00",
  accent:    "#FFC107",   // amarelo HUD
  danger:    "#E63946",   // vermelho ataque
  defense:   "#4A9EFF",   // azul defesa
  text:      "#F4F4F5",
  textMute:  "#8A8A92",
  textDim:   "#5A5A62",
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

/* ---- 27 perguntas ---- */
const QUESTIONS = [
  { id: "ab1", dim: "abertura",       text: "Me adapto rápido" },
  { id: "ab2", dim: "abertura",       text: "Busco soluções diferentes" },
  { id: "ab3", dim: "abertura",       text: "Improviso bem" },
  { id: "co1", dim: "consciencia",    text: "Sigo o plano do time" },
  { id: "co2", dim: "consciencia",    text: "Presto atenção nos detalhes" },
  { id: "co3", dim: "consciencia",    text: "Cumpro minha função" },
  { id: "ex1", dim: "extroversao",    text: "Me comunico bastante" },
  { id: "ex2", dim: "extroversao",    text: "Tomo iniciativa" },
  { id: "ex3", dim: "extroversao",    text: "Jogo de forma ativa" },
  { id: "ag1", dim: "agradabilidade", text: "Priorizo o time" },
  { id: "ag2", dim: "agradabilidade", text: "Escuto meus companheiros" },
  { id: "ag3", dim: "agradabilidade", text: "Evito conflitos" },
  { id: "ne1", dim: "neuroticismo",   text: "Fico nervoso fácil" },
  { id: "ne2", dim: "neuroticismo",   text: "Me abalo com erros" },
  { id: "ne3", dim: "neuroticismo",   text: "Perco o foco fácil" },
  { id: "cf1", dim: "confianca",      text: "Confio nas decisões" },
  { id: "cf2", dim: "confianca",      text: "Não hesito nas jogadas" },
  { id: "cf3", dim: "confianca",      text: "Me sinto seguro jogando" },
  { id: "cc1", dim: "concentracao",   text: "Mantenho foco por longo tempo" },
  { id: "cc2", dim: "concentracao",   text: "Não me distraio fácil" },
  { id: "cc3", dim: "concentracao",   text: "Ignoro distrações" },
  { id: "pr1", dim: "pressao",        text: "Jogo bem sob pressão" },
  { id: "pr2", dim: "pressao",        text: "Decido bem sob pressão" },
  { id: "pr3", dim: "pressao",        text: "Rendo mais em jogos tensos" },
  { id: "ad1", dim: "adversidade",    text: "Continuo jogando bem mesmo quando estou perdendo" },
  { id: "ad2", dim: "adversidade",    text: "Consigo me recuperar rápido após erros" },
  { id: "ad3", dim: "adversidade",    text: "Não desisto fácil em partidas difíceis" },
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
};

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
  let win = null, max = -Infinity;
  for (const [k, v] of Object.entries(scores)) if (v > max) { max = v; win = k; }
  return win;
}

function buildPayload({ participant, answers, dimensions, roleScores, winner }) {
  return {
    schema_version: 1,
    participant_id: participant.id,
    participant: { name: participant.name, phone: participant.phone || null },
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
  // TODO: Supabase RPC submit_assessment
  await new Promise((r) => setTimeout(r, 400));
  console.log("[newmode_mind] payload:", payload);
  return { ok: true, payload };
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
      "https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
}

const F = {
  display: "Saira Condensed, Impact, sans-serif",
  body:    "Manrope, system-ui, sans-serif",
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
            `radial-gradient(circle at 15% 0%, rgba(255,107,0,0.10), transparent 45%),
             radial-gradient(circle at 85% 100%, rgba(74,158,255,0.07), transparent 45%)`,
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

function HudHeader() {
  return (
    <div
      className="flex items-center justify-between border-b pb-3 mb-6"
      style={{ borderColor: C.border, fontFamily: F.mono }}
    >
      <div className="flex items-center gap-2 text-[10px] tracking-[0.3em]" style={{ color: C.primary }}>
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

function WelcomeScreen({ onStart, hasResume, onResume, onDiscardResume }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = name.trim().length >= 2;

  return (
    <div className="min-h-screen flex flex-col px-5 py-6">
      <FontLoader />
      <NoiseBg />
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <HudHeader />

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
            27 perguntas rápidas. No final, identificamos seu papel:{" "}
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
              › CALLSIGN <span style={{ color: C.danger }}>*</span>
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
                border: `1px solid ${touched && !valid ? C.danger : C.border}`,
                color: C.text,
              }}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
            />
            {touched && !valid && (
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

        <button
          disabled={!valid}
          onClick={() =>
            onStart({
              id: uuid(),
              name: name.trim(),
              phone: phone.trim(),
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
   QUESTION
   ============================================================ */

function QuestionScreen({ question, index, total, currentAnswer, onAnswer, onBack }) {
  const dim = DIMENSIONS[question.dim];
  return (
    <div className="min-h-screen flex flex-col px-5 py-6">
      <FontLoader />
      <NoiseBg />
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <HudHeader />
        <ProgressBar current={index + 1} total={total} />

        <div className="mt-10 flex-1 flex flex-col">
          <div
            className="text-[10px] tracking-[0.4em] mb-3 flex items-center gap-2"
            style={{ fontFamily: F.mono, color: C.primary }}
          >
            <span>›</span> {dim.label.toUpperCase()}
          </div>

          <h2
            className="uppercase leading-[0.95] mb-10"
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: "clamp(32px, 8vw, 50px)",
              color: C.text,
            }}
          >
            {question.text}
          </h2>

          <div className="space-y-2 mb-8">
            {SCALE.map((s) => {
              const selected = currentAnswer === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => onAnswer(s.value)}
                  className="w-full flex items-center gap-4 px-4 py-4 text-left transition-all active:scale-[0.99]"
                  style={{
                    fontFamily: F.body,
                    background: selected ? "rgba(255,107,0,0.10)" : C.surface,
                    border: `1px solid ${selected ? C.primary : C.border}`,
                    color: selected ? C.text : C.textMute,
                  }}
                >
                  <span
                    className="w-11 h-11 flex items-center justify-center font-bold text-lg shrink-0"
                    style={{
                      fontFamily: F.mono,
                      background: selected ? C.primary : "rgba(255,255,255,0.04)",
                      color: selected ? "#000" : C.text,
                    }}
                  >
                    {s.value}
                  </span>
                  <span className={selected ? "font-semibold" : ""}>{s.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-auto">
            <button
              onClick={onBack}
              disabled={index === 0}
              className="text-xs tracking-[0.3em] disabled:opacity-25 disabled:cursor-not-allowed"
              style={{ fontFamily: F.mono, color: C.textMute }}
            >
              ‹‹‹ BACK
            </button>
            <span
              className="text-[10px] tracking-[0.3em]"
              style={{ fontFamily: F.mono, color: C.textDim }}
            >
              SCALE 1—5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   RESULTS
   ============================================================ */

async function exportDossierPDF(node, callsign) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(node, {
    backgroundColor: C.bg,
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: node.scrollWidth,
    windowHeight: node.scrollHeight,
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
  pdf.setFillColor(11, 11, 13);
  pdf.rect(0, 0, pageW, pageH, "F");
  pdf.addImage(imgData, "PNG", x, y, w, h, undefined, "FAST");
  const safeName = (callsign || "operator").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  pdf.save(`newmode_loadout_${safeName}.pdf`);
}

function InstagramFooter() {
  return (
    <div
      className="flex items-center justify-center gap-2 py-5"
      style={{ fontFamily: F.mono, color: C.textMute }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
      <span className="text-xs tracking-[0.3em]" style={{ color: C.text, fontWeight: 600 }}>
        @NEWMODEGG
      </span>
    </div>
  );
}

function ResultsScreen({ payload, onRestart }) {
  const { dimensions, role_scores, winner_role, participant } = payload;
  const winner = ROLES[winner_role];
  const dossierRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!dossierRef.current || exporting) return;
    setExporting(true);
    try {
      await exportDossierPDF(dossierRef.current, participant.name);
    } catch (e) {
      console.error("[newmode_loadout] pdf export failed:", e);
      alert("Falha ao gerar PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  const radarData = Object.entries(DIMENSIONS).map(([key, meta]) => ({
    dim: meta.radarLabel,
    value: meta.invert ? 5 - dimensions[key] : dimensions[key],
  }));

  const barData = Object.values(ROLES)
    .map((r) => ({
      code: r.code,
      score: Number(role_scores[r.code].toFixed(2)),
      color: r.color,
      isWinner: r.code === winner_role,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen px-5 py-6">
      <FontLoader />
      <NoiseBg />
      <div className="max-w-md mx-auto">
        <HudHeader />

        <div ref={dossierRef} style={{ background: C.bg }}>

        {/* dossier card */}
        <div
          className="border p-5 mb-6"
          style={{
            ...cutCorners,
            borderColor: winner.color,
            background: `linear-gradient(135deg, ${winner.color}11, transparent 60%), ${C.surface}`,
            boxShadow: `0 0 32px ${winner.color}22`,
          }}
        >
          <div
            className="text-[10px] tracking-[0.4em] mb-2 flex items-center justify-between"
            style={{ fontFamily: F.mono, color: winner.color }}
          >
            <span>› OPERATOR DOSSIER</span>
            <span style={{ color: C.textDim }}>{winner.side}</span>
          </div>
          <div
            className="text-sm mb-1"
            style={{ fontFamily: F.body, color: C.textMute }}
          >
            CALLSIGN: <span style={{ color: C.text, fontWeight: 600 }}>{participant.name}</span>
          </div>
          <h1
            className="leading-none uppercase my-3"
            style={{
              fontFamily: F.display,
              fontWeight: 800,
              fontSize: "clamp(72px, 22vw, 120px)",
              color: winner.color,
              letterSpacing: "-0.02em",
              textShadow: `0 0 40px ${winner.color}66`,
            }}
          >
            {winner.code}
          </h1>
          <div
            className="text-base mb-3"
            style={{ fontFamily: F.body, color: C.text, fontWeight: 600 }}
          >
            {winner.title}
          </div>
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: F.body, color: C.textMute }}
          >
            {winner.desc}
          </p>
        </div>

        {/* ranking */}
        <div className="mb-8">
          <div
            className="text-[10px] tracking-[0.4em] mb-3"
            style={{ fontFamily: F.mono, color: C.primary }}
          >
            › COMPATIBILITY RANKING
          </div>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 4, right: 50, left: 0, bottom: 0 }}
              >
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis
                  type="category"
                  dataKey="code"
                  tick={{ fill: C.text, fontFamily: F.mono, fontSize: 13, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Bar dataKey="score" barSize={26}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.color} fillOpacity={d.isWinner ? 1 : 0.3} />
                  ))}
                  <LabelList
                    dataKey="score"
                    position="right"
                    style={{ fill: C.text, fontFamily: F.mono, fontSize: 12, fontWeight: 700 }}
                    formatter={(v) => v.toFixed(2)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* radar */}
        <div className="mb-6">
          <div
            className="text-[10px] tracking-[0.4em] mb-3"
            style={{ fontFamily: F.mono, color: C.primary }}
          >
            › PSYCHOLOGICAL PROFILE
          </div>
          <div
            className="border p-3"
            style={{ borderColor: C.border, background: C.surface, ...cutCorners }}
          >
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke={C.border} />
                  <PolarAngleAxis
                    dataKey="dim"
                    tick={{ fill: C.text, fontFamily: F.mono, fontSize: 9, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 5]}
                    tick={{ fill: C.textDim, fontSize: 9 }}
                    axisLine={false}
                  />
                  <Radar
                    dataKey="value"
                    stroke={winner.color}
                    fill={winner.color}
                    fillOpacity={0.35}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div
              className="text-[9px] text-center mt-1 tracking-[0.2em]"
              style={{ fontFamily: F.mono, color: C.textDim }}
            >
              * ESTABILIDADE = (5 − NEUROTICISMO)
            </div>
          </div>
        </div>

        {/* dimensões grid */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          {Object.entries(DIMENSIONS).map(([key, meta]) => (
            <div
              key={key}
              className="border p-2"
              style={{ borderColor: C.border, background: C.surface }}
            >
              <div
                className="text-[8px] tracking-[0.2em] mb-1 truncate"
                style={{ fontFamily: F.mono, color: C.textMute }}
              >
                {meta.label.toUpperCase()}
              </div>
              <div
                className="text-xl"
                style={{ fontFamily: F.mono, color: C.text, fontWeight: 700 }}
              >
                {dimensions[key].toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <InstagramFooter />

        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full py-4 font-bold tracking-[0.3em] mb-3"
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
          {exporting ? "GENERATING..." : "EXPORT PDF ›››"}
        </button>

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

  const handleAnswer = (value) => {
    const q = QUESTIONS[currentIdx];
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (currentIdx < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentIdx(currentIdx + 1), 180);
    } else {
      finalize(next);
    }
  };

  const handleBack = () => { if (currentIdx > 0) setCurrentIdx(currentIdx - 1); };

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

  if (stage === "welcome") {
    return (
      <WelcomeScreen
        onStart={handleStart}
        hasResume={hasResume}
        onResume={handleResume}
        onDiscardResume={handleDiscardResume}
      />
    );
  }

  if (stage === "question") {
    const q = QUESTIONS[currentIdx];
    return (
      <QuestionScreen
        question={q}
        index={currentIdx}
        total={QUESTIONS.length}
        currentAnswer={answers[q.id]}
        onAnswer={handleAnswer}
        onBack={handleBack}
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
