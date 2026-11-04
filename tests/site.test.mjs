import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { formatArea, safeImage, selectListings } from "../js/listings-model.js";

const root = path.resolve(import.meta.dirname, "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

function htmlFiles(dir = root, prefix = "") {
  const found = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "tests") continue;
    const abs = path.join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(abs).isDirectory()) found.push(...htmlFiles(abs, rel));
    else if (name.endsWith(".html")) found.push(rel);
  }
  return found;
}

test("exempelobjektet är dolt som standard och syns i förhandsvisning", () => {
  const data = JSON.parse(read("data/lediga.json"));
  assert.equal(data.objekt.length, 1);
  assert.equal(data.objekt[0].published, false);
  assert.equal(data.objekt[0].id, "exempel-objekt");
  assert.deepEqual(selectListings(data), []);
  const drafts = selectListings(data, { drafts: true });
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].draft, true);
  assert.equal(drafts[0].typeLabel, "Industri");
  assert.equal(drafts[0].area, "500 m²");
});

test("bara published true visas publikt", () => {
  const data = {
    objekt: [
      { id: "syns", published: true, title: "Syns", type: "kontor", areaSqm: 12 },
      { id: "dold", published: false, title: "Dold", type: "handel" },
      { id: "saknas", title: "Utan flagga", type: "industri" },
    ],
  };
  const visible = selectListings(data).map((item) => item.id);
  assert.deepEqual(visible, ["syns"]);
  assert.equal(selectListings(data)[0].typeLabel, "Kontor");
});

test("bilder utanför sajten tas bort", () => {
  assert.equal(safeImage("assets/objekt/foto.jpg"), "assets/objekt/foto.jpg");
  assert.equal(safeImage("https://example.com/a.jpg"), "");
  assert.equal(safeImage("../hemlig.jpg"), "");
  assert.equal(safeImage("/etc/passwd"), "");
});

test("yta formateras på svenska", () => {
  assert.equal(formatArea(500), "500 m²");
  assert.equal(formatArea(-1), "");
  assert.equal(formatArea("500"), "");
});

test("felanmälan går till thomas och intresseanmälan till martin", () => {
  const fault = read("felanmalan.html");
  const interest = read("js/lediga.js");
  assert.match(fault, /https:\/\/formsubmit\.co\/thomas@maxab\.com/);
  assert.match(fault, /name="_subject"/);
  assert.match(fault, /name="_template" value="table"/);
  assert.match(fault, /name="_captcha" value="true"/);
  assert.match(fault, /name="_next"/);
  assert.match(fault, /enctype="multipart\/form-data"/);
  assert.doesNotMatch(fault, /martin@maxab\.com/);
  assert.match(interest, /martin@maxab\.com/);
  assert.match(interest, /Intresseanmälan:/);
  assert.doesNotMatch(interest, /thomas@maxab\.com/);
});

test("konfigurationen är platshållare utan hemliga nycklar", () => {
  const config = read("js/config.js");
  const pages = htmlFiles().map(read).join("\n");
  assert.match(config, /YOUR_PROJECT_REF/);
  assert.match(config, /YOUR_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(config, /service_role\s*[:=]/);
  assert.doesNotMatch(pages, /eyJ[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(config, /eyJ[A-Za-z0-9_-]{20,}/);
});

test("interna tabellen är låst för anonyma", () => {
  const sql = read("intern/schema.sql");
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /to authenticated/);
  assert.match(sql, /revoke all on table public\.internal_pages from anon/i);
});

test("ingen CNAME-fil är incheckad", () => {
  assert.throws(() => read("CNAME"));
});

test("html-sidorna är svenska och länkarna finns", () => {
  const files = htmlFiles();
  assert.ok(files.includes("index.html"));
  assert.ok(files.includes("felanmalan.html"));
  assert.ok(files.includes("lediga.html"));
  assert.ok(files.includes("logga-in.html"));
  assert.ok(files.includes("intern/index.html"));
  for (const file of files) {
    const html = read(file);
    assert.match(html, /<html lang="sv">/, file);
    assert.match(html, /<main[\s>]/, file);
    assert.match(html, /logo-liggande\.svg/, file);
    const dir = path.posix.dirname(file);
    const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
    for (const ref of refs) {
      if (/^(https?:|mailto:|#|data:)/.test(ref)) continue;
      const clean = ref.split("#")[0].split("?")[0];
      if (!clean) continue;
      const target = path.normalize(path.join(root, dir === "." ? "" : dir, clean));
      assert.equal(statSync(target).isFile() || statSync(target).isDirectory(), true, `${file} → ${ref}`);
    }
  }
});
