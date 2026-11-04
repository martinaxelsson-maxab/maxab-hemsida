import { siteRoot, siteUrl } from "./site.js";

const SUPABASE_LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm";

export function isConfigured(config = window.MAXAB_SUPABASE) {
  if (!config || typeof config.url !== "string" || typeof config.anonKey !== "string") return false;
  const url = config.url.trim();
  const key = config.anonKey.trim();
  if (!url.startsWith("https://") || key.length < 20) return false;
  if (url.includes("YOUR_PROJECT") || key.includes("YOUR_SUPABASE")) return false;
  return true;
}

export function safeNext(value) {
  const fallback = siteUrl("intern/");
  if (!value) return fallback;
  let url;
  try {
    url = new URL(value, window.location.href);
  } catch {
    return fallback;
  }
  const root = siteRoot();
  const rootPath = root.pathname.endsWith("/") ? root.pathname : `${root.pathname}/`;
  if (url.origin !== root.origin) return fallback;
  const sameSite = url.pathname === rootPath.slice(0, -1) || url.pathname.startsWith(rootPath);
  if (!sameSite) return fallback;
  url.username = "";
  url.password = "";
  return url.href;
}

export async function createSupabase() {
  if (!isConfigured()) return null;
  let createClient;
  try {
    ({ createClient } = await import(SUPABASE_LIB));
  } catch (error) {
    console.error(error);
    const failure = new Error("bibliotek");
    failure.reason = "network";
    throw failure;
  }
  const { url, anonKey } = window.MAXAB_SUPABASE;
  return createClient(url.trim(), anonKey.trim(), {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export async function currentSession(supabase) {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (code) {
    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    if (!exchanged.error && exchanged.data.session) {
      params.delete("code");
      const cleaned = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", cleaned);
      return exchanged.data.session;
    }
  }
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function sendMagicLink(supabase, email) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: siteUrl("intern/"),
      shouldCreateUser: false,
    },
  });
}

export function classifyAuthError(error) {
  const message = `${error?.message || ""}`.toLowerCase();
  const status = Number(error?.status || 0);
  if (error?.reason === "network" || message.includes("failed to fetch") || message.includes("network") || message.includes("load failed") || message === "bibliotek") {
    return "network";
  }
  if (message.includes("rate")) return "rate";
  if (status === 401 || message.includes("api key") || message.includes("invalid jwt")) return "config";
  return "soft";
}
