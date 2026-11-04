import { createSupabase, currentSession, isConfigured } from "./auth.js";
import { siteUrl } from "./site.js";

const gate = document.querySelector("[data-intern-gate]");
const shell = document.querySelector("[data-intern-shell]");
const bar = document.querySelector("[data-intern-bar]");
const userEl = document.querySelector("[data-intern-user]");
const logout = document.querySelector("[data-intern-logout]");
const pageList = document.querySelector("[data-intern-pages]");
const article = document.querySelector("[data-intern-article]");
let loadedPages = [];

boot();

async function boot() {
  if (!isConfigured()) {
    if (gate) {
      gate.textContent = "Inloggningen är inte aktiverad ännu. Det här är ett tomt skal och innehåller inga interna uppgifter.";
    }
    showShell();
    return;
  }

  let supabase;
  try {
    supabase = await createSupabase();
    const session = await currentSession(supabase);
    if (!session) {
      const login = new URL(siteUrl("logga-in.html"));
      login.searchParams.set("nasta", window.location.href);
      window.location.replace(login.href);
      return;
    }
    showShell();
    if (gate) gate.hidden = true;
    if (userEl) {
      userEl.hidden = false;
      userEl.textContent = session.user?.email || "Inloggad";
    }
    if (logout) {
      logout.hidden = false;
      logout.addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.href = siteUrl("logga-in.html");
      });
    }
    if (pageList) await loadPages(supabase);
  } catch (error) {
    console.error(error);
    if (gate) gate.textContent = "Inloggningen kunde inte nås. Kontrollera nätverket och js/config.js.";
    showShell();
  }
}

function showShell() {
  if (bar) bar.hidden = false;
  if (shell) shell.hidden = false;
}

async function loadPages(supabase) {
  const { data, error } = await supabase
    .from("internal_pages")
    .select("slug, title, body, sort_order")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error(error);
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = "Inga undersidor kunde hämtas. Tabellen internal_pages kanske inte är skapad ännu.";
    pageList.replaceChildren(note);
    return;
  }
  loadedPages = (data || []).filter((page) => safeSlug(page.slug));
  renderPageLinks(loadedPages);
  if (article) {
    showArticle(loadedPages);
    window.addEventListener("hashchange", () => showArticle(loadedPages));
  }
}

function renderPageLinks(pages) {
  pageList.replaceChildren();
  const current = currentSlug();
  pages.forEach((page) => {
    const slug = safeSlug(page.slug);
    const link = document.createElement("a");
    link.href = `index.html#${slug}`;
    link.textContent = page.title || slug;
    if (slug === current) link.setAttribute("aria-current", "page");
    pageList.append(link);
  });
}

function showArticle(pages) {
  const slug = currentSlug();
  renderPageLinks(pages);
  article.replaceChildren();
  const page = pages.find((item) => safeSlug(item.slug) === slug);
  if (!page) return;
  const heading = document.createElement("h2");
  heading.textContent = page.title || page.slug;
  const body = document.createElement("div");
  body.className = "prose";
  body.textContent = page.body || "";
  article.append(heading, body);
}

function currentSlug() {
  return safeSlug(decodeURIComponent(window.location.hash.replace(/^#/, "")));
}

function safeSlug(value) {
  const slug = String(value || "").toLowerCase();
  return /^[a-z0-9-]+$/.test(slug) ? slug : "";
}
