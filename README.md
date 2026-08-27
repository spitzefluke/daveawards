# 🚆 DaveAwards

Ein inoffizielles Fanprojekt im Stil von [streamawards.de](https://streamawards.de/) –
für die Community von **Zugfahrer_DaveTV**.

DaveAwards ist eine statische Website (reines HTML/CSS/JS, kein Build-Schritt
nötig) mit:

- **Startseite** mit Hero, Ablauf-Erklärung und Kategorie-Teasern
- **Countdown** bis zum Ende der Votingphase
- **Kategorien & Voting** – Nominierten-Karten mit Stimmen-Balken; Voting läuft
  clientseitig über `localStorage` (eine Stimme pro Kategorie und Gerät)
- **Regeln & FAQ** – Ablauf, Fair-Play-Regeln, häufige Fragen
- **Gewinner-Seite** (Hall of Fame), aktuell leer bis zur ersten Ausgabe
- **Mitmachen**-Seite zum Einreichen von Nominierungen (Discord/Formular/Mail)
- **Impressum & Datenschutz** als rechtliche Pflichtseiten (DE)

## Lokal starten

Kein Build nötig – einfach einen statischen Server im Projektordner starten:

```bash
python3 -m http.server 8000
# dann im Browser: http://localhost:8000
```

(Direktes Öffnen der `index.html` per Doppelklick funktioniert ebenfalls,
sollte aber wegen `fetch`/Modul-Restriktionen in modernen Browsern nach
Möglichkeit über einen lokalen Server erfolgen.)

## Vor dem echten Launch anpassen

Diese Seite ist bewusst mit **Platzhaltern** ausgeliefert, die vor der
Veröffentlichung ersetzt werden sollten:

| Was | Wo |
|---|---|
| Kategorien & Nominierte | `assets/js/data.js` (`CATEGORIES`) – aktuell nur Beispielnamen |
| Voting-Enddatum | `assets/js/data.js` (`VOTING_DEADLINE`) |
| Vergangene Gewinner | `assets/js/data.js` (`PAST_WINNERS`) |
| Discord-/Formular-Link, E-Mail | `teilnehmen.html` |
| Betreiber-Angaben (§5 TMG) | `impressum.html` |
| Datenschutz-Details (Hoster etc.) | `datenschutz.html` |

## Hinweis zum Voting

Das Voting in dieser Version ist eine **clientseitige Demo** (`localStorage`).
Für ein produktives, geräteübergreifendes und manipulationssicheres Voting
wird zusätzlich ein kleines Backend bzw. ein externer Formular-/Voting-Dienst
benötigt.

## Rechtlicher Hinweis

DaveAwards ist ein **inoffizielles Fanprojekt** und steht in keiner offiziellen
Verbindung zu Zugfahrer_DaveTV, Twitch oder verbundenen Unternehmen.
