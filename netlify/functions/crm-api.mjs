// VSN Leads CRM — API (Netlify Functions v2)
// Routes (all under /api/crm):
//   POST   /api/crm/login            {passcode} -> {token}
//   GET    /api/crm/leads            (syncs from Netlify Forms, then returns all leads)
//   POST   /api/crm/leads            create a manual lead
//   PATCH  /api/crm/leads/:id        update status / follow-up / fields, append note
//   DELETE /api/crm/leads/:id
//
// Env vars (set in Netlify site settings):
//   CRM_PASSCODE          passcode to unlock the app
//   NETLIFY_FORMS_TOKEN   personal access token used to read form submissions
//   SITE_ID               provided automatically by Netlify at runtime
import { getStore } from "@netlify/blobs";

const SITE_ID_FALLBACK = "9a8995ff-013e-41b3-b18e-2bdf8243cb1f";
const FORM_NAMES = ["lead", "contact"];
const SYNC_MIN_INTERVAL_MS = 45_000;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 days
export const STATUSES = ["new", "contacted", "booked", "proposal", "won", "lost"];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/* ---------- auth ---------- */
const enc = new TextEncoder();
const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode("vsn-crm|" + secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}
async function issueToken(secret) {
  const payload = JSON.stringify({ iat: Date.now(), exp: Date.now() + TOKEN_TTL_MS });
  const p = b64url(enc.encode(payload));
  const sig = b64url(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(p)));
  return `${p}.${sig}`;
}
async function verifyToken(secret, token) {
  if (!token || !token.includes(".")) return false;
  const [p, sig] = token.split(".");
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromB64url(sig), enc.encode(p));
    if (!ok) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(fromB64url(p)));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* ---------- storage ---------- */
function store() {
  return getStore({ name: "vsn-crm", consistency: "strong" });
}
async function loadDB() {
  const db = (await store().get("db", { type: "json" })) || {};
  db.leads ||= {};
  db.meta ||= {};
  return db;
}
async function saveDB(db) {
  await store().setJSON("db", db);
}

/* ---------- Netlify Forms sync ---------- */
async function nf(path, token) {
  const r = await fetch(`https://api.netlify.com/api/v1${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Netlify API ${r.status} for ${path}`);
  return r.json();
}

function normalizeSubmission(s) {
  const d = s.data || {};
  const desc = d.description || d.projectDetails || d.message || "";
  return {
    id: `nf_${s.id}`,
    source: s.form_name || "netlify",
    name: (d.name || s.name || "").trim() || "Unknown",
    email: (d.email || s.email || "").trim(),
    phone: (d.phone || "").trim(),
    project_type: d.project_type || "",
    budget: d.budget || "",
    timeline: d.timeline || "",
    description: desc,
    created_at: s.created_at,
    // CRM fields
    status: "new",
    next_follow_up: null,
    notes: [],
    updated_at: s.created_at,
  };
}

async function syncFromForms(db, { force = false } = {}) {
  const token = process.env.NETLIFY_FORMS_TOKEN;
  const siteId = process.env.SITE_ID || SITE_ID_FALLBACK;
  if (!token) return { synced: false, reason: "NETLIFY_FORMS_TOKEN not set" };
  const last = db.meta.last_sync || 0;
  if (!force && Date.now() - last < SYNC_MIN_INTERVAL_MS) return { synced: false, reason: "throttled" };

  const forms = await nf(`/sites/${siteId}/forms`, token);
  let added = 0;
  for (const form of forms) {
    if (!FORM_NAMES.includes(form.name)) continue;
    let page = 1;
    for (;;) {
      const subs = await nf(`/forms/${form.id}/submissions?per_page=100&page=${page}`, token);
      for (const s of subs) {
        const lead = normalizeSubmission({ ...s, form_name: form.name });
        if (!db.leads[lead.id]) {
          db.leads[lead.id] = lead;
          added++;
        }
      }
      if (subs.length < 100) break;
      page++;
    }
  }
  db.meta.last_sync = Date.now();
  db.meta.last_sync_added = added;
  return { synced: true, added };
}

/* ---------- handlers ---------- */
function sortLeads(db) {
  return Object.values(db.leads).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function handleLogin(req, passcode) {
  const body = await req.json().catch(() => ({}));
  if (!timingSafeEqual(String(body.passcode || ""), passcode)) {
    await new Promise((r) => setTimeout(r, 600)); // slow brute force a little
    return json({ error: "Wrong passcode" }, 401);
  }
  return json({ token: await issueToken(passcode) });
}

async function handleListLeads(url) {
  const db = await loadDB();
  let sync;
  try {
    sync = await syncFromForms(db, { force: url.searchParams.get("force") === "1" });
    if (sync.synced) await saveDB(db);
  } catch (e) {
    sync = { synced: false, reason: e.message };
  }
  return json({ leads: sortLeads(db), sync, statuses: STATUSES, last_sync: db.meta.last_sync || null });
}

async function handleCreateLead(req) {
  const b = await req.json().catch(() => ({}));
  if (!b.name && !b.email && !b.phone) return json({ error: "Name, email or phone required" }, 400);
  const now = new Date().toISOString();
  const lead = {
    id: `manual_${crypto.randomUUID()}`,
    source: "manual",
    name: (b.name || "").trim() || "Unknown",
    email: (b.email || "").trim(),
    phone: (b.phone || "").trim(),
    project_type: b.project_type || "",
    budget: b.budget || "",
    timeline: b.timeline || "",
    description: b.description || "",
    created_at: now,
    status: STATUSES.includes(b.status) ? b.status : "new",
    next_follow_up: b.next_follow_up || null,
    notes: b.note ? [{ id: crypto.randomUUID(), text: String(b.note), at: now }] : [],
    updated_at: now,
  };
  const db = await loadDB();
  db.leads[lead.id] = lead;
  await saveDB(db);
  return json({ lead }, 201);
}

async function handleUpdateLead(req, id) {
  const b = await req.json().catch(() => ({}));
  const db = await loadDB();
  const lead = db.leads[id];
  if (!lead) return json({ error: "Not found" }, 404);
  const now = new Date().toISOString();
  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) return json({ error: "Bad status" }, 400);
    lead.status = b.status;
  }
  if (b.next_follow_up !== undefined) lead.next_follow_up = b.next_follow_up || null;
  for (const k of ["name", "email", "phone", "project_type", "budget", "timeline", "description"]) {
    if (typeof b[k] === "string") lead[k] = b[k].trim();
  }
  if (b.note && String(b.note).trim()) {
    lead.notes ||= [];
    lead.notes.push({ id: crypto.randomUUID(), text: String(b.note).trim(), at: now });
  }
  if (b.delete_note_id) lead.notes = (lead.notes || []).filter((n) => n.id !== b.delete_note_id);
  lead.updated_at = now;
  await saveDB(db);
  return json({ lead });
}

async function handleDeleteLead(id) {
  const db = await loadDB();
  if (!db.leads[id]) return json({ error: "Not found" }, 404);
  delete db.leads[id];
  await saveDB(db);
  return json({ ok: true });
}

export default async (req) => {
  const url = new URL(req.url);
  const path =
    url.pathname.replace(/^\/\.netlify\/functions\/crm-api/, "").replace(/^\/api\/crm/, "").replace(/\/$/, "") || "/";
  const passcode = process.env.CRM_PASSCODE;
  if (!passcode) return json({ error: "CRM_PASSCODE env var is not configured on the Netlify site" }, 500);

  if (req.method === "POST" && path === "/login") return handleLogin(req, passcode);

  const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!(await verifyToken(passcode, auth))) return json({ error: "Unauthorized" }, 401);

  const m = path.match(/^\/leads(?:\/([^/]+))?$/);
  if (!m) return json({ error: "Not found" }, 404);
  const id = m[1] ? decodeURIComponent(m[1]) : null;

  try {
    if (req.method === "GET" && !id) return await handleListLeads(url);
    if (req.method === "POST" && !id) return await handleCreateLead(req);
    if (req.method === "PATCH" && id) return await handleUpdateLead(req, id);
    if (req.method === "DELETE" && id) return await handleDeleteLead(id);
  } catch (e) {
    return json({ error: e.message || "Server error" }, 500);
  }
  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/crm/*" };
