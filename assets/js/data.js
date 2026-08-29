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

const SUBMISSION_DEADLINE = "2026-11-16T23:59:59+01:00";

/*
 * Gewichtung des finalen Votings. Muss in Summe 1 (100%) ergeben und
 * exakt zu den Prozentwerten in supabase/schema.sql (weighted_results-
 * View) sowie den Texten in regeln.html passen – bei Änderung also alle
 * drei Stellen aktualisieren.
 */
const VOTE_WEIGHTS = {
  jury: 0.15,
  streamer_jury: 0.25,
  community: 0.6
};

const VOTER_TYPE_LABELS = {
  jury: "Jury",
  streamer_jury: "Streamer-Jury",
  community: "Community"
};

const CATEGORIES = [
  {
    id: "wtf-was-passiert-hier",
    icon: "🤯",
    name: "WTF – was passiert hier",
    description: "Der Moment, bei dem im Chat nur noch Fragezeichen standen."
  },
  {
    id: "bester-rage",
    icon: "😡",
    name: "Bester Rage",
    description: "Die legendärste Rage-Reaktion des Jahres."
  },
  {
    id: "bester-versprecher",
    icon: "😅",
    name: "Bester Versprecher",
    description: "Der Versprecher, über den heute noch gelacht wird."
  },
  {
    id: "bester-fail",
    icon: "🤦",
    name: "Bester Fail",
    description: "Der peinlichste, unfreiwillig lustigste Fail des Jahres."
  },
  {
    id: "bestes-duo",
    icon: "👯",
    name: "Bestes Duo",
    description: "Zwei Personen, die als Team einfach unschlagbar sind. Bitte im Formular beide Namen nennen."
  },
  {
    id: "lustigster-moment",
    icon: "😂",
    name: "Lustigster Moment",
    description: "Bei diesem Clip hat der ganze Chat Tränen gelacht."
  },
  {
    id: "suessester-moment",
    icon: "🥰",
    name: "Süßester Moment",
    description: "Der Moment, der der Community ein 🥰 entlockt hat."
  },
  {
    id: "clip-des-jahres",
    icon: "🎬",
    name: "Clip des Jahres",
    description: "Der Stream-Moment, der am meisten im Gedächtnis geblieben ist."
  },
  {
    id: "bester-offstream-moment",
    icon: "📸",
    name: "Bester Offstream-Moment",
    description: "Das Highlight abseits des eigentlichen Streams – z. B. von Treffen, Reisen oder Community-Events."
  },
  {
    id: "bestes-event",
    icon: "🎉",
    name: "Bestes Event",
    description: "Das beste Community- oder Stream-Event des Jahres. Bitte im Formular den Namen des Events nennen."
  },
  {
    id: "beste-zuschaueraktion",
    icon: "🎁",
    name: "Beste Zuschaueraktion",
    description: "Die geilste Aktion aus der Community – Spende, Überraschung oder Aktion, die den Stream bereichert hat."
  },
  {
    id: "community-mvp",
    icon: "🏆",
    name: "Community-MVP",
    description: "Das Mitglied, das die Community das ganze Jahr über bereichert hat. Bitte im Formular den Namen nennen."
  },
  {
    id: "bestes-artwork",
    icon: "🎨",
    name: "Bestes Artwork",
    description: "Das kreativste Fan-Artwork rund um den Kanal."
  },
  {
    id: "beste-song-performance",
    icon: "🎤",
    name: "Beste Song-Performance",
    description: "Der beste musikalische Moment im Stream."
  },
  {
    id: "bester-gaming-moment",
    icon: "🎮",
    name: "Bester Gaming-Moment",
    description: "Der stärkste In-Game-Moment des Jahres – Clutch, Play oder einfach nur episch."
  },
  {
    id: "bester-win",
    icon: "🥇",
    name: "Bester Win",
    description: "Der geilste, unwahrscheinlichste oder verdienteste Sieg des Jahres."
  }
];

/*
 * Für diese Kategorien zählt vor allem WER/WAS nominiert wird (zwei
 * Personen, ein Event, ein Community-Mitglied), nicht nur der Clip-Link.
 * Steuert den Platzhalter-Text im Begründungsfeld auf teilnehmen.html.
 */
const CATEGORY_NOTE_HINTS = {
  "bestes-duo": "Namen der beiden Personen + kurze Begründung",
  "bestes-event": "Name des Events + kurze Begründung",
  "community-mvp": "Name des Community-Mitglieds + kurze Begründung"
};

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
