/*
 * DaveAwards – Konfiguration & Kategorien.
 *
 * SITE_PHASE steuert, was normale Besucher:innen auf der Seite sehen:
 *   "submission" – Einreichungsphase läuft, Kategorien/Voting gesperrt.
 *   "voting"     – Voting ist offen (Funktion folgt in einem späteren Ausbau).
 *   "closed"     – Runde beendet, nur noch Gewinner-Seite relevant.
 *
 * Der Jury-Bereich (jury.html) ist von SITE_PHASE unabhängig und läuft
 * über einen eigenen Supabase-Login, unabhängig von dieser Einstellung.
 */

const SITE_PHASE = "submission";

const SUBMISSION_DEADLINE = "2026-10-15T23:59:59+02:00";

const CATEGORIES = [
  {
    id: "clip-des-jahres",
    icon: "🎬",
    name: "Clip des Jahres",
    description: "Der Stream-Moment, der am meisten im Gedächtnis geblieben ist."
  },
  {
    id: "lustigster-moment",
    icon: "😂",
    name: "Lustigster Moment",
    description: "Bei diesem Clip hat der ganze Chat Tränen gelacht."
  },
  {
    id: "community-mvp",
    icon: "🏆",
    name: "Community-MVP",
    description: "Das Mitglied, das die Community das ganze Jahr über bereichert hat."
  },
  {
    id: "bestes-fanart",
    icon: "🎨",
    name: "Bestes Fanart",
    description: "Die kreativste Fan-Kunst rund um den Kanal."
  },
  {
    id: "bestes-meme",
    icon: "🖼️",
    name: "Bestes Meme",
    description: "Das Meme, das in keinem Chat-Rückblick fehlen darf."
  },
  {
    id: "newcomer-des-jahres",
    icon: "🌟",
    name: "Newcomer des Jahres",
    description: "Neu in der Community und trotzdem schon nicht mehr wegzudenken."
  },
  {
    id: "bester-mod",
    icon: "🛡️",
    name: "Bester Mod / Helfer im Chat",
    description: "Hält den Chat am Laufen und immer ein offenes Ohr für Neue."
  },
  {
    id: "treuester-mitfahrer",
    icon: "🚆",
    name: "Treuester Mitfahrer",
    description: "Community-Choice-Award für Treue und Herzblut – der Publikumsliebling."
  }
];

/*
 * Gewinner vergangener Ausgaben. Leer, bis die erste Ausgabe von
 * DaveAwards tatsächlich stattgefunden hat.
 */
const PAST_WINNERS = [];

const SUBMISSION_STATUS_LABELS = {
  pending: "Offen",
  passend: "Passend",
  unpassend: "Unpassend",
  falsche_kategorie: "Falsche Kategorie"
};
