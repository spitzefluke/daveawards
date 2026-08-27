/* DaveAwards – gemeinsame Logik: Navigation, Countdown, Kategorie-Übersicht */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initCountdown();
  renderCategoryTeasers();
  renderCategoryOverview();
  renderWinners();
  markActiveNavLink();
});

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

  function tick() {
    const diff = deadline - Date.now();
    if (diff <= 0) {
      if (unitDays) unitDays.textContent = "0";
      if (unitHours) unitHours.textContent = "0";
      if (unitMinutes) unitMinutes.textContent = "0";
      if (unitSeconds) unitSeconds.textContent = "0";
      if (noteEl) noteEl.textContent = "Die Einreichungsphase ist beendet.";
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
  }

  tick();
  const timer = setInterval(tick, 1000);
}

/* ---------- Startseite: Kategorie-Teaser ---------- */
function renderCategoryTeasers() {
  const grid = document.querySelector("[data-category-teasers]");
  if (!grid || typeof CATEGORIES === "undefined") return;

  grid.innerHTML = CATEGORIES.slice(0, 6)
    .map(
      (cat) => `
      <a class="category-card" href="kategorien.html#${cat.id}">
        <span class="icon">${cat.icon}</span>
        <h3>${cat.name}</h3>
        <p>${cat.description}</p>
      </a>`
    )
    .join("");
}

/* ---------- Kategorien-Seite: reine Übersicht (kein Voting während der Einreichungsphase) ---------- */
function renderCategoryOverview() {
  const grid = document.querySelector("[data-category-overview]");
  if (!grid || typeof CATEGORIES === "undefined") return;

  grid.innerHTML = CATEGORIES.map(
    (cat) => `
      <div class="category-card" id="${cat.id}">
        <span class="icon">${cat.icon}</span>
        <h3>${cat.name}</h3>
        <p>${cat.description}</p>
      </div>`
  ).join("");
}

/* ---------- Gewinner-Seite ---------- */
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
