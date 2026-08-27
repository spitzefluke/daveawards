/* DaveAwards – Jury-Bereich: Login (Supabase Auth) + Bewertung der Einreichungen */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof supabaseClient === "undefined" || !supabaseClient) {
    showConfigWarning();
    return;
  }

  wireLoginForm();
  wireLogoutButton();
  wireFilters();

  supabaseClient.auth.getSession().then(({ data }) => {
    updateAuthView(!!data.session);
    if (data.session) loadSubmissions();
  });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateAuthView(!!session);
    if (session) loadSubmissions();
  });
});

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
            <option value="">Richtige Kategorie…</option>
            ${categoryOptions}
          </select>
          <button class="btn-jury btn-jury-wrong" data-action="falsche_kategorie">↔️ Falsche Kategorie</button>
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
        let suggestedCategoryId = null;

        if (action === "falsche_kategorie") {
          const select = rowEl.querySelector(".jury-suggest-category");
          suggestedCategoryId = select.value || null;
        }

        rowEl.querySelectorAll("button").forEach((b) => (b.disabled = true));

        const {
          data: { user }
        } = await supabaseClient.auth.getUser();

        const { error } = await supabaseClient
          .from("submissions")
          .update({
            status: action,
            suggested_category_id: suggestedCategoryId,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user ? user.email : null
          })
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
