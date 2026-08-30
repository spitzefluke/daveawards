/* DaveAwards – Sprachumschalter mit automatischer Übersetzung.
   Nutzt im Hintergrund das öffentliche Google-Website-Translator-Widget
   (keine eigene Übersetzungspflege, kein API-Key nötig), gesteuert über
   ein eigenes, ins Design passendes Dropdown statt der Standard-Google-
   Leiste. Die Auswahl wird über das von Google gesetzte "googtrans"-
   Cookie gespeichert und gilt seitenübergreifend. */

function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    {
      pageLanguage: "de",
      includedLanguages: "en,fr,es,tr,pl,ru",
      autoDisplay: false,
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    },
    "google_translate_element"
  );
}

function getStoredLang() {
  const match = document.cookie.match(/googtrans=\/de\/([a-zA-Z-]+)/);
  return match ? match[1] : "de";
}

function setLanguage(lang) {
  if (lang === "de") {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${location.hostname}`;
    location.reload();
    return;
  }

  document.cookie = `googtrans=/de/${lang}; path=/`;

  const combo = document.querySelector(".goog-te-combo");
  if (combo) {
    combo.value = lang;
    combo.dispatchEvent(new Event("change"));
  } else {
    // Widget ist noch nicht bereit (z. B. gerade erst gewählt) – Cookie
    // ist bereits gesetzt, ein Reload reicht dann zum Übersetzen.
    location.reload();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const select = document.querySelector("#lang-switcher");
  if (!select) return;

  select.value = getStoredLang();
  select.addEventListener("change", () => setLanguage(select.value));
});
