/* DaveAwards – Community-Voting (Voting-Phase). Zählt als 60%-Anteil im
   gewichteten Endergebnis (15% Jury / 25% Streamer-Jury / 60% Community). */

const DEVICE_TOKEN_KEY = "daveawards_device_token_v1";
const COMMUNITY_VOTES_KEY = "daveawards_community_votes_v1";

document.addEventListener("DOMContentLoaded", () => {
  if (typeof SITE_PHASE === "undefined" || SITE_PHASE !== "voting") return;
  if (typeof supabaseClient === "undefined" || !supabaseClient) {
    const container = document.querySelector("#community-voting-categories");
    if (container) {
      container.innerHTML = `<div class="demo-note">ℹ️ Voting ist aktuell nicht verfügbar – das Backend ist noch nicht konfiguriert.</div>`;
    }
    return;
  }
  renderCommunityVoting();
});

function getDeviceToken() {
  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) {
    token = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  return token;
}

function getLocalVotes() {
  try {
    return JSON.parse(localStorage.getItem(COMMUNITY_VOTES_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveLocalVote(categoryId, nomineeId) {
  const votes = getLocalVotes();
  votes[categoryId] = nomineeId;
  localStorage.setItem(COMMUNITY_VOTES_KEY, JSON.stringify(votes));
}

async function renderCommunityVoting() {
  const container = document.querySelector("#community-voting-categories");
  if (!container || typeof CATEGORIES === "undefined") return;

  container.innerHTML = `<p class="jury-loading">Lade Nominierte…</p>`;

  const { data: nominees, error } = await supabaseClient
    .from("nominees")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    container.innerHTML = `<p class="jury-loading">Nominierte konnten nicht geladen werden.</p>`;
    return;
  }

  const localVotes = getLocalVotes();

  const blocks = CATEGORIES.map((cat) => {
    const catNominees = (nominees || []).filter((n) => n.category_id === cat.id);
    if (catNominees.length === 0) return "";
    return renderCategoryVoteBlock(cat, catNominees, localVotes[cat.id]);
  }).join("");

  container.innerHTML =
    blocks ||
    `<div class="empty-state"><span class="emoji">🏗️</span><p>Für diese Runde stehen noch keine Nominierten fest.</p></div>`;

  wireCommunityVoteButtons();
}

function renderCategoryVoteBlock(cat, nominees, votedNomineeId) {
  const nomineesHtml = nominees
    .map((n) => {
      const isVoted = n.id === votedNomineeId;
      const isSafeUrl = /^https?:\/\//i.test(n.clip_url || "");
      const clipLinkHtml = isSafeUrl
        ? `<button type="button" class="clip-play-btn" data-clip-url="${escapeAttrVote(n.clip_url)}">▶ Clip ansehen</button>`
        : `<span class="jury-link">${escapeHtmlVote(n.clip_url)}</span>`;

      const buttonHtml = votedNomineeId
        ? isVoted
          ? `<button class="vote-btn" disabled>✓ Deine Stimme</button>`
          : `<button class="vote-btn" disabled>Voting genutzt</button>`
        : `<button class="vote-btn" data-category="${cat.id}" data-nominee="${n.id}">Abstimmen</button>`;

      return `
        <div class="nominee" style="grid-template-columns: 1fr auto;">
          <div class="info">
            ${clipLinkHtml}
            ${n.submitter_name ? `<div class="tagline">von ${escapeHtmlVote(n.submitter_name)}</div>` : ""}
          </div>
          ${buttonHtml}
        </div>`;
    })
    .join("");

  return `
    <div class="vote-category" id="vote-cat-${cat.id}">
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

function wireCommunityVoteButtons() {
  document.querySelectorAll(".clip-play-btn[data-clip-url]").forEach((btn) => {
    btn.addEventListener("click", () => openClipModal(btn.dataset.clipUrl));
  });

  document.querySelectorAll(".vote-btn[data-nominee]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const categoryId = btn.dataset.category;
      const nomineeId = btn.dataset.nominee;
      if (getLocalVotes()[categoryId]) return;

      btn.disabled = true;
      btn.textContent = "Wird gespeichert…";

      const { error } = await supabaseClient.from("votes").insert({
        category_id: categoryId,
        nominee_id: nomineeId,
        voter_type: "community",
        device_token: getDeviceToken()
      });

      if (error) {
        console.error(error);
        btn.disabled = false;
        btn.textContent = "Abstimmen";
        return;
      }

      saveLocalVote(categoryId, nomineeId);
      renderCommunityVoting();
    });
  });
}

function escapeHtmlVote(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttrVote(str) {
  return escapeHtmlVote(str).replace(/"/g, "&quot;");
}
