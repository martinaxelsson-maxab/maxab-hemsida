import { EMPTY_LISTING_TEXT, selectListings } from "./listings-model.js";
import { wireForms } from "./site.js";

const INTEREST_EMAIL = "martin@maxab.com";
const list = document.querySelector("#lediga-lista");

if (list) {
  loadListings();
}

async function loadListings() {
  const drafts = new URLSearchParams(window.location.search).get("utkast") === "1";
  try {
    const response = await fetch("data/lediga.json", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Kunde inte hämta listan");
    const data = await response.json();
    const items = selectListings(data, { drafts });
    render(items, { drafts });
  } catch (error) {
    console.error(error);
    list.replaceChildren();
    const alert = document.createElement("p");
    alert.className = "banner";
    alert.setAttribute("role", "alert");
    alert.textContent = "Lokallistan kunde inte läsas in. Försök igen om en stund.";
    list.append(alert);
    list.removeAttribute("aria-busy");
  }
}

function render(items, { drafts }) {
  list.replaceChildren();
  list.removeAttribute("aria-busy");
  if (drafts) {
    const banner = document.createElement("p");
    banner.className = "banner";
    banner.setAttribute("role", "status");
    banner.textContent =
      "Förhandsvisning. Objekt som inte har published: true syns bara med ?utkast=1 och visas inte för vanliga besökare.";
    list.append(banner);
  }
  if (items.length === 0) {
    list.append(emptyState());
    wireForms(list);
    return;
  }
  items.forEach((item, index) => list.append(listingArticle(item, index)));
  wireForms(list);
}

function emptyState() {
  const wrap = document.createElement("div");
  const title = document.createElement("p");
  title.className = "empty-title";
  title.textContent = EMPTY_LISTING_TEXT;
  const details = document.createElement("details");
  details.className = "interest";
  const summary = document.createElement("summary");
  summary.textContent = "Skicka en förfrågan";
  details.append(summary, interestForm({
    idPrefix: "allman",
    subject: "Intresseanmälan: allmän förfrågan",
    objekt: "Allmän förfrågan",
  }));
  wrap.append(title, details);
  return wrap;
}

function listingArticle(item, index) {
  const article = document.createElement("article");
  article.className = "listing";
  article.id = `objekt-${item.id}`;

  if (item.typeLabel) {
    const type = document.createElement("p");
    type.className = "listing-type";
    type.textContent = item.typeLabel;
    article.append(type);
  }

  const heading = document.createElement("h2");
  heading.textContent = item.title;
  if (item.draft) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Utkast";
    heading.append(badge);
  }
  article.append(heading);

  if (item.address) {
    const address = document.createElement("p");
    address.className = "listing-address";
    address.textContent = item.address;
    article.append(address);
  }

  const rows = [
    ["Yta", item.area],
    ["Tillträde", item.access],
    ["Hyra", item.rent],
  ].filter(([, value]) => value);
  if (rows.length) {
    const meta = document.createElement("dl");
    meta.className = "meta";
    rows.forEach(([label, value]) => {
      const group = document.createElement("div");
      const term = document.createElement("dt");
      term.textContent = label;
      const definition = document.createElement("dd");
      definition.textContent = value;
      group.append(term, definition);
      meta.append(group);
    });
    article.append(meta);
  }

  if (item.description) {
    const text = document.createElement("p");
    text.className = "listing-text";
    text.textContent = item.description;
    article.append(text);
  }

  if (item.images.length) {
    const gallery = document.createElement("div");
    gallery.className = "listing-images";
    item.images.forEach((src, imageIndex) => {
      const image = document.createElement("img");
      image.src = src;
      image.alt = `${item.title}, bild ${imageIndex + 1}`;
      gallery.append(image);
    });
    article.append(gallery);
  }

  const details = document.createElement("details");
  details.className = "interest";
  const summary = document.createElement("summary");
  summary.textContent = "Anmäl intresse";
  details.append(summary, interestForm({
    idPrefix: `${item.id}-${index}`,
    subject: `Intresseanmälan: ${item.title}`,
    objekt: item.title,
  }));
  article.append(details);
  return article;
}

function interestForm({ idPrefix, subject, objekt }) {
  const form = document.createElement("form");
  form.className = "form";
  form.action = `https://formsubmit.co/${INTEREST_EMAIL}`;
  form.method = "POST";
  form.acceptCharset = "UTF-8";
  form.dataset.maxabForm = "intresse";
  form.dataset.thanks = "intresse";
  form.append(
    hidden("_subject", subject),
    hidden("_template", "table"),
    hidden("_captcha", "true"),
    hidden("_next", ""),
    hidden("_replyto", ""),
    hidden("Objekt", objekt),
    honey(),
    note("Fält med * är obligatoriska."),
    field({ id: `${idPrefix}-namn`, label: "Namn", name: "Namn", required: true, autocomplete: "name", maxlength: "120" }),
    field({ id: `${idPrefix}-foretag`, label: "Företag", name: "Företag", autocomplete: "organization", maxlength: "160" }),
    field({ id: `${idPrefix}-telefon`, label: "Telefon", name: "Telefon", type: "tel", required: true, autocomplete: "tel", maxlength: "40" }),
    field({ id: `${idPrefix}-epost`, label: "E-post", name: "E-post", type: "email", required: true, autocomplete: "email", maxlength: "120" }),
    field({ id: `${idPrefix}-meddelande`, label: "Meddelande", name: "Meddelande", type: "textarea", required: true, maxlength: "5000" }),
    submitButton("Skicka intresseanmälan"),
    hint(`Förfrågan skickas till ${INTEREST_EMAIL}. En kort kontroll mot skräppost kan visas.`),
  );
  return form;
}

function hidden(name, value) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  return input;
}

function honey() {
  const wrap = document.createElement("div");
  wrap.className = "honey";
  wrap.setAttribute("aria-hidden", "true");
  const label = document.createElement("label");
  label.textContent = "Lämna tomt";
  const input = document.createElement("input");
  input.type = "text";
  input.name = "_honey";
  input.tabIndex = -1;
  input.autocomplete = "off";
  label.append(input);
  wrap.append(label);
  return wrap;
}

function note(text) {
  const paragraph = document.createElement("p");
  paragraph.className = "hint required-note";
  paragraph.textContent = text;
  return paragraph;
}

function hint(text) {
  const paragraph = document.createElement("p");
  paragraph.className = "hint";
  paragraph.textContent = text;
  return paragraph;
}

function submitButton(text) {
  const button = document.createElement("button");
  button.className = "button";
  button.type = "submit";
  button.textContent = text;
  return button;
}

function field({ id, label, name, type = "text", required = false, autocomplete, maxlength }) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const labelEl = document.createElement("label");
  labelEl.htmlFor = id;
  labelEl.append(document.createTextNode(label));
  if (required) {
    const star = document.createElement("span");
    star.setAttribute("aria-hidden", "true");
    star.textContent = " *";
    labelEl.append(star);
  }
  const control = document.createElement(type === "textarea" ? "textarea" : "input");
  if (control.tagName === "INPUT") control.type = type;
  else control.rows = 5;
  control.id = id;
  control.name = name;
  if (required) control.required = true;
  if (autocomplete) control.autocomplete = autocomplete;
  if (type === "tel") control.inputMode = "tel";
  if (maxlength) control.maxLength = Number(maxlength);
  wrap.append(labelEl, control);
  return wrap;
}
