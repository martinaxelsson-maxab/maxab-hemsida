import { classifyAuthError, createSupabase, currentSession, isConfigured, safeNext, sendMagicLink } from "./auth.js";
import { siteUrl } from "./site.js";

const form = document.querySelector("#login-form");
const status = document.querySelector("[data-login-status]");
const note = document.querySelector("[data-login-note]");

if (note && !isConfigured()) {
  note.hidden = false;
}

if (form) {
  boot();
  form.addEventListener("submit", onSubmit);
}

async function boot() {
  if (!isConfigured()) return;
  try {
    const supabase = await createSupabase();
    const session = await currentSession(supabase);
    if (session) {
      const next = safeNext(new URLSearchParams(window.location.search).get("nasta"));
      window.location.replace(next || siteUrl("intern/"));
    }
  } catch (error) {
    console.error(error);
  }
}

async function onSubmit(event) {
  event.preventDefault();
  const emailInput = form.querySelector('input[type="email"]');
  const button = form.querySelector("[type='submit']");
  status.textContent = "";
  if (!emailInput.checkValidity()) {
    emailInput.reportValidity();
    return;
  }
  if (!isConfigured()) {
    status.textContent = "Inloggningen är inte aktiverad ännu.";
    return;
  }
  button.disabled = true;
  try {
    const supabase = await createSupabase();
    const { error } = await sendMagicLink(supabase, emailInput.value.trim());
    if (error) {
      const kind = classifyAuthError(error);
      if (kind === "network") {
        status.textContent = "Kunde inte nå inloggningen. Kontrollera nätverket och försök igen.";
        return;
      }
      if (kind === "rate") {
        status.textContent = "För många försök. Vänta en stund och prova igen.";
        return;
      }
      if (kind === "config") {
        status.textContent = "Inloggningen svarade inte som den ska. Kontrollera uppgifterna i js/config.js.";
        return;
      }
    }
    status.textContent = "Om adressen är upplagd för personal har en länk skickats. Kolla inkorgen och skräpposten.";
    form.reset();
  } catch (error) {
    console.error(error);
    status.textContent = classifyAuthError(error) === "config"
      ? "Inloggningen svarade inte som den ska. Kontrollera uppgifterna i js/config.js."
      : "Kunde inte nå inloggningen. Kontrollera nätverket och försök igen.";
  } finally {
    button.disabled = false;
  }
}
