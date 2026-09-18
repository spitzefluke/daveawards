/* DaveAwards – gemeinsame Logik: Navigation, Countdown, Kategorie-Übersicht */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initCountdown();
  renderCategoryOverview();
  initCategorySearch();
  renderWinners();
  applySitePhase();
  markActiveNavLink();
});

/* ---------- Phasen-Steuerung (Einreichung / Voting / Geschlossen) ---------- */
function applySitePhase() {
  if (typeof SITE_PHASE === "undefined") return;
  const sections = {
    submission: document.querySelector("[data-phase-submission]"),
    voting: document.querySelector("[data-phase-voting]"),
    closed: document.querySelector("[data-phase-closed]")
  };
  if (!sections.submission && !sections.voting && !sections.closed) return;
  Object.entries(sections).forEach(([phase, el]) => {
    if (el) el.style.display = phase === SITE_PHASE ? "block" : "none";
  });
}

/* ---------- Navigation (Mobile-Menü) ---------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
    const expanded = links.classList.contains("open");
    toggle.setAttribute("aria-expanded", String(expanded));
  });
  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function markActiveNavLink() {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === current) a.classList.add("active");
  });
}

/* ---------- Countdown bis zum Ende der Einreichungsphase ---------- */
function initCountdown() {
  const el = document.querySelector("[data-countdown]");
  if (!el || typeof SUBMISSION_DEADLINE === "undefined") return;

  const deadline = new Date(SUBMISSION_DEADLINE).getTime();
  const unitDays = el.querySelector("[data-unit='days']");
  const unitHours = el.querySelector("[data-unit='hours']");
  const unitMinutes = el.querySelector("[data-unit='minutes']");
  const unitSeconds = el.querySelector("[data-unit='seconds']");
  const noteEl = document.querySelector("[data-countdown-note]");
  const labelEl = document.querySelector("[data-deadline-label]");
  const fillEl = document.querySelector("[data-phase-fill]");
  const pctEl = document.querySelector("[data-phase-pct]");

  if (labelEl) {
    labelEl.textContent = new Date(deadline).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  function updatePhaseProgress() {
    if (!fillEl && !pctEl) return;
    const end = deadline;
    const start = end - 1000 * 60 * 60 * 24 * 90; // 90-Tage-Referenzfenster für die Fortschrittsanzeige
    const pct = Math.round(Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100)));
    if (fillEl) fillEl.style.width = pct + "%";
    if (pctEl) pctEl.textContent = pct + "%";
  }

  function tick() {
    const diff = deadline - Date.now();
    if (diff <= 0) {
      if (unitDays) unitDays.textContent = "0";
      if (unitHours) unitHours.textContent = "00";
      if (unitMinutes) unitMinutes.textContent = "00";
      if (unitSeconds) unitSeconds.textContent = "00";
      if (noteEl) noteEl.textContent = "Einreichung beendet";
      updatePhaseProgress();
      clearInterval(timer);
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (unitDays) unitDays.textContent = String(days);
    if (unitHours) unitHours.textContent = String(hours).padStart(2, "0");
    if (unitMinutes) unitMinutes.textContent = String(minutes).padStart(2, "0");
    if (unitSeconds) unitSeconds.textContent = String(seconds).padStart(2, "0");
    updatePhaseProgress();
  }

  tick();
  const timer = setInterval(tick, 1000);
}

/* ---------- Kategorien-Übersicht ---------- */
function renderCategoryOverview() {
  const grid = document.querySelector("[data-category-overview]");
  if (!grid || typeof CATEGORIES === "undefined") return;

  grid.innerHTML = CATEGORIES.map(
    (cat, i) => `
      <div class="category-card" id="${cat.id}">
        <div class="card-top">
          <span class="icon">${cat.icon}</span>
          <span class="num">${String(i + 1).padStart(2, "0")}</span>
        </div>
        <h3>${cat.name}</h3>
        <p>${cat.description}</p>
      </div>`
  ).join("");
}

/* ---------- Live-Suche über die Kategorien ---------- */
function initCategorySearch() {
  const grid = document.querySelector("[data-category-overview]");
  if (!grid) return;

  const countEl = document.querySelector("#category-count");
  const emptyEl = document.querySelector("#category-empty");
  const cards = Array.from(grid.querySelectorAll(".category-card"));
  const total = cards.length;

  function updateCount(visible) {
    if (!countEl) return;
    countEl.textContent = visible === total ? `${total} Kategorien` : `${visible} von ${total}`;
  }
  updateCount(total);

  const input = document.querySelector("#category-search");
  if (!input) return;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const match = !query || card.textContent.toLowerCase().includes(query);
      card.style.display = match ? "" : "none";
      if (match) visible++;
    });
    updateCount(visible);
    if (emptyEl) emptyEl.classList.toggle("visible", visible === 0);
  });
}

/* ---------- Hall of Fame ---------- */
function renderWinners() {
  const container = document.querySelector("[data-winners]");
  if (!container || typeof PAST_WINNERS === "undefined") return;

  if (PAST_WINNERS.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="emoji">🏗️</span>
        <p>Noch keine Ausgabe der DaveAwards abgeschlossen.<br>
        Sobald das erste Voting ausgewertet ist, stehen die Gewinner hier.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="grid-3">
      ${PAST_WINNERS.map(
        (w) => `
        <div class="winner-card">
          <div class="trophy">🏆</div>
          <h3>${w.category}</h3>
          <div class="winner-name">${w.winner}</div>
        </div>`
      ).join("")}
    </div>`;
}
