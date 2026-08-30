/* DaveAwards – Einreichungsformular (schreibt in Supabase "submissions") */

const DEFAULT_NOTE_PLACEHOLDER = "Warum verdient dieser Clip eine Nominierung?";

document.addEventListener("DOMContentLoaded", () => {
  populateCategorySelect();
  wireSubmissionForm();
  wireNoteHint();
});

function populateCategorySelect() {
  const select = document.querySelector("#submission-category");
  if (!select || typeof CATEGORIES === "undefined") return;

  const submittableCategories = CATEGORIES.filter(
    (cat) => cat.id !== (typeof CLIP_OF_YEAR_CATEGORY_ID !== "undefined" ? CLIP_OF_YEAR_CATEGORY_ID : "clip-des-jahres")
  );

  select.innerHTML =
    `<option value="" disabled selected>Kategorie auswählen…</option>` +
    submittableCategories.map((cat) => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join("");
}

function wireNoteHint() {
  const select = document.querySelector("#submission-category");
  const note = document.querySelector("#submission-note");
  if (!select || !note || typeof CATEGORY_NOTE_HINTS === "undefined") return;

  select.addEventListener("change", () => {
    note.placeholder = CATEGORY_NOTE_HINTS[select.value] || DEFAULT_NOTE_PLACEHOLDER;
  });
}

function wireSubmissionForm() {
  const form = document.querySelector("#submission-form");
  if (!form) return;

  const statusEl = document.querySelector("#submission-status");
  const submitBtn = form.querySelector("button[type='submit']");

  if (typeof supabaseClient === "undefined" || !supabaseClient) {
    setStatus(
      statusEl,
      "error",
      "Die Einreichung ist aktuell nicht verfügbar – das Backend ist noch nicht konfiguriert. Bitte später erneut versuchen."
    );
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(statusEl, "", "");

    const categoryId = form.querySelector("#submission-category").value;
    const clipUrl = form.querySelector("#submission-url").value.trim();
    const submitterName = form.querySelector("#submission-name").value.trim();
    const note = form.querySelector("#submission-note").value.trim();

    if (!categoryId) {
      setStatus(statusEl, "error", "Bitte wählt eine Kategorie aus.");
      return;
    }
    if (!isLikelyUrl(clipUrl)) {
      setStatus(statusEl, "error", "Bitte gebt einen gültigen Link (z. B. https://…) zum Clip an.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Wird eingereicht…";

    const { error } = await supabaseClient.from("submissions").insert({
      category_id: categoryId,
      clip_url: clipUrl,
      submitter_name: submitterName || null,
      note: note || null
    });

    submitBtn.disabled = false;
    submitBtn.textContent = "Clip einreichen";

    if (error) {
      console.error(error);
      setStatus(statusEl, "error", "Da ist leider etwas schiefgelaufen. Bitte versucht es erneut.");
      return;
    }

    form.reset();
    setStatus(
      statusEl,
      "success",
      "Danke! Euer Clip wurde eingereicht und wird von der Jury gesichtet."
    );
  });
}

function isLikelyUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    return false;
  }
}

function setStatus(el, type, message) {
  if (!el) return;
  el.textContent = message;
  el.className = "form-status" + (type ? ` form-status-${type}` : "");
}
