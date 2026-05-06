import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.warn(
    "[newmode_loadout] VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY ausente — submissoes ficarao em modo offline (apenas console.log)."
  );
}

// db.schema fixa todas as queries em `loadout` — schema precisa estar
// listado em Settings -> API -> Exposed schemas no painel Supabase.
export const supabase =
  url && key
    ? createClient(url, key, { db: { schema: "loadout" } })
    : null;

export const hasSupabase = !!supabase;
