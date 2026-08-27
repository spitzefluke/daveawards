/*
 * DaveAwards – Beispiel-/Platzhalterdaten.
 *
 * WICHTIG: Die Kategorien-Texte sind Vorschläge, die Nominierten sind
 * frei erfundene Platzhalter (KEINE echten Zuschauer/innen). Vor dem
 * echten Launch bitte:
 *   1. Kategorien nach Bedarf anpassen/umbenennen.
 *   2. "nominees" durch echte, mit Einverständnis eingereichte
 *      Community-Vorschläge ersetzen.
 *   3. "seedVotes" auf 0 setzen (dient hier nur der Demo-Optik).
 */

const VOTING_DEADLINE = "2026-11-30T23:59:59+01:00";

const CATEGORIES = [
  {
    id: "clip-des-jahres",
    icon: "🎬",
    name: "Clip des Jahres",
    description: "Der Stream-Moment, der am meisten im Gedächtnis geblieben ist.",
    nominees: [
      { id: "n1", name: "Beispiel_Nominee_1", tagline: "eingereicht von der Community", seedVotes: 128 },
      { id: "n2", name: "Beispiel_Nominee_2", tagline: "eingereicht von der Community", seedVotes: 96 },
      { id: "n3", name: "Beispiel_Nominee_3", tagline: "eingereicht von der Community", seedVotes: 74 },
      { id: "n4", name: "Beispiel_Nominee_4", tagline: "eingereicht von der Community", seedVotes: 51 }
    ]
  },
  {
    id: "lustigster-moment",
    icon: "😂",
    name: "Lustigster Moment",
    description: "Bei diesem Clip hat der ganze Chat Tränen gelacht.",
    nominees: [
      { id: "n1", name: "Beispiel_Nominee_5", tagline: "eingereicht von der Community", seedVotes: 143 },
      { id: "n2", name: "Beispiel_Nominee_6", tagline: "eingereicht von der Community", seedVotes: 110 },
      { id: "n3", name: "Beispiel_Nominee_7", tagline: "eingereicht von der Community", seedVotes: 62 }
    ]
  },
  {
    id: "community-mvp",
    icon: "🏆",
    name: "Community-MVP",
    description: "Das Mitglied, das die Community das ganze Jahr über bereichert hat.",
    nominees: [
      { id: "n1", name: "Beispiel_MVP_1", tagline: "aktives Community-Mitglied", seedVotes: 201 },
      { id: "n2", name: "Beispiel_MVP_2", tagline: "aktives Community-Mitglied", seedVotes: 178 },
      { id: "n3", name: "Beispiel_MVP_3", tagline: "aktives Community-Mitglied", seedVotes: 90 },
      { id: "n4", name: "Beispiel_MVP_4", tagline: "aktives Community-Mitglied", seedVotes: 66 }
    ]
  },
  {
    id: "bestes-fanart",
    icon: "🎨",
    name: "Bestes Fanart",
    description: "Die kreativste Fan-Kunst rund um den Kanal.",
    nominees: [
      { id: "n1", name: "Beispiel_Artist_1", tagline: "Fanart-Einreichung", seedVotes: 88 },
      { id: "n2", name: "Beispiel_Artist_2", tagline: "Fanart-Einreichung", seedVotes: 71 },
      { id: "n3", name: "Beispiel_Artist_3", tagline: "Fanart-Einreichung", seedVotes: 54 }
    ]
  },
  {
    id: "bestes-meme",
    icon: "🖼️",
    name: "Bestes Meme",
    description: "Das Meme, das in keinem Chat-Rückblick fehlen darf.",
    nominees: [
      { id: "n1", name: "Beispiel_Meme_1", tagline: "eingereicht von der Community", seedVotes: 132 },
      { id: "n2", name: "Beispiel_Meme_2", tagline: "eingereicht von der Community", seedVotes: 99 },
      { id: "n3", name: "Beispiel_Meme_3", tagline: "eingereicht von der Community", seedVotes: 47 }
    ]
  },
  {
    id: "newcomer-des-jahres",
    icon: "🌟",
    name: "Newcomer des Jahres",
    description: "Neu in der Community und trotzdem schon nicht mehr wegzudenken.",
    nominees: [
      { id: "n1", name: "Beispiel_Newcomer_1", tagline: "seit diesem Jahr dabei", seedVotes: 64 },
      { id: "n2", name: "Beispiel_Newcomer_2", tagline: "seit diesem Jahr dabei", seedVotes: 58 },
      { id: "n3", name: "Beispiel_Newcomer_3", tagline: "seit diesem Jahr dabei", seedVotes: 39 }
    ]
  },
  {
    id: "bester-mod",
    icon: "🛡️",
    name: "Bester Mod / Helfer im Chat",
    description: "Hält den Chat am Laufen und immer ein offenes Ohr für Neue.",
    nominees: [
      { id: "n1", name: "Beispiel_Mod_1", tagline: "Moderation / Chat-Support", seedVotes: 156 },
      { id: "n2", name: "Beispiel_Mod_2", tagline: "Moderation / Chat-Support", seedVotes: 121 },
      { id: "n3", name: "Beispiel_Mod_3", tagline: "Moderation / Chat-Support", seedVotes: 83 }
    ]
  },
  {
    id: "treuester-mitfahrer",
    icon: "🚆",
    name: "Treuester Mitfahrer",
    description: "Community-Choice-Award für Treue und Herzblut – der Publikumsliebling.",
    nominees: [
      { id: "n1", name: "Beispiel_Mitfahrer_1", tagline: "Publikumsliebling", seedVotes: 245 },
      { id: "n2", name: "Beispiel_Mitfahrer_2", tagline: "Publikumsliebling", seedVotes: 198 },
      { id: "n3", name: "Beispiel_Mitfahrer_3", tagline: "Publikumsliebling", seedVotes: 112 },
      { id: "n4", name: "Beispiel_Mitfahrer_4", tagline: "Publikumsliebling", seedVotes: 87 }
    ]
  }
];

/*
 * Gewinner vergangener Ausgaben. Leer, bis die erste Ausgabe von
 * DaveAwards tatsächlich stattgefunden hat.
 */
const PAST_WINNERS = [];
