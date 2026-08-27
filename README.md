# 🚆 DaveAwards

Ein inoffizielles Fanprojekt im Stil von [streamawards.de](https://streamawards.de/) –
für die Community von **Zugfahrer_DaveTV**.

Der Ablauf einer Runde:

1. **Einreichungsphase** – Zuschauer:innen reichen Clip-Links ein und ordnen
   sie direkt einer Kategorie zu. In dieser Phase gibt es **keine öffentliche
   Nominierten-Liste und kein Voting** zu sehen.
2. **Jury-Sichtung** – Im passwortgeschützten Jury-Bereich (`jury.html`)
   stuft die Jury jede Einreichung ein: **passend**, **unpassend** oder
   **falsche Kategorie** (mit Vorschlag der richtigen Kategorie).
3. **Voting** – Nur die als "passend" eingestuften Clips werden zu
   Nominierten. Drei Gruppen stimmen ab und werden gewichtet
   zusammengerechnet: **Jury 15%**, **Streamer-Jury 25%**, **Community 60%**
   (Community stimmt auf `kategorien.html`, sobald `SITE_PHASE` auf
   `"voting"` steht; Jury und Streamer-Jury stimmen im Tab "Gewinner wählen"
   in `jury.html`).
4. **Gewinner-Bekanntgabe** – Hall of Fame auf `gewinner.html`.

## Architektur

Reines HTML/CSS/JS (kein Build-Schritt) für Frontend + Hosting via GitHub
Pages, plus **Supabase** als Backend für die Einreichungen, damit alle
Besucher:innen dieselben Daten sehen (nicht nur lokal im eigenen Browser):

- `submissions`-Tabelle (siehe `supabase/schema.sql`) speichert jede
  Einreichung (Kategorie, Clip-Link, optionaler Name/Begründung, Status).
- **Row-Level-Security** sorgt dafür, dass normale Besucher:innen nur neue
  Einreichungen anlegen, aber **nichts einsehen** können (technische
  Umsetzung von "kein Zugriff auf die Kategorien/Einreichungen während der
  Einreichungsphase").
- Der **Jury-Login** ist ein normaler Supabase-Auth-Account (E-Mail +
  Passwort) – das ist das "Passwort-Gateway". Jede Person mit einem solchen
  Zugang kann im Jury-Bereich alle Einreichungen sehen und bewerten.
- `jury_roles`-Tabelle unterscheidet **Jury** (kuratiert Einreichungen +
  stimmt ab, 15%) von **Streamer-Jury** (stimmt nur ab, 25%). Ohne Eintrag
  gilt ein Konto automatisch als normale Jury.
- `votes`-Tabelle + `weighted_results`-View berechnen das gewichtete
  Endergebnis (15/25/60). Die View ist nur für eingeloggte Jury-/
  Streamer-Jury-Konten sichtbar – die Öffentlichkeit sieht während des
  Votings keine Zwischenstände.

### Jury- und Streamer-Jury-Konten anlegen

1. Unter **Authentication → Users** in Supabase ein Konto (E-Mail +
   Passwort) anlegen – das reicht bereits für eine normale **Jury**-Stimme.
2. Für eine **Streamer-Jury**-Stimme zusätzlich im **SQL Editor** ausführen
   (User-ID aus der Users-Liste kopieren):
   ```sql
   insert into public.jury_roles (user_id, role)
   values ('<user-id>', 'streamer_jury');
   ```
3. Die Zugangsdaten an die jeweilige Person geben – Login läuft für beide
   Rollen über dieselbe Seite (`jury.html`).

### Gewinner:innen ermitteln

Nach Ende der Voting-Phase im Supabase **SQL Editor**:
```sql
select * from public.weighted_results where category_id = 'clip-des-jahres';
```
Die Zeile mit dem höchsten `weighted_score_pct` je Kategorie gewinnt. Die
Gewinner:innen dann wie gehabt manuell in `assets/js/data.js`
(`PAST_WINNERS`) eintragen, damit sie auf `gewinner.html` erscheinen.

## Supabase einrichten (einmalig)

1. Kostenloses Konto auf [supabase.com](https://supabase.com) anlegen und
   ein neues Projekt erstellen.
2. Im Projekt unter **SQL Editor** den Inhalt von `supabase/schema.sql`
   einfügen und ausführen (legt Tabelle + Sicherheitsregeln an).
3. Unter **Project Settings → API** die Werte **"Project URL"** und
   **"anon public" key** kopieren und in `assets/js/supabase-config.js`
   eintragen (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). Diese Keys sind bewusst
   öffentlich/clientseitig nutzbar – der Schutz läuft über die
   Row-Level-Security-Regeln, nicht über Geheimhaltung des Keys.
4. Unter **Authentication → Users** ein oder mehrere Jury-Konten anlegen
   (E-Mail + Passwort) und diese Zugangsdaten an die Jury-Mitglieder geben.
5. Änderungen committen &amp; pushen – GitHub Pages deployt automatisch neu.

Ohne Schritt 1–3 zeigen Einreichungsformular und Jury-Login einen Hinweis,
dass das Backend noch nicht konfiguriert ist, statt mit einem Fehler
abzustürzen.

## Lokal starten

```bash
python3 -m http.server 8000
# dann im Browser: http://localhost:8000
```

## Vor dem echten Launch anpassen

| Was | Wo |
|---|---|
| Supabase-Zugangsdaten | `assets/js/supabase-config.js` |
| Kategorien | `assets/js/data.js` (`CATEGORIES`) |
| Phase der Seite (Einreichung/Voting/geschlossen) | `assets/js/data.js` (`SITE_PHASE`) |
| Deadline der Einreichungsphase | `assets/js/data.js` (`SUBMISSION_DEADLINE`) |
| Vergangene Gewinner | `assets/js/data.js` (`PAST_WINNERS`) |
| Discord-Link, E-Mail | `teilnehmen.html` |
| Betreiber-Angaben (§5 TMG) | `impressum.html` |
| Datenschutz-Details (Hoster, Supabase-Verweis) | `datenschutz.html` |

## Rechtlicher Hinweis

DaveAwards ist ein **inoffizielles Fanprojekt** und steht in keiner offiziellen
Verbindung zu Zugfahrer_DaveTV, Twitch oder verbundenen Unternehmen.
