/* VSN Studio — core: state, api, router, layout, helpers */
export const API = "/api/studio";
export const state = {
  token: localStorage.getItem("vsn_studio_token") || "",
  leads: [], jobs: [], proposals: [], settings: {},
  loaded: false, loading: false, error: "", syncNote: "",
  seen: new Set(JSON.parse(localStorage.getItem("vsn_crm_seen") || "[]")),
  ui: JSON.parse(localStorage.getItem("vsn_studio_ui") || "{}"),
};
export const saveUI = () => localStorage.setItem("vsn_studio_ui", JSON.stringify(state.ui));
export const persistSeen = () => localStorage.setItem("vsn_crm_seen", JSON.stringify([...state.seen].slice(-3000)));

/* ---------- constants ---------- */
export const LEAD_STATUS = { new: "New", contacted: "Contacted", booked: "Consult booked", proposal: "Proposal sent", won: "Won", lost: "Lost" };
export const LEAD_ORDER = Object.keys(LEAD_STATUS);
export const JOB_PHASE = { "pre-design": "Pre-design", concept: "Concept", schematic: "Schematic", "design-development": "Design dev.", "construction-docs": "Construction docs", permitting: "Permitting", construction: "Construction", complete: "Complete" };
export const JOB_PHASES = Object.keys(JOB_PHASE);
export const JOB_STATUS = { active: "Active", "on-hold": "On hold", complete: "Complete", archived: "Archived" };
export const PROP_STATUS = { draft: "Draft", sent: "Sent", viewed: "Viewed", accepted: "Accepted", declined: "Declined", expired: "Expired" };

/* ---------- helpers ---------- */
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const money = (n) => (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const fmtWhen = (iso) => {
  if (!iso) return ""; const d = new Date(iso), now = new Date(), diff = (now - d) / 1000;
  if (diff < 60) return "just now"; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
};
export const fmtFull = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");
export const fmtDate = (ymd) => (ymd ? new Date(ymd + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—");
export const fmtDateShort = (ymd) => (ymd ? new Date(ymd + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "");
export const dueClass = (date) => { if (!date) return ""; const t = todayStr(); return date < t ? "overdue" : date === t ? "today" : "upcoming"; };
export const telHref = (p) => "tel:" + String(p || "").replace(/[^\d+]/g, "");
export const smsHref = (p, name) => "sms:" + String(p || "").replace(/[^\d+]/g, "") + "&body=" + encodeURIComponent(`Hi ${(name || "").split(" ")[0]}, this is ${(state.settings.owner_name || "Noah").split(" ")[0]} from ${state.settings.studio_name || "Studio Visionary"} — thanks for reaching out about your project. Would you be open to a quick call? You can also grab a time here: ${state.settings.calendly || ""}`);
export const mailHref = (e, name) => "mailto:" + encodeURIComponent(e || "") + "?subject=" + encodeURIComponent(`Your project — ${state.settings.studio_name || "Studio Visionary"}`) + "&body=" + encodeURIComponent(`Hi ${(name || "").split(" ")[0]},\n\nThanks for reaching out to ${state.settings.studio_name || "Studio Visionary"}. I'd love to hear more about your project. You can book a free 30‑minute consult here: ${state.settings.calendly || ""}\n\nBest,\n${state.settings.owner_name || "Noah"}\n${state.settings.studio_name || "Studio Visionary"}\n${state.settings.website || ""}`);
export const fmtBytes = (b) => (b > 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");
export const pill = (cls, label) => `<span class="pill dot c-${cls}">${esc(label)}</span>`;

let toastTimer;
export function toast(msg) {
  const $t = document.getElementById("toast"); $t.textContent = msg; $t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => ($t.hidden = true), 2400);
}
export function modal(html, onMount) {
  const bg = document.createElement("div"); bg.className = "modal-bg"; bg.innerHTML = `<div class="modal">${html}</div>`;
  bg.addEventListener("click", (e) => { if (e.target === bg) close(); });
  const close = () => bg.remove();
  document.body.appendChild(bg); onMount?.(bg, close); return close;
}
export function confirmDanger(btn, label, fn) {
  if (btn.dataset.armed !== "1") { btn.dataset.armed = "1"; const old = btn.textContent; btn.textContent = "Tap again to confirm"; setTimeout(() => { btn.dataset.armed = "0"; btn.textContent = label || old; }, 3000); return; }
  fn();
}

/* ---------- api ---------- */
export async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData || opts.body instanceof Blob;
  const res = await fetch(API + path, {
    method: opts.method || "GET",
    headers: { ...(isForm ? {} : { "content-type": "application/json" }), ...(state.token ? { authorization: "Bearer " + state.token } : {}), ...(opts.headers || {}) },
    body: opts.body === undefined ? undefined : isForm ? opts.body : JSON.stringify(opts.body),
  });
  let data = {}; try { data = await res.json(); } catch {}
  if (res.status === 401 && path !== "/login") { logout(); throw new Error("Session expired — sign in again"); }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
export function logout() { state.token = ""; localStorage.removeItem("vsn_studio_token"); state.leads = []; state.jobs = []; state.proposals = []; state.loaded = false; location.hash = "#/"; render(); }

export async function loadAll({ quiet = false, forceLeads = false } = {}) {
  if (state.loading) return; state.loading = true; state.error = ""; if (!quiet) render();
  try {
    const [ov, leads] = await Promise.all([api("/overview"), api("/leads" + (forceLeads ? "?force=1" : ""))]);
    const next = { leads: leads.items, jobs: ov.jobs, proposals: ov.proposals, settings: ov.settings };
    const changed = JSON.stringify(next) !== JSON.stringify({ leads: state.leads, jobs: state.jobs, proposals: state.proposals, settings: state.settings });
    Object.assign(state, next); state.loaded = true;
    state.syncNote = leads.sync?.synced ? (leads.sync.added ? `${leads.sync.added} new lead${leads.sync.added > 1 ? "s" : ""} pulled from the website` : "") : (leads.sync?.reason && leads.sync.reason !== "throttled" ? "Website sync unavailable: " + leads.sync.reason : "");
    if (leads.sync?.added && forceLeads) toast(state.syncNote);
    if (quiet && (!changed || (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)))) { state.loading = false; return; }
  } catch (e) { state.error = e.message; }
  state.loading = false; render();
}

/* collection helpers */
export const col = (name) => state[name];
export const find = (name, id) => state[name].find((x) => x.id === id);
export function upsert(name, item) { const arr = state[name]; const i = arr.findIndex((x) => x.id === item.id); if (i >= 0) arr[i] = item; else arr.unshift(item); }
export async function patch(name, id, body, msg) {
  try { const { item } = await api(`/${name}/${encodeURIComponent(id)}`, { method: "PATCH", body }); upsert(name, item); if (msg) toast(msg); render(); return item; }
  catch (e) { toast(e.message); }
}
export async function create(name, body, msg) {
  const { item } = await api(`/${name}`, { method: "POST", body }); upsert(name, item); if (msg) toast(msg); return item;
}
export async function remove(name, id, msg) {
  await api(`/${name}/${encodeURIComponent(id)}`, { method: "DELETE" }); state[name] = state[name].filter((x) => x.id !== id); if (msg) toast(msg);
}

/* ---------- routing ---------- */
const routes = [];
export function route(pattern, handler) { routes.push({ re: new RegExp("^" + pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$"), handler }); }
export function go(hash) { location.hash = hash; }
export function currentRoute() {
  const h = (location.hash.replace(/^#/, "") || "/").split("?")[0];
  for (const r of routes) { const m = h.match(r.re); if (m) return { handler: r.handler, params: Object.fromEntries(Object.entries(m.groups || {}).map(([k, v]) => [k, decodeURIComponent(v)])), path: h }; }
  return { handler: routes[0]?.handler, params: {}, path: h };
}
window.addEventListener("hashchange", () => { window.scrollTo(0, 0); render(); });

/* ---------- icons ---------- */
export const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  jobs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
  chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
};

/* ---------- layout ---------- */
export function counts() {
  const newLeads = state.leads.filter((l) => l.status === "new" && !state.seen.has(l.id)).length;
  const dueLeads = state.leads.filter((l) => l.next_follow_up && dueClass(l.next_follow_up) !== "upcoming" && !["won", "lost"].includes(l.status)).length;
  const dueTasks = state.jobs.filter((j) => j.status === "active").flatMap((j) => j.tasks || []).filter((t) => !t.done && t.due && dueClass(t.due) !== "upcoming").length;
  const propAlerts = state.proposals.filter((p) => p.status === "accepted" && !p.job_id).length;
  return { newLeads, dueLeads, dueTasks, propAlerts };
}
const NAV = [
  ["#/", "Overview", "home", () => 0],
  ["#/leads", "Leads", "inbox", (c) => c.newLeads],
  ["#/jobs", "Jobs", "jobs", (c) => c.dueTasks],
  ["#/proposals", "Proposals", "doc", (c) => c.propAlerts],
  ["#/settings", "Settings", "gear", () => 0],
];
const activeKey = (path) => (path.startsWith("/leads") || path.startsWith("/lead/") ? "#/leads" : path.startsWith("/job") ? "#/jobs" : path.startsWith("/proposal") ? "#/proposals" : path.startsWith("/settings") ? "#/settings" : "#/");
export function layout(path, content) {
  const c = counts(); const act = activeKey(path);
  const items = NAV.map(([href, label, icon, cnt]) => ({ href, label, icon, n: cnt(c), active: act === href }));
  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><img src="/studio/icon-192.png" alt="" /><div><div class="b1">Studio Visionary</div><div class="b2">Workspace</div></div></div>
        <nav class="nav">${items.map((i) => `<a href="${i.href}" class="${i.active ? "active" : ""}">${I[i.icon]}<span>${i.label}</span>${i.n ? `<span class="count">${i.n}</span>` : ""}</a>`).join("")}</nav>
        <div class="foot">Private workspace · only you<br/><button class="linkbtn" id="logoutSide">Sign out</button></div>
      </aside>
      <div class="main"><div class="page">${content}</div></div>
      <nav class="tabbar">${items.map((i) => `<a href="${i.href}" class="tab ${i.active ? "active" : ""}">${I[i.icon]}<span>${i.label}</span>${i.n ? `<span class="count">${i.n}</span>` : ""}</a>`).join("")}</nav>
    </div>`;
}

/* ---------- login ---------- */
function renderLogin($app) {
  $app.innerHTML = `
    <div class="login">
      <img src="/studio/icon-192.png" alt="" />
      <div class="eyebrow">Studio Visionary</div>
      <h1>Workspace</h1>
      <form id="loginForm">
        <input id="pass" type="password" inputmode="numeric" autocomplete="current-password" placeholder="••••••" autofocus />
        <div class="err" id="loginErr">${esc(state.error)}</div>
        <button class="btn block" type="submit">Unlock <span class="arrow">↗</span></button>
      </form>
      <p class="hint">Private. In Safari, tap Share → “Add to Home Screen” to install.</p>
    </div>`;
  document.getElementById("loginForm").onsubmit = async (e) => {
    e.preventDefault(); const btn = e.target.querySelector("button"); btn.disabled = true;
    try {
      const { token } = await api("/login", { method: "POST", body: { passcode: document.getElementById("pass").value } });
      state.token = token; localStorage.setItem("vsn_studio_token", token); state.error = ""; render(); loadAll();
    } catch (err) { document.getElementById("loginErr").textContent = err.message; btn.disabled = false; }
  };
}

/* ---------- render ---------- */
export function render() {
  const $app = document.getElementById("app");
  if (!state.token) return renderLogin($app);
  const r = currentRoute();
  const out = r.handler(r.params, r.path);
  if (typeof out === "string") { $app.innerHTML = layout(r.path, out); }
  else if (out && typeof out === "object") { $app.innerHTML = out.bare ? out.html : layout(r.path, out.html); out.mount?.($app); }
  const lo = document.getElementById("logoutSide"); if (lo) lo.onclick = logout;
}

export function boot() {
  render();
  if (state.token) loadAll();
  document.addEventListener("visibilitychange", () => { if (!document.hidden && state.token) loadAll({ quiet: true }); });
  setInterval(() => { if (!document.hidden && state.token) loadAll({ quiet: true }); }, 120e3);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/studio/sw.js", { scope: "/studio/" }).catch(() => {});
}
