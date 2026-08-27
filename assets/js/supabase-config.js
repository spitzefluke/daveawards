/*
 * DaveAwards – Supabase-Zugangsdaten.
 *
 * SUPABASE_URL und SUPABASE_ANON_KEY sind der "öffentliche" Projekt-Key
 * (nicht der geheime service_role-Key!). Dieser darf im Client-Code
 * stehen – der eigentliche Schutz läuft über die Row-Level-Security-
 * Regeln in supabase/schema.sql, nicht über die Geheimhaltung dieses Keys.
 *
 * Werte findest du im Supabase-Dashboard unter:
 * Project Settings → API → "Project URL" und "anon public" key.
 */

const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

const supabaseClient =
  typeof supabase !== "undefined" &&
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR-PROJECT")
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

if (!supabaseClient) {
  console.warn(
    "[DaveAwards] Supabase ist noch nicht konfiguriert – siehe assets/js/supabase-config.js und README.md."
  );
}
