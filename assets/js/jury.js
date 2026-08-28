/* DaveAwards – Jury-Bereich: Login (Supabase Auth), Einreichungs-Bewertung
   und das gewichtete Gewinner-Voting (15% Jury / 25% Streamer-Jury / 60% Community) */

let currentUserRole = "jury";

document.addEventListener("DOMContentLoaded", () => {
  if (typeof supabaseClient === "undefined" || !supabaseClient) {
    showConfigWarning();
    return;
  }

  wireLoginForm();
  wireLogoutButton();
  wireFilters();
  wireTabs();
  populateVotingCategorySelect();

  supabaseClient.auth.getSession().then(({ data }) => {
    handleAuthChange(data.session);
  });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    handleAuthChange(session);
  });
});

async function handleAuthChange(session) {
  updateAuthView(!!session);
  if (!session) return;

  currentUserRole = await fetchCurrentUserRole();
  applyRoleToUi(currentUserRole);
  loadSubmissions();
  loadVotingNominees();
}

async function fetchCurrentUserRole() {
  const { data, error } = await supabaseClient
    .from("jury_roles")
    .select("role")
    .maybeSingle();
  if (error || !data) return "jury";
  return data.role;
}

function applyRoleToUi(role) {
  const label = document.querySelector("#jury-role-label");
  if (label && typeof VOTER_TYPE_LABELS !== "undefined") {
    label.textContent = VOTER_TYPE_LABELS[role] || role;
  }
  const curationTabBtn = document.querySelector("[data-tab-target='jury-tab-curation']");
  const curationTab = document.querySelector("#jury-tab-curation");
  if (role === "streamer_jury") {
    if (curationTabBtn) curationTabBtn.style.display = "none";
    if (curationTab) curationTab.style.display = "none";
    switchTab("jury-tab-voting");
  } else {
    if (curationTabBtn) curationTabBtn.style.display = "";
  }
}

function showConfigWarning() {
  const warning = document.querySelector("#jury-config-warning");
  if (warning) warning.style.display = "block";
  const login = document.querySelector("#jury-login");
  if (login) login.style.display = "none";
}

function updateAuthView(isLoggedIn) {
  const login = document.querySelector("#jury-login");
  const panel = document.querySelector("#jury-panel");
  if (login) login.style.display = isLoggedIn ? "none" : "block";
  if (panel) panel.style.display = isLoggedIn ? "block" : "none";
}

function wireLoginForm() {
  const form = document.querySelector("#jury-login-form");
  if (!form) return;

  const statusEl = document.querySelector("#jury-login-status");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = form.querySelector("#jury-email").value.trim();
    const password = form.querySelector("#jury-password").value;

    setStatus(statusEl, "", "");
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Anmelden…";

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    submitBtn.disabled = false;
    submitBtn.textContent = "Anmelden";

    if (error) {
      setStatus(statusEl, "error", "Login fehlgeschlagen: E-Mail oder Passwort falsch.");
    }
  });
}

function wireLogoutButton() {
  const btn = document.querySelector("#jury-logout");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
  });
}

/* ---------- Tabs ---------- */
function wireTabs() {
  document.querySelectorAll("[data-tab-target]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tabTarget));
  });
}

function switchTab(targetId) {
  document.querySelectorAll("[data-tab-target]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tabTarget === targetId);
  });
  document.querySelectorAll(".jury-tab").forEach((tab) => {
    tab.style.display = tab.id === targetId ? "block" : "none";
  });
}

/* ---------- Einreichungen prüfen (Kuration) ---------- */
function wireFilters() {
  const categorySelect = document.querySelector("#jury-filter-category");
  const statusSelect = document.querySelector("#jury-filter-status");
  if (categorySelect && typeof CATEGORIES !== "undefined") {
    categorySelect.innerHTML =
      `<option value="">Alle Kategorien</option>` +
      CATEGORIES.map((cat) => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join("");
  }
  [categorySelect, statusSelect].forEach((el) => {
    if (el) el.addEventListener("change", loadSubmissions);
  });
  const refreshBtn = document.querySelector("#jury-refresh");
  if (refreshBtn) refreshBtn.addEventListener("click", loadSubmissions);
}

async function loadSubmissions() {
  const list = document.querySelector("#jury-list");
  if (!list) return;

  const categoryFilter = document.querySelector("#jury-filter-category")?.value || "";
  const statusFilter =
    document.querySelector("#jury-filter-status")?.value ?? "pending";

  list.innerHTML = `<p class="jury-loading">Lade Einreichungen…</p>`;

  let query = supabaseClient
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: true });

  if (categoryFilter) query = query.eq("category_id", categoryFilter);
  if (statusFilter) query = query.eq("status", statusFilter);

  const { data, error } = await query;

  if (error) {
    console.error(error);
    list.innerHTML = `<p class="jury-loading">Fehler beim Laden der Einreichungen.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p class="jury-loading">Keine Einreichungen in dieser Ansicht.</p>`;
    return;
  }

  list.innerHTML = data.map(renderSubmissionRow).join("");
  wireRowActions();
}

function renderSubmissionRow(row) {
  const category = (typeof CATEGORIES !== "undefined" ? CATEGORIES : []).find(
    (c) => c.id === row.category_id
  );
  const categoryLabel = category ? `${category.icon} ${category.name}` : row.category_id;
  const statusLabel =
    (typeof SUBMISSION_STATUS_LABELS !== "undefined" && SUBMISSION_STATUS_LABELS[row.status]) ||
    row.status;
  const categoryOptions = (typeof CATEGORIES !== "undefined" ? CATEGORIES : [])
    .filter((c) => c.id !== row.category_id)
    .map((c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`)
    .join("");

  const isSafeUrl = /^https?:\/\//i.test(row.clip_url || "");
  const clipLinkHtml = isSafeUrl
    ? `<a class="jury-link" href="${escapeAttr(row.clip_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.clip_url)}</a>`
    : `<span class="jury-link jury-link-unsafe">${escapeHtml(row.clip_url)} (ungültiger Link, nicht anklickbar)</span>`;

  return `
    <div class="jury-row" data-id="${row.id}">
      <div class="jury-row-head">
        <span class="jury-badge jury-badge-${row.status}">${statusLabel}</span>
        <span class="jury-category">${categoryLabel}</span>
        <span class="jury-date">${new Date(row.created_at).toLocaleString("de-DE")}</span>
      </div>
      ${clipLinkHtml}
      ${row.submitter_name ? `<div class="jury-submitter">von ${escapeHtml(row.submitter_name)}</div>` : ""}
      ${row.note ? `<div class="jury-note">„${escapeHtml(row.note)}“</div>` : ""}
      <div class="jury-actions">
        <button class="btn-jury btn-jury-approve" data-action="passend">✅ Passend</button>
        <button class="btn-jury btn-jury-reject" data-action="unpassend">❌ Unpassend</button>
        <div class="jury-wrong-category">
          <select class="jury-suggest-category">
            <option value="">Falsche Kategorie – wohin verschieben?</option>
            ${categoryOptions}
          </select>
          <button class="btn-jury btn-jury-wrong" data-action="falsche_kategorie">↔️ Verschieben</button>
        </div>
      </div>
    </div>`;
}

function wireRowActions() {
  document.querySelectorAll(".jury-row").forEach((rowEl) => {
    const id = rowEl.dataset.id;
    rowEl.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const action = btn.dataset.action;

        rowEl.querySelectorAll("button").forEach((b) => (b.disabled = true));

        const {
          data: { user }
        } = await supabaseClient.auth.getUser();
        const reviewedBy = user ? user.email : null;
        const reviewedAt = new Date().toISOString();

        let updatePayload;

        if (action === "falsche_kategorie") {
          const select = rowEl.querySelector(".jury-suggest-category");
          const newCategoryId = select.value || null;

          updatePayload = newCategoryId
            ? // Clip direkt in die richtige Kategorie verschieben und dort
              // wieder als "offen" zur Prüfung einreihen.
              {
                category_id: newCategoryId,
                status: "pending",
                suggested_category_id: null,
                reviewed_at: reviewedAt,
                reviewed_by: reviewedBy
              }
            : // Keine Zielkategorie gewählt: nur als falsche Kategorie markieren.
              {
                status: "falsche_kategorie",
                suggested_category_id: null,
                reviewed_at: reviewedAt,
                reviewed_by: reviewedBy
              };
        } else {
          updatePayload = {
            status: action,
            suggested_category_id: null,
            reviewed_at: reviewedAt,
            reviewed_by: reviewedBy
          };
        }

        const { error } = await supabaseClient
          .from("submissions")
          .update(updatePayload)
          .eq("id", id);

        if (error) {
          console.error(error);
          rowEl.querySelectorAll("button").forEach((b) => (b.disabled = false));
          return;
        }

        loadSubmissions();
      });
    });
  });
}

/* ---------- Gewinner wählen (gewichtetes Voting) ---------- */
function populateVotingCategorySelect() {
  const select = document.querySelector("#voting-filter-category");
  if (!select || typeof CATEGORIES === "undefined") return;
  select.innerHTML = CATEGORIES.map(
    (cat) => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
  ).join("");
  select.addEventListener("change", loadVotingNominees);
  const refreshBtn = document.querySelector("#voting-refresh");
  if (refreshBtn) refreshBtn.addEventListener("click", loadVotingNominees);
}

async function loadVotingNominees() {
  const list = document.querySelector("#voting-list");
  if (!list) return;

  const categoryId = document.querySelector("#voting-filter-category")?.value;
  if (!categoryId) return;

  list.innerHTML = `<p class="jury-loading">Lade Nominierte…</p>`;

  const { data: nominees, error } = await supabaseClient
    .from("nominees")
    .select("*")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    list.innerHTML = `<p class="jury-loading">Fehler beim Laden der Nominierten.</p>`;
    return;
  }

  if (!nominees || nominees.length === 0) {
    list.innerHTML = `<p class="jury-loading">Für diese Kategorie gibt es noch keine von der Jury freigegebenen Nominierten.</p>`;
    return;
  }

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  const { data: myVotes } = await supabaseClient
    .from("votes")
    .select("nominee_id")
    .eq("category_id", categoryId)
    .eq("voter_type", currentUserRole)
    .eq("voter_id", user.id);

  const myVoteNomineeId = myVotes && myVotes.length > 0 ? myVotes[0].nominee_id : null;

  list.innerHTML = nominees.map((n) => renderNomineeVoteRow(n, myVoteNomineeId)).join("");

  list.querySelectorAll("button[data-vote-nominee]").forEach((btn) => {
    btn.addEventListener("click", () => castVote(categoryId, btn.dataset.voteNominee));
  });
}

function renderNomineeVoteRow(nominee, myVoteNomineeId) {
  const isMyVote = nominee.id === myVoteNomineeId;
  const isSafeUrl = /^https?:\/\//i.test(nominee.clip_url || "");
  const clipLinkHtml = isSafeUrl
    ? `<a class="jury-link" href="${escapeAttr(nominee.clip_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(nominee.clip_url)}</a>`
    : `<span class="jury-link jury-link-unsafe">${escapeHtml(nominee.clip_url)}</span>`;

  return `
    <div class="jury-row">
      ${clipLinkHtml}
      ${nominee.submitter_name ? `<div class="jury-submitter">von ${escapeHtml(nominee.submitter_name)}</div>` : ""}
      <div class="jury-actions">
        <button class="btn-jury ${isMyVote ? "btn-jury-approve" : ""}" data-vote-nominee="${nominee.id}" ${isMyVote ? "disabled" : ""}>
          ${isMyVote ? "✅ Deine Stimme" : "Für diesen Clip stimmen"}
        </button>
      </div>
    </div>`;
}

async function castVote(categoryId, nomineeId) {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  const { data: existing } = await supabaseClient
    .from("votes")
    .select("id")
    .eq("category_id", categoryId)
    .eq("voter_type", currentUserRole)
    .eq("voter_id", user.id)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabaseClient
      .from("votes")
      .update({ nominee_id: nomineeId })
      .eq("id", existing.id));
  } else {
    ({ error } = await supabaseClient.from("votes").insert({
      category_id: categoryId,
      nominee_id: nomineeId,
      voter_type: currentUserRole,
      voter_id: user.id
    }));
  }

  if (error) {
    console.error(error);
    return;
  }

  loadVotingNominees();
}

function setStatus(el, type, message) {
  if (!el) return;
  el.textContent = message;
  el.className = "form-status" + (type ? ` form-status-${type}` : "");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
