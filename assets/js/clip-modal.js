/* DaveAwards – Clip-Player-Fenster für die Abstimmungsphase.
   Bettet Twitch-Clips und YouTube-Videos direkt in ein Overlay ein;
   für alle anderen Links gibt es einen Fallback-Button zum Öffnen
   in einem neuen Tab (Cross-Origin-Iframes lassen sich nicht generell
   erzwingen und viele Seiten blockieren das Einbetten ohnehin). */

function getClipEmbed(url) {
  let u;
  try {
    u = new URL(url);
  } catch (e) {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;

  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const parent = location.hostname;

  if (host === "clips.twitch.tv") {
    const slug = u.pathname.replace(/^\//, "").split("/")[0];
    if (slug) {
      return {
        embedUrl: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${parent}&autoplay=true`
      };
    }
  }

  if (host === "twitch.tv" || host === "m.twitch.tv") {
    const match = u.pathname.match(/\/clip\/([^/?]+)/i);
    if (match) {
      return {
        embedUrl: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(match[1])}&parent=${parent}&autoplay=true`
      };
    }
  }

  if (host === "youtu.be") {
    const id = u.pathname.replace(/^\//, "").split("/")[0];
    if (id) return { embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1` };
  }

  if (host === "youtube.com") {
    if (u.pathname === "/watch" && u.searchParams.get("v")) {
      return {
        embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(u.searchParams.get("v"))}?autoplay=1`
      };
    }
    const shortsMatch = u.pathname.match(/^\/shorts\/([^/?]+)/);
    if (shortsMatch) {
      return {
        embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(shortsMatch[1])}?autoplay=1`
      };
    }
  }

  return null;
}

/* Vorschaubilder für die Abstimmung. YouTube-Thumbnails lassen sich
   direkt aus der Video-ID bauen; für Twitch-Clips gibt es ohne eigenen
   API-Key keine offizielle Thumbnail-URL, daher nutzen wir noembed.com
   (kostenloser, keyless oEmbed-Proxy) als kleinen Umweg. */
const clipThumbnailCache = new Map();

function getYouTubeVideoId(url) {
  let u;
  try {
    u = new URL(url);
  } catch (e) {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") return u.pathname.replace(/^\//, "").split("/")[0] || null;
  if (host === "youtube.com") {
    if (u.pathname === "/watch" && u.searchParams.get("v")) return u.searchParams.get("v");
    const shortsMatch = u.pathname.match(/^\/shorts\/([^/?]+)/);
    if (shortsMatch) return shortsMatch[1];
  }
  return null;
}

function isTwitchClipUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch (e) {
    return false;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  return host === "clips.twitch.tv" || ((host === "twitch.tv" || host === "m.twitch.tv") && /\/clip\//i.test(u.pathname));
}

async function resolveClipThumbnail(url) {
  if (clipThumbnailCache.has(url)) return clipThumbnailCache.get(url);

  const promise = (async () => {
    const youTubeId = getYouTubeVideoId(url);
    if (youTubeId) return `https://img.youtube.com/vi/${encodeURIComponent(youTubeId)}/hqdefault.jpg`;

    if (isTwitchClipUrl(url)) {
      try {
        const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.thumbnail_url || null;
      } catch (e) {
        return null;
      }
    }

    return null;
  })();

  clipThumbnailCache.set(url, promise);
  return promise;
}

/* Setzt bei allen `img.clip-thumb[data-clip-url]` innerhalb von `root`
   das echte Vorschaubild, sobald es geladen ist. Ohne ermittelbares
   Vorschaubild bleibt der graue Platzhalter aus dem CSS sichtbar. */
function loadClipThumbnails(root) {
  (root || document).querySelectorAll("img.clip-thumb[data-clip-url]").forEach((img) => {
    resolveClipThumbnail(img.dataset.clipUrl).then((thumbUrl) => {
      if (thumbUrl) img.src = thumbUrl;
    });
  });
}

let clipModalEl = null;

function ensureClipModal() {
  if (clipModalEl) return clipModalEl;

  const modal = document.createElement("div");
  modal.className = "clip-modal";
  modal.innerHTML = `
    <div class="clip-modal-backdrop" data-clip-modal-close></div>
    <div class="clip-modal-dialog" role="dialog" aria-modal="true">
      <button class="clip-modal-close" type="button" data-clip-modal-close aria-label="Schließen">×</button>
      <div class="clip-modal-body"></div>
    </div>`;
  document.body.appendChild(modal);

  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-clip-modal-close]")) closeClipModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeClipModal();
  });

  clipModalEl = modal;
  return modal;
}

function openClipModal(url) {
  const modal = ensureClipModal();
  const body = modal.querySelector(".clip-modal-body");
  const embed = getClipEmbed(url);

  if (embed) {
    body.innerHTML = `
      <div class="clip-modal-frame">
        <iframe src="${embed.embedUrl}" allow="autoplay; fullscreen" allowfullscreen frameborder="0"></iframe>
      </div>`;
  } else {
    body.innerHTML = `
      <div class="clip-modal-fallback">
        <p>Dieser Clip kann hier nicht direkt abgespielt werden.</p>
        <a class="btn btn-primary" href="${escapeAttrModal(url)}" target="_blank" rel="noopener noreferrer">Clip in neuem Tab öffnen</a>
      </div>`;
  }

  modal.classList.add("open");
  document.body.classList.add("clip-modal-open");
}

function closeClipModal() {
  if (!clipModalEl) return;
  clipModalEl.classList.remove("open");
  document.body.classList.remove("clip-modal-open");
  const body = clipModalEl.querySelector(".clip-modal-body");
  if (body) body.innerHTML = ""; // Wiedergabe stoppen
}

function escapeAttrModal(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML.replace(/"/g, "&quot;");
}
