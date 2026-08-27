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

const SUPABASE_URL = "https://dugksmwdimambkigtreh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Z2tzbXdkaW1hbWJraWd0cmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDQ3MDgsImV4cCI6MjEwMzQyMDcwOH0.OSiMZmiUyfuqy95A2N55uLVcZin6i0GaaKdeHt_9eZo";

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
