/* DaveAwards – gemeinsame Logik: Navigation, Countdown, Voting, Rendering */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initCountdown();
  renderCategoryTeasers();
  renderVotingCategories();
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

/* ---------- Countdown bis zum Voting-Ende ---------- */
function initCountdown() {
  const el = document.querySelector("[data-countdown]");
  if (!el || typeof VOTING_DEADLINE === "undefined") return;

  const deadline = new Date(VOTING_DEADLINE).getTime();
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
      if (noteEl) noteEl.textContent = "Das Voting ist beendet – danke fürs Mitmachen!";
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
        <span class="count">${cat.nominees.length} Nominierte</span>
      </a>`
    )
    .join("");
}

/* ---------- Voting-Logik (lokal im Browser, siehe Regeln-Seite) ---------- */
const VOTE_STORAGE_KEY = "daveawards_votes_v1";

function getStoredVotes() {
  try {
    return JSON.parse(localStorage.getItem(VOTE_STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveVote(categoryId, nomineeId) {
  const votes = getStoredVotes();
  votes[categoryId] = nomineeId;
  localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(votes));
}

function renderVotingCategories() {
  const container = document.querySelector("[data-voting-categories]");
  if (!container || typeof CATEGORIES === "undefined") return;

  const votes = getStoredVotes();

  container.innerHTML = CATEGORIES.map((cat) => renderCategoryBlock(cat, votes[cat.id])).join("");

  container.querySelectorAll(".vote-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const categoryId = btn.dataset.category;
      const nomineeId = btn.dataset.nominee;
      if (getStoredVotes()[categoryId]) return; // bereits abgestimmt
      saveVote(categoryId, nomineeId);
      const cat = CATEGORIES.find((c) => c.id === categoryId);
      const block = document.getElementById(`cat-${categoryId}`);
      if (block && cat) {
        block.outerHTML = renderCategoryBlock(cat, nomineeId);
        attachHandlersFor(categoryId);
      }
    });
  });
}

function attachHandlersFor(categoryId) {
  const block = document.getElementById(`cat-${categoryId}`);
  if (!block) return;
  block.querySelectorAll(".vote-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const catId = btn.dataset.category;
      const nomineeId = btn.dataset.nominee;
      if (getStoredVotes()[catId]) return;
      saveVote(catId, nomineeId);
      const cat = CATEGORIES.find((c) => c.id === catId);
      const freshBlock = document.getElementById(`cat-${catId}`);
      if (freshBlock && cat) {
        freshBlock.outerHTML = renderCategoryBlock(cat, nomineeId);
        attachHandlersFor(catId);
      }
    });
  });
}

function renderCategoryBlock(cat, userVoteNomineeId) {
  const totalVotes =
    cat.nominees.reduce((sum, n) => sum + n.seedVotes, 0) + (userVoteNomineeId ? 1 : 0);

  const nomineesHtml = cat.nominees
    .map((n) => {
      const isUserVote = n.id === userVoteNomineeId;
      const votes = n.seedVotes + (isUserVote ? 1 : 0);
      const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
      const initials = n.name
        .replace(/^Beispiel_?/, "")
        .split(/[_\s]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase() || "?";

      const buttonHtml = userVoteNomineeId
        ? isUserVote
          ? `<button class="vote-btn" disabled>✓ Deine Stimme</button>`
          : `<button class="vote-btn" disabled>Voting genutzt</button>`
        : `<button class="vote-btn" data-category="${cat.id}" data-nominee="${n.id}">Abstimmen</button>`;

      return `
        <div class="nominee">
          <div class="avatar">${initials}</div>
          <div class="info">
            <div class="name">${n.name}</div>
            <div class="tagline">${n.tagline}</div>
          </div>
          ${buttonHtml}
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <div class="pct">${pct}% · ${votes} Stimmen</div>
        </div>`;
    })
    .join("");

  return `
    <div class="vote-category" id="cat-${cat.id}">
      <div class="vote-category-head">
        <span class="icon">${cat.icon}</span>
        <div>
          <h3>${cat.name}</h3>
          <p>${cat.description}</p>
        </div>
      </div>
      <div class="nominee-list">${nomineesHtml}</div>
    </div>`;
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
