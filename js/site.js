export function siteRoot() {
  const root = document.body?.dataset.root || ".";
  return new URL(root.endsWith("/") ? root : `${root}/`, window.location.href);
}

export function siteUrl(path) {
  return new URL(path, siteRoot()).href;
}

function initNav() {
  document.documentElement.classList.add("js");
  const button = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#site-nav");
  if (!button || !nav) return;
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", open ? "false" : "true");
    nav.classList.toggle("is-open", !open);
    button.textContent = open ? "Meny" : "Stäng";
  });
}

export function wireForms(scope = document) {
  scope.querySelectorAll("form[data-maxab-form]").forEach((form) => {
    if (form.dataset.wired === "1") return;
    form.dataset.wired = "1";
    const apply = () => {
      const next = form.querySelector('input[name="_next"]');
      if (next) {
        const typ = form.dataset.thanks || "meddelande";
        next.value = siteUrl(`tack.html?typ=${encodeURIComponent(typ)}`);
      }
      const reply = form.querySelector('input[name="_replyto"]');
      const email = form.querySelector('input[type="email"]');
      if (reply && email) reply.value = email.value;
    };
    apply();
    form.addEventListener("submit", () => {
      apply();
      const button = form.querySelector("[type='submit']");
      if (button) button.disabled = true;
    });
  });
}

function reenableForms() {
  document.querySelectorAll("form[data-maxab-form] [type='submit']").forEach((button) => {
    button.disabled = false;
  });
}

function initThanks() {
  const lead = document.querySelector("[data-thanks-lead]");
  if (!lead) return;
  const typ = new URLSearchParams(window.location.search).get("typ");
  if (typ === "felanmalan") {
    lead.textContent = "Din felanmälan är skickad. Vi återkommer till dig.";
  } else if (typ === "intresse") {
    lead.textContent =
      "Din intresseanmälan är skickad. Vi hör av oss om vi har en lokal som passar.";
  }
}

if (typeof document !== "undefined") {
  initNav();
  wireForms(document);
  initThanks();
  window.addEventListener("pageshow", reenableForms);
}
