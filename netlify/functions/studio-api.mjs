// VSN Studio — private workspace API (Netlify Functions v2)
// Auth: POST /api/studio/login {passcode} -> {token}; then Authorization: Bearer <token>
// Collections (all auth): leads, jobs, proposals   GET /:col, POST /:col, GET/PATCH/DELETE /:col/:id
//   GET /leads also syncs Netlify Forms submissions (?force=1 to bypass throttle)
// Extras: GET/PUT /settings, POST /proposals/:id/send, POST /files (multipart) , GET /files/:id, DELETE /files/:id
// Public (no auth): GET /public/proposal/:token, POST /public/proposal/:token/accept, GET /public/file/:id?sig=
// Env: CRM_PASSCODE, NETLIFY_FORMS_TOKEN, SITE_ID (auto)
import { getStore } from "@netlify/blobs";

const SITE_ID_FALLBACK = "9a8995ff-013e-41b3-b18e-2bdf8243cb1f";
const FORM_NAMES = ["lead", "contact"];
const SYNC_MIN_INTERVAL_MS = 45_000;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 90;
const LEAD_STATUSES = ["new", "contacted", "booked", "proposal", "won", "lost"];
const JOB_PHASES = ["pre-design", "concept", "schematic", "design-development", "construction-docs", "permitting", "construction", "complete"];
const JOB_STATUSES = ["active", "on-hold", "complete", "archived"];
const PROPOSAL_STATUSES = ["draft", "sent", "viewed", "accepted", "declined", "expired"];
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...extra } });

/* ---------- crypto / auth ---------- */
const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode("vsn-studio|" + secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function sign(secret, msg) { return b64url(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(msg))); }
async function issueToken(secret) {
  const p = b64url(enc.encode(JSON.stringify({ iat: Date.now(), exp: Date.now() + TOKEN_TTL_MS })));
  return `${p}.${await sign(secret, p)}`;
}
async function verifyToken(secret, token) {
  if (!token || !token.includes(".")) return false;
  const [p, sig] = token.split(".");
  try {
    if (!(await crypto.subtle.verify("HMAC", await hmacKey(secret), fromB64url(sig), enc.encode(p)))) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(fromB64url(p)));
    return typeof exp === "number" && exp > Date.now();
  } catch { return false; }
}
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0;
}
const uid = () => crypto.randomUUID();
const shortToken = () => b64url(crypto.getRandomValues(new Uint8Array(18)));

/* ---------- storage ---------- */
const store = () => getStore({ name: "vsn-crm", consistency: "strong" });
const files = () => getStore({ name: "vsn-files", consistency: "strong" });
async function loadDB() {
  const db = (await store().get("db", { type: "json" })) || {};
  db.leads ||= {}; db.jobs ||= {}; db.proposals ||= {}; db.meta ||= {}; db.settings ||= {};
  return db;
}
const saveDB = (db) => store().setJSON("db", db);
const DEFAULT_SETTINGS = {
  studio_name: "Studio Visionary",
  owner_name: "Noah Villeroel",
  email: "nextvisionarydesign@gmail.com",
  phone: "",
  website: "vsndesignstudio.com",
  address: "",
  calendly: "https://calendly.com/nextvisionarydesign/30min",
  proposal_intro: "Thank you for the opportunity to collaborate on your project. This proposal outlines the scope of architectural design services, the phases of work, and the associated fees.",
  proposal_terms: "Fees are invoiced at the completion of each phase unless otherwise noted. A retainer equal to the first phase fee is due upon acceptance and is credited toward the final invoice. Additional services beyond the scope described (including significant design changes after approval, additional meetings, or agency resubmittals) are billed hourly or by separate agreement. Reimbursable expenses (printing, permit fees, consultants, travel) are billed at cost. This proposal is valid for 30 days.",
  default_phases: [
    { name: "Pre-Design & Site Analysis", desc: "Site visit, existing conditions, code & zoning review, program development.", fee: 0 },
    { name: "Concept Design", desc: "Initial massing and layout options, 3D studies, design direction.", fee: 0 },
    { name: "Schematic Design", desc: "Refined plans, elevations and sections; preliminary materials.", fee: 0 },
    { name: "Design Development", desc: "Detailed drawings, coordination with consultants, finish selections.", fee: 0 },
    { name: "Construction Documents", desc: "Permit-ready drawing set and specifications.", fee: 0 },
  ],
  default_exclusions: "Structural, MEP and civil engineering; surveys and geotechnical reports; permit and agency fees; interior furnishings procurement; construction administration unless listed above.",
  proposal_prefix: "SV",
};

/* ---------- Netlify Forms sync ---------- */
async function nf(path, token) {
  const r = await fetch(`https://api.netlify.com/api/v1${path}`, { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Netlify API ${r.status} for ${path}`);
  return r.json();
}
function normalizeSubmission(s) {
  const d = s.data || {};
  return {
    id: `nf_${s.id}`, source: s.form_name || "netlify",
    name: (d.name || s.name || "").trim() || "Unknown", email: (d.email || s.email || "").trim(), phone: (d.phone || "").trim(),
    project_type: d.project_type || "", budget: d.budget || "", timeline: d.timeline || "",
    description: d.description || d.projectDetails || d.message || "",
    created_at: s.created_at, status: "new", next_follow_up: null, notes: [], updated_at: s.created_at,
  };
}
async function syncFromForms(db, { force = false } = {}) {
  const token = process.env.NETLIFY_FORMS_TOKEN;
  const siteId = process.env.SITE_ID || SITE_ID_FALLBACK;
  if (!token) return { synced: false, reason: "NETLIFY_FORMS_TOKEN not set" };
  if (!force && Date.now() - (db.meta.last_sync || 0) < SYNC_MIN_INTERVAL_MS) return { synced: false, reason: "throttled" };
  const forms = await nf(`/sites/${siteId}/forms`, token);
  let added = 0;
  const deleted = new Set(db.meta.deleted || []);
  for (const form of forms) {
    if (!FORM_NAMES.includes(form.name)) continue;
    for (let page = 1; ; page++) {
      const subs = await nf(`/forms/${form.id}/submissions?per_page=100&page=${page}`, token);
      for (const s of subs) {
        const lead = normalizeSubmission({ ...s, form_name: form.name });
        if (!db.leads[lead.id] && !deleted.has(lead.id)) { db.leads[lead.id] = lead; added++; }
      }
      if (subs.length < 100) break;
    }
  }
  db.meta.last_sync = Date.now();
  return { synced: true, added };
}

/* ---------- helpers ---------- */
const now = () => new Date().toISOString();
const str = (v, max = 5000) => (typeof v === "string" ? v.trim().slice(0, max) : v == null ? "" : String(v).slice(0, max));
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const byDate = (k, desc = true) => (a, b) => (desc ? 1 : -1) * (new Date(b[k] || 0) - new Date(a[k] || 0));
const proposalTotal = (p) => (p.phases || []).reduce((s, ph) => s + num(ph.fee), 0);

function pickClient(c = {}) {
  return { name: str(c.name, 200), email: str(c.email, 200), phone: str(c.phone, 60), company: str(c.company, 200), address: str(c.address, 400) };
}
function sanitizePhases(arr) {
  return Array.isArray(arr) ? arr.slice(0, 30).map((p) => ({ name: str(p.name, 200), desc: str(p.desc, 2000), fee: num(p.fee), weeks: str(p.weeks, 40) })) : [];
}
function sanitizeList(arr, max = 50) { return Array.isArray(arr) ? arr.slice(0, max).map((x) => str(x, 500)).filter(Boolean) : []; }
function nextProposalNumber(db) {
  const year = new Date().getFullYear();
  const prefix = db.settings.proposal_prefix || "SV";
  const n = Object.values(db.proposals).filter((p) => (p.number || "").startsWith(`${prefix}-${year}`)).length + 1;
  return `${prefix}-${year}-${String(n).padStart(3, "0")}`;
}
function proposalPublicView(p, settings) {
  const { token, ...rest } = p; // never leak nothing sensitive; token is in the URL anyway, strip for tidiness
  return { proposal: { ...rest, total: proposalTotal(p) }, studio: { name: settings.studio_name, owner: settings.owner_name, email: settings.email, phone: settings.phone, website: settings.website, address: settings.address } };
}

/* ---------- collection handlers ---------- */
const collections = {
  leads: {
    create(b) {
      return {
        id: `manual_${uid()}`, source: str(b.source, 60) || "manual", name: str(b.name, 200) || "Unknown", email: str(b.email, 200), phone: str(b.phone, 60),
        project_type: str(b.project_type, 200), budget: str(b.budget, 100), timeline: str(b.timeline, 100), description: str(b.description),
        created_at: now(), status: LEAD_STATUSES.includes(b.status) ? b.status : "new", next_follow_up: b.next_follow_up || null,
        notes: b.note ? [{ id: uid(), text: str(b.note), at: now() }] : [], updated_at: now(),
      };
    },
    update(l, b) {
      if (b.status !== undefined) { if (!LEAD_STATUSES.includes(b.status)) throw new Error("Bad status"); l.status = b.status; }
      if (b.next_follow_up !== undefined) l.next_follow_up = b.next_follow_up || null;
      for (const k of ["name", "email", "phone", "project_type", "budget", "timeline", "description"]) if (typeof b[k] === "string") l[k] = str(b[k]);
      if (b.note && str(b.note)) { l.notes ||= []; l.notes.push({ id: uid(), text: str(b.note), at: now() }); }
      if (b.delete_note_id) l.notes = (l.notes || []).filter((n) => n.id !== b.delete_note_id);
      if (b.job_id !== undefined) l.job_id = b.job_id || null;
    },
    onDelete(db, id) { db.meta.deleted = [...new Set([...(db.meta.deleted || []), id])].slice(-5000); },
    sort: byDate("created_at"),
  },
  jobs: {
    create(b) {
      return {
        id: `job_${uid()}`, title: str(b.title, 200) || "Untitled project", client: pickClient(b.client), site_address: str(b.site_address, 400),
        project_type: str(b.project_type, 200), phase: JOB_PHASES.includes(b.phase) ? b.phase : "pre-design", status: JOB_STATUSES.includes(b.status) ? b.status : "active",
        fee: num(b.fee), start_date: b.start_date || null, target_date: b.target_date || null, description: str(b.description),
        lead_id: b.lead_id || null, notes: b.note ? [{ id: uid(), text: str(b.note), at: now() }] : [], tasks: [], invoices: [], files: [], links: [],
        created_at: now(), updated_at: now(),
      };
    },
    update(j, b) {
      for (const k of ["title", "site_address", "project_type", "description"]) if (typeof b[k] === "string") j[k] = str(b[k]);
      if (b.client) j.client = pickClient({ ...j.client, ...b.client });
      if (b.phase !== undefined) { if (!JOB_PHASES.includes(b.phase)) throw new Error("Bad phase"); j.phase = b.phase; }
      if (b.status !== undefined) { if (!JOB_STATUSES.includes(b.status)) throw new Error("Bad status"); j.status = b.status; }
      if (b.fee !== undefined) j.fee = num(b.fee);
      if (b.start_date !== undefined) j.start_date = b.start_date || null;
      if (b.target_date !== undefined) j.target_date = b.target_date || null;
      if (b.lead_id !== undefined) j.lead_id = b.lead_id || null;
      if (b.note && str(b.note)) { j.notes ||= []; j.notes.push({ id: uid(), text: str(b.note), at: now() }); }
      if (b.delete_note_id) j.notes = (j.notes || []).filter((n) => n.id !== b.delete_note_id);
      // tasks
      if (b.add_task) j.tasks.push({ id: uid(), text: str(b.add_task.text, 500), due: b.add_task.due || null, done: false, at: now() });
      if (b.toggle_task) { const t = j.tasks.find((t) => t.id === b.toggle_task); if (t) t.done = !t.done; }
      if (b.delete_task) j.tasks = j.tasks.filter((t) => t.id !== b.delete_task);
      // invoices
      if (b.add_invoice) j.invoices.push({ id: uid(), label: str(b.add_invoice.label, 200), amount: num(b.add_invoice.amount), due: b.add_invoice.due || null, paid_at: null, at: now() });
      if (b.toggle_invoice) { const i = j.invoices.find((i) => i.id === b.toggle_invoice); if (i) i.paid_at = i.paid_at ? null : now(); }
      if (b.delete_invoice) j.invoices = j.invoices.filter((i) => i.id !== b.delete_invoice);
      // links
      if (b.add_link) j.links.push({ id: uid(), label: str(b.add_link.label, 200), url: str(b.add_link.url, 1000), at: now() });
      if (b.delete_link) j.links = (j.links || []).filter((l) => l.id !== b.delete_link);
      if (b.remove_file) j.files = (j.files || []).filter((f) => f.id !== b.remove_file);
    },
    sort: byDate("updated_at"),
  },
  proposals: {
    create(b, db) {
      const s = { ...DEFAULT_SETTINGS, ...db.settings };
      return {
        id: `prop_${uid()}`, number: nextProposalNumber(db), token: shortToken(),
        title: str(b.title, 200) || "Architectural Design Services", client: pickClient(b.client), project_address: str(b.project_address, 400),
        project_summary: str(b.project_summary, 3000), intro: str(b.intro) || s.proposal_intro,
        phases: b.phases ? sanitizePhases(b.phases) : s.default_phases.map((p) => ({ ...p })), scope: sanitizeList(b.scope), deliverables: sanitizeList(b.deliverables),
        exclusions: str(b.exclusions) || s.default_exclusions, terms: str(b.terms) || s.proposal_terms,
        valid_until: b.valid_until || new Date(Date.now() + 30 * 86400e3).toISOString().slice(0, 10),
        status: "draft", job_id: b.job_id || null, lead_id: b.lead_id || null,
        sent_at: null, viewed_at: null, accepted_at: null, accepted_by: null, declined_at: null, decline_reason: null, views: 0,
        created_at: now(), updated_at: now(),
      };
    },
    update(p, b) {
      for (const k of ["title", "project_address", "project_summary", "intro", "exclusions", "terms"]) if (typeof b[k] === "string") p[k] = str(b[k]);
      if (b.client) p.client = pickClient({ ...p.client, ...b.client });
      if (b.phases) p.phases = sanitizePhases(b.phases);
      if (b.scope) p.scope = sanitizeList(b.scope);
      if (b.deliverables) p.deliverables = sanitizeList(b.deliverables);
      if (b.valid_until !== undefined) p.valid_until = b.valid_until || null;
      if (b.job_id !== undefined) p.job_id = b.job_id || null;
      if (b.lead_id !== undefined) p.lead_id = b.lead_id || null;
      if (b.status !== undefined) { if (!PROPOSAL_STATUSES.includes(b.status)) throw new Error("Bad status"); p.status = b.status; if (b.status === "sent" && !p.sent_at) p.sent_at = now(); }
      if (b.regenerate_token) p.token = shortToken();
    },
    sort: byDate("updated_at"),
  },
};

async function handleCollection(req, url, col, id) {
  const def = collections[col];
  if (!def) return json({ error: "Not found" }, 404);
  const db = await loadDB();
  if (req.method === "GET" && !id) {
    let sync = null;
    if (col === "leads") {
      try { sync = await syncFromForms(db, { force: url.searchParams.get("force") === "1" }); if (sync.synced) await saveDB(db); }
      catch (e) { sync = { synced: false, reason: e.message }; }
    }
    return json({ items: Object.values(db[col]).sort(def.sort), ...(sync ? { sync } : {}) });
  }
  if (req.method === "POST" && !id) {
    const b = await req.json().catch(() => ({}));
    if (col === "leads" && !b.name && !b.email && !b.phone) return json({ error: "Name, email or phone required" }, 400);
    const item = def.create(b, db);
    db[col][item.id] = item;
    // link lead → job
    if (col === "jobs" && item.lead_id && db.leads[item.lead_id]) { db.leads[item.lead_id].job_id = item.id; if (db.leads[item.lead_id].status !== "won") db.leads[item.lead_id].status = "won"; }
    await saveDB(db);
    return json({ item }, 201);
  }
  const item = id && db[col][id];
  if (!item) return json({ error: "Not found" }, 404);
  if (req.method === "GET") return json({ item });
  if (req.method === "PATCH") {
    const b = await req.json().catch(() => ({}));
    try { def.update(item, b, db); } catch (e) { return json({ error: e.message }, 400); }
    item.updated_at = now();
    await saveDB(db);
    return json({ item });
  }
  if (req.method === "DELETE") {
    delete db[col][id];
    def.onDelete?.(db, id);
    await saveDB(db);
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
}

/* ---------- proposals extras ---------- */
async function handleProposalAction(req, id, action) {
  const db = await loadDB();
  const p = db.proposals[id];
  if (!p) return json({ error: "Not found" }, 404);
  if (action === "send") {
    p.status = p.status === "draft" || p.status === "expired" ? "sent" : p.status;
    p.sent_at ||= now(); p.updated_at = now();
    // mark linked lead
    if (p.lead_id && db.leads[p.lead_id] && ["new", "contacted", "booked"].includes(db.leads[p.lead_id].status)) db.leads[p.lead_id].status = "proposal";
    await saveDB(db);
    return json({ item: p });
  }
  if (action === "duplicate") {
    const copy = { ...structuredClone(p), id: `prop_${uid()}`, number: nextProposalNumber(db), token: shortToken(), status: "draft", sent_at: null, viewed_at: null, accepted_at: null, accepted_by: null, declined_at: null, decline_reason: null, views: 0, created_at: now(), updated_at: now() };
    db.proposals[copy.id] = copy; await saveDB(db);
    return json({ item: copy }, 201);
  }
  if (action === "convert") {
    // accepted proposal → job
    const b = await req.json().catch(() => ({}));
    const job = collections.jobs.create({ title: b.title || p.title, client: p.client, site_address: p.project_address, description: p.project_summary, fee: proposalTotal(p), lead_id: p.lead_id, project_type: b.project_type || "" }, db);
    job.proposal_id = p.id;
    job.invoices = (p.phases || []).filter((ph) => num(ph.fee) > 0).map((ph) => ({ id: uid(), label: ph.name, amount: num(ph.fee), due: null, paid_at: null, at: now() }));
    db.jobs[job.id] = job; p.job_id = job.id; p.updated_at = now();
    if (p.lead_id && db.leads[p.lead_id]) { db.leads[p.lead_id].job_id = job.id; db.leads[p.lead_id].status = "won"; }
    await saveDB(db);
    return json({ item: job }, 201);
  }
  return json({ error: "Unknown action" }, 404);
}

/* ---------- public proposal ---------- */
async function handlePublicProposal(req, token, action, isOwner) {
  const db = await loadDB();
  const p = Object.values(db.proposals).find((x) => x.token === token);
  if (!p || (p.status === "draft" && !isOwner)) return json({ error: "This proposal link is not available." }, 404);
  const settings = { ...DEFAULT_SETTINGS, ...db.settings };
  if (req.method === "GET") {
    if (isOwner) return json({ ...proposalPublicView(p, settings), preview: true }); // owner preview: no view tracking
    if (p.status === "sent") { p.status = "viewed"; p.viewed_at = now(); }
    p.views = (p.views || 0) + 1; p.last_viewed_at = now();
    if (p.valid_until && p.status !== "accepted" && p.valid_until < now().slice(0, 10)) p.status = "expired";
    await saveDB(db);
    return json(proposalPublicView(p, settings));
  }
  if (req.method === "POST" && action === "accept") {
    const b = await req.json().catch(() => ({}));
    const name = str(b.name, 200);
    if (!name) return json({ error: "Please type your full name to accept." }, 400);
    if (p.status === "expired") return json({ error: "This proposal has expired. Please contact the studio for an updated proposal." }, 400);
    if (p.status !== "accepted") {
      p.status = "accepted"; p.accepted_at = now(); p.accepted_by = { name, email: str(b.email, 200), ip: req.headers.get("x-nf-client-connection-ip") || "", ua: (req.headers.get("user-agent") || "").slice(0, 300) };
      p.updated_at = now();
      if (p.lead_id && db.leads[p.lead_id]) db.leads[p.lead_id].status = "won";
      await saveDB(db);
    }
    return json(proposalPublicView(p, settings));
  }
  if (req.method === "POST" && action === "decline") {
    const b = await req.json().catch(() => ({}));
    if (p.status !== "accepted") { p.status = "declined"; p.declined_at = now(); p.decline_reason = str(b.reason, 1000); p.updated_at = now(); await saveDB(db); }
    return json(proposalPublicView(p, settings));
  }
  return json({ error: "Not found" }, 404);
}

/* ---------- files ---------- */
async function handleFiles(req, id, url) {
  if (req.method === "POST" && !id) {
    const jobId = url.searchParams.get("job") || "";
    const ct = req.headers.get("content-type") || "";
    let name = "", type = "application/octet-stream", body;
    if (ct.startsWith("multipart/form-data")) {
      const form = await req.formData();
      const f = form.get("file");
      if (!f || typeof f === "string") return json({ error: "No file" }, 400);
      name = f.name; type = f.type || type; body = await f.arrayBuffer();
    } else {
      name = decodeURIComponent(req.headers.get("x-file-name") || "upload"); type = ct || type; body = await req.arrayBuffer();
    }
    if (body.byteLength > MAX_FILE_BYTES) return json({ error: "File too large (max 15 MB)" }, 413);
    const fid = uid();
    await files().set(fid, body, { metadata: { name, type, size: body.byteLength, job: jobId, at: now() } });
    const meta = { id: fid, name, type, size: body.byteLength, at: now() };
    if (jobId) {
      const db = await loadDB();
      if (db.jobs[jobId]) { db.jobs[jobId].files ||= []; db.jobs[jobId].files.push(meta); db.jobs[jobId].updated_at = now(); await saveDB(db); }
    }
    return json({ file: meta }, 201);
  }
  if (!id) return json({ error: "Not found" }, 404);
  if (req.method === "GET") {
    const res = await files().getWithMetadata(id, { type: "arrayBuffer" });
    if (!res) return json({ error: "Not found" }, 404);
    const m = res.metadata || {};
    return new Response(res.data, { headers: { "content-type": m.type || "application/octet-stream", "content-disposition": `${url.searchParams.get("dl") ? "attachment" : "inline"}; filename="${encodeURIComponent(m.name || id)}"`, "cache-control": "private, max-age=3600" } });
  }
  if (req.method === "DELETE") {
    await files().delete(id);
    const db = await loadDB();
    for (const j of Object.values(db.jobs)) if ((j.files || []).some((f) => f.id === id)) { j.files = j.files.filter((f) => f.id !== id); j.updated_at = now(); }
    await saveDB(db);
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
}

/* ---------- settings / dashboard ---------- */
async function handleSettings(req) {
  const db = await loadDB();
  if (req.method === "GET") return json({ settings: { ...DEFAULT_SETTINGS, ...db.settings } });
  if (req.method === "PUT" || req.method === "PATCH") {
    const b = await req.json().catch(() => ({}));
    const s = { ...DEFAULT_SETTINGS, ...db.settings };
    for (const k of ["studio_name", "owner_name", "email", "phone", "website", "address", "calendly", "proposal_intro", "proposal_terms", "default_exclusions", "proposal_prefix"]) if (typeof b[k] === "string") s[k] = str(b[k]);
    if (b.default_phases) s.default_phases = sanitizePhases(b.default_phases);
    db.settings = s; await saveDB(db);
    return json({ settings: s });
  }
  return json({ error: "Method not allowed" }, 405);
}
async function handleOverview() {
  const db = await loadDB();
  return json({ leads: Object.values(db.leads).sort(collections.leads.sort), jobs: Object.values(db.jobs).sort(collections.jobs.sort), proposals: Object.values(db.proposals).sort(collections.proposals.sort), settings: { ...DEFAULT_SETTINGS, ...db.settings } });
}

/* ---------- router ---------- */
export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/\.netlify\/functions\/studio-api/, "").replace(/^\/api\/studio/, "").replace(/\/$/, "") || "/";
  const passcode = process.env.CRM_PASSCODE;
  if (!passcode) return json({ error: "CRM_PASSCODE env var is not configured on the Netlify site" }, 500);
  const seg = path.split("/").filter(Boolean).map(decodeURIComponent);

  try {
    // public
    if (seg[0] === "public" && seg[1] === "proposal" && seg[2]) {
      const t = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      return await handlePublicProposal(req, seg[2], seg[3], !!t && (await verifyToken(passcode, t)));
    }
    if (req.method === "POST" && path === "/login") {
      const body = await req.json().catch(() => ({}));
      if (!timingSafeEqual(String(body.passcode || ""), passcode)) { await new Promise((r) => setTimeout(r, 700)); return json({ error: "Wrong passcode" }, 401); }
      return json({ token: await issueToken(passcode) });
    }
    // auth
    const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "") || url.searchParams.get("t") || "";
    if (!(await verifyToken(passcode, auth))) return json({ error: "Unauthorized" }, 401);

    if (path === "/overview") return await handleOverview();
    if (seg[0] === "settings") return await handleSettings(req);
    if (seg[0] === "files") return await handleFiles(req, seg[1], url);
    if (seg[0] === "proposals" && seg[1] && seg[2]) return await handleProposalAction(req, seg[1], seg[2]);
    if (collections[seg[0]] && seg.length <= 2) return await handleCollection(req, url, seg[0], seg[1]);
    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: e.message || "Server error" }, 500);
  }
};

export const config = { path: "/api/studio/*" };
