/* VSN Leads CRM — front-end (vanilla JS, no build step) */
(() => {
  "use strict";
  const API = "/api/crm";
  const CALENDLY = "https://calendly.com/nextvisionarydesign/30min";
  const STATUS_LABEL = { new: "New", contacted: "Contacted", booked: "Consult booked", proposal: "Proposal sent", won: "Won", lost: "Lost" };
  const STATUS_ORDER = ["new", "contacted", "booked", "proposal", "won", "lost"];
  const STATUS_COLOR = { new: "var(--blue)", contacted: "var(--orange)", booked: "var(--purple)", proposal: "#d4a017", won: "var(--green)", lost: "var(--gray)" };

  const $app = document.getElementById("app");
  const $toast = document.getElementById("toast");
  const state = {
    token: localStorage.getItem("vsn_crm_token") || "",
    leads: [],
    loaded: false,
    loading: false,
    syncNote: "",
    filter: localStorage.getItem("vsn_crm_filter") || "open",
    query: "",
    seen: new Set(JSON.parse(localStorage.getItem("vsn_crm_seen") || "[]")),
    error: "",
  };

  /* ---------- helpers ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const h = (strings, ...vals) => strings.reduce((out, s, i) => out + s + (i < vals.length ? vals[i] : ""), "");
  const fmtWhen = (iso) => {
    const d = new Date(iso), now = new Date(), diff = (now - d) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };
  const fmtFull = (iso) => new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const dueClass = (date) => { if (!date) return ""; const t = todayStr(); return date < t ? "overdue" : date === t ? "today" : "upcoming"; };
  const dueLabel = (date) => {
    if (!date) return "";
    const c = dueClass(date);
    if (c === "today") return "Follow up today";
    const d = new Date(date + "T12:00:00");
    const lbl = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return c === "overdue" ? `Overdue · ${lbl}` : `Follow up ${lbl}`;
  };
  const telHref = (p) => "tel:" + String(p).replace(/[^\d+]/g, "");
  const smsHref = (p, name) => "sms:" + String(p).replace(/[^\d+]/g, "") + "&body=" + encodeURIComponent(`Hi ${name.split(" ")[0]}, this is Noah from Studio Visionary — thanks for reaching out about your project. Would you be open to a quick call? You can also grab a time here: ${CALENDLY}`);
  const mailHref = (e, name) => "mailto:" + encodeURIComponent(e) + "?subject=" + encodeURIComponent("Your project — Studio Visionary") + "&body=" + encodeURIComponent(`Hi ${name.split(" ")[0]},\n\nThanks for reaching out to Studio Visionary. I'd love to hear more about your project. You can book a free 30‑minute consult here: ${CALENDLY}\n\nBest,\nNoah\nStudio Visionary\nvsndesignstudio.com`);

  let toastTimer;
  function toast(msg) {
    $toast.textContent = msg; $toast.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => ($toast.hidden = true), 2200);
  }
  function persistSeen() { localStorage.setItem("vsn_crm_seen", JSON.stringify([...state.seen].slice(-2000))); }

  /* ---------- api ---------- */
  async function api(path, opts = {}) {
    const res = await fetch(API + path, {
      ...opts,
      headers: { "content-type": "application/json", ...(state.token ? { authorization: "Bearer " + state.token } : {}), ...(opts.headers || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (res.status === 401 && path !== "/login") { logout(); throw new Error("Session expired — sign in again"); }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }
  async function loadLeads({ force = false, quiet = false } = {}) {
    if (state.loading) return;
    state.loading = true; state.error = ""; if (!quiet) render();
    try {
      const data = await api("/leads" + (force ? "?force=1" : ""));
      const changed = JSON.stringify(data.leads) !== JSON.stringify(state.leads);
      state.leads = data.leads; state.loaded = true;
      if (quiet && !changed) { state.loading = false; return; }
      // don't yank the UI while the user is typing
      if (quiet && document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) { state.loading = false; return; }
      state.syncNote = data.sync?.synced ? (data.sync.added ? `${data.sync.added} new lead${data.sync.added > 1 ? "s" : ""} pulled from website` : "") : (data.sync?.reason && data.sync.reason !== "throttled" ? "Website sync unavailable: " + data.sync.reason : "");
      if (data.sync?.added && force) toast(state.syncNote);
    } catch (e) { state.error = e.message; }
    state.loading = false; render();
  }
  function logout() { state.token = ""; localStorage.removeItem("vsn_crm_token"); state.leads = []; state.loaded = false; location.hash = "#/"; render(); }
  function findLead(id) { return state.leads.find((l) => l.id === id); }
  function replaceLead(lead) { const i = state.leads.findIndex((l) => l.id === lead.id); if (i >= 0) state.leads[i] = lead; else state.leads.unshift(lead); }
  async function patchLead(id, body, msg) {
    try { const { lead } = await api("/leads/" + encodeURIComponent(id), { method: "PATCH", body }); replaceLead(lead); if (msg) toast(msg); render(); return lead; }
    catch (e) { toast(e.message); }
  }

  /* ---------- routing ---------- */
  function route() {
    const hsh = location.hash.replace(/^#/, "") || "/";
    const m = hsh.match(/^\/lead\/(.+)$/);
    if (m) return { view: "detail", id: decodeURIComponent(m[1]) };
    if (hsh === "/new") return { view: "new" };
    if (hsh === "/followups") return { view: "followups" };
    if (hsh === "/stats") return { view: "stats" };
    return { view: "leads" };
  }
  window.addEventListener("hashchange", () => { window.scrollTo(0, 0); render(); });

  /* ---------- icons ---------- */
  const I = {
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 4 3 5-7"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    refresh: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
    chev: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  };

  /* ---------- views ---------- */
  function renderLogin() {
    $app.innerHTML = h`
      <div class="login">
        <img src="/crm/icon-192.png" alt="" />
        <h1>VSN Leads</h1>
        <p>Enter your passcode to open the CRM.</p>
        <form id="loginForm">
          <input id="pass" type="password" inputmode="numeric" autocomplete="current-password" placeholder="••••••" autofocus />
          <div class="err" id="loginErr">${esc(state.error)}</div>
          <button class="btn block" type="submit">Unlock</button>
        </form>
        <p class="hint">Tip: in Safari tap Share → “Add to Home Screen” to install this as an app.</p>
      </div>`;
    document.getElementById("loginForm").onsubmit = async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector("button"); btn.disabled = true;
      try {
        const { token } = await api("/login", { method: "POST", body: { passcode: document.getElementById("pass").value } });
        state.token = token; localStorage.setItem("vsn_crm_token", token); state.error = "";
        render(); loadLeads();
      } catch (err) { document.getElementById("loginErr").textContent = err.message; btn.disabled = false; }
    };
  }

  function tabbar(active) {
    const newCount = state.leads.filter((l) => l.status === "new" && !state.seen.has(l.id)).length;
    const dueCount = state.leads.filter((l) => l.next_follow_up && dueClass(l.next_follow_up) !== "upcoming" && !["won", "lost"].includes(l.status)).length;
    return h`
      <nav class="tabbar">
        <a class="tab ${active === "leads" ? "active" : ""}" href="#/">${I.inbox}<span>Leads</span>${newCount ? `<span class="dot">${newCount}</span>` : ""}</a>
        <a class="tab ${active === "followups" ? "active" : ""}" href="#/followups">${I.bell}<span>Follow-ups</span>${dueCount ? `<span class="dot">${dueCount}</span>` : ""}</a>
        <a class="tab ${active === "stats" ? "active" : ""}" href="#/stats">${I.chart}<span>Pipeline</span></a>
      </nav>`;
  }

  function leadCard(l) {
    const meta = [l.project_type, l.budget, l.timeline].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("");
    const contact = [l.phone, l.email].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("");
    const unread = l.status === "new" && !state.seen.has(l.id);
    return h`
      <a class="card ${unread ? "unread" : ""}" href="#/lead/${encodeURIComponent(l.id)}">
        <div class="row1"><div class="name">${esc(l.name)}</div><div class="when">${fmtWhen(l.created_at)}</div></div>
        ${meta ? `<div class="meta">${meta}</div>` : contact ? `<div class="meta">${contact}</div>` : ""}
        ${l.description ? `<div class="desc">${esc(l.description)}</div>` : ""}
        <div class="row3">
          <span class="badge s-${l.status}">${STATUS_LABEL[l.status]}</span>
          <span class="due ${dueClass(l.next_follow_up)}">${dueLabel(l.next_follow_up)}</span>
        </div>
      </a>`;
  }

  function filteredLeads() {
    const q = state.query.trim().toLowerCase();
    return state.leads.filter((l) => {
      if (state.filter === "open" && ["won", "lost"].includes(l.status)) return false;
      if (STATUS_ORDER.includes(state.filter) && l.status !== state.filter) return false;
      if (!q) return true;
      return [l.name, l.email, l.phone, l.project_type, l.budget, l.timeline, l.description, ...(l.notes || []).map((n) => n.text)].join(" ").toLowerCase().includes(q);
    });
  }

  function renderLeads() {
    const counts = { all: state.leads.length, open: 0 };
    STATUS_ORDER.forEach((s) => (counts[s] = 0));
    state.leads.forEach((l) => { counts[l.status]++; if (!["won", "lost"].includes(l.status)) counts.open++; });
    const chips = [["open", "Open"], ["all", "All"], ...STATUS_ORDER.map((s) => [s, STATUS_LABEL[s]])];
    const list = filteredLeads();
    $app.innerHTML = h`
      <div class="screen">
        <header class="topbar">
          <div class="topbar-row">
            <div><h1>Leads</h1><div class="sub">${state.loaded ? `${counts.open} open · ${counts.all} total` : "Loading…"}</div></div>
            <div style="display:flex;gap:8px">
              <button class="iconbtn ${state.loading ? "spin" : ""}" id="refresh" aria-label="Sync">${I.refresh}</button>
              <a class="iconbtn primary" href="#/new" aria-label="Add lead">+</a>
            </div>
          </div>
          <div class="search"><input id="q" type="search" placeholder="Search name, email, phone, notes" value="${esc(state.query)}" /></div>
          <div class="chips">${chips.map(([k, lbl]) => `<button class="chip ${state.filter === k ? "active" : ""}" data-f="${k}">${lbl}<span class="n">${counts[k]}</span></button>`).join("")}</div>
        </header>
        <main class="content">
          ${state.error ? `<div class="banner">${esc(state.error)}</div>` : ""}
          ${state.syncNote ? `<div class="banner">${esc(state.syncNote)}</div>` : ""}
          <div class="list">
            ${state.loaded && !list.length ? `<div class="empty"><strong>No leads here</strong>${state.query ? "Try a different search." : state.leads.length ? "Change the filter above." : "New website leads will appear here automatically."}</div>` : list.map(leadCard).join("")}
          </div>
        </main>
        ${tabbar("leads")}
      </div>`;
    document.getElementById("refresh").onclick = () => loadLeads({ force: true });
    const $q = document.getElementById("q");
    $q.oninput = () => { state.query = $q.value; const l = filteredLeads(); document.querySelector(".list").innerHTML = l.length ? l.map(leadCard).join("") : `<div class="empty"><strong>No matches</strong></div>`; };
    document.querySelectorAll(".chip").forEach((c) => (c.onclick = () => { state.filter = c.dataset.f; localStorage.setItem("vsn_crm_filter", state.filter); render(); }));
  }

  function renderFollowups() {
    const active = state.leads.filter((l) => !["won", "lost"].includes(l.status));
    const withDate = active.filter((l) => l.next_follow_up).sort((a, b) => a.next_follow_up.localeCompare(b.next_follow_up));
    const overdue = withDate.filter((l) => dueClass(l.next_follow_up) === "overdue");
    const today = withDate.filter((l) => dueClass(l.next_follow_up) === "today");
    const upcoming = withDate.filter((l) => dueClass(l.next_follow_up) === "upcoming");
    const untouched = active.filter((l) => l.status === "new" && !l.next_follow_up && Date.now() - new Date(l.created_at) > 3600e3 * 24);
    const sec = (title, arr) => (arr.length ? `<div class="section-title">${title} · ${arr.length}</div><div class="list">${arr.map(leadCard).join("")}</div>` : "");
    $app.innerHTML = h`
      <div class="screen">
        <header class="topbar"><div class="topbar-row"><div><h1>Follow-ups</h1><div class="sub">${overdue.length + today.length} due now</div></div></div></header>
        <main class="content">
          ${!withDate.length && !untouched.length ? `<div class="empty"><strong>Nothing due</strong>Set a follow-up date on any lead and it will show up here.</div>` : ""}
          ${sec("Overdue", overdue)}${sec("Today", today)}${sec("New leads not yet contacted (24h+)", untouched)}${sec("Upcoming", upcoming)}
        </main>
        ${tabbar("followups")}
      </div>`;
  }

  function renderStats() {
    const total = state.leads.length;
    const by = Object.fromEntries(STATUS_ORDER.map((s) => [s, state.leads.filter((l) => l.status === s).length]));
    const week = state.leads.filter((l) => Date.now() - new Date(l.created_at) < 7 * 86400e3).length;
    const month = state.leads.filter((l) => Date.now() - new Date(l.created_at) < 30 * 86400e3).length;
    const closed = by.won + by.lost;
    const winRate = closed ? Math.round((by.won / closed) * 100) : null;
    const contactRate = total ? Math.round(((total - by.new) / total) * 100) : 0;
    const bar = STATUS_ORDER.filter((s) => by[s]).map((s) => `<span style="width:${(by[s] / total) * 100}%;background:${STATUS_COLOR[s]}"></span>`).join("");
    $app.innerHTML = h`
      <div class="screen">
        <header class="topbar"><div class="topbar-row"><div><h1>Pipeline</h1><div class="sub">${total} leads total</div></div><button class="iconbtn" id="logout" aria-label="Sign out" style="font-size:12px;width:auto;padding:0 12px;border-radius:20px">Sign out</button></div></header>
        <main class="content">
          <div class="tiles">
            <div class="tile"><div class="big">${week}</div><div class="lbl">Leads · 7 days</div></div>
            <div class="tile"><div class="big">${month}</div><div class="lbl">Leads · 30 days</div></div>
            <div class="tile"><div class="big">${by.new}</div><div class="lbl">Awaiting first contact</div></div>
            <div class="tile"><div class="big">${by.booked}</div><div class="lbl">Consults booked</div></div>
            <div class="tile"><div class="big">${contactRate}%</div><div class="lbl">Contacted</div></div>
            <div class="tile"><div class="big">${winRate === null ? "—" : winRate + "%"}</div><div class="lbl">Win rate (closed)</div></div>
          </div>
          <div class="group" style="padding:14px">
            <div class="lbl" style="color:var(--muted);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">By stage</div>
            <div class="bar">${bar}</div>
            <div class="legend">${STATUS_ORDER.map((s) => `<div><i style="background:${STATUS_COLOR[s]}"></i>${STATUS_LABEL[s]} <b>${by[s]}</b></div>`).join("")}</div>
          </div>
          <div class="group">
            <div class="g-title">Sources</div>
            ${Object.entries(state.leads.reduce((a, l) => ((a[l.source] = (a[l.source] || 0) + 1), a), {})).map(([k, v]) => `<div class="kv"><span class="k">${esc(k === "lead" ? "Website – Start a project" : k === "contact" ? "Website – Contact form" : k === "manual" ? "Added manually" : k)}</span><span class="v">${v}</span></div>`).join("") || `<div class="kv"><span class="k">No leads yet</span></div>`}
          </div>
          <p class="hint">Leads sync from vsndesignstudio.com (Netlify Forms) every time you open the app or tap refresh.</p>
        </main>
        ${tabbar("stats")}
      </div>`;
    document.getElementById("logout").onclick = logout;
  }

  function renderDetail(id) {
    const l = findLead(id);
    if (!l) { $app.innerHTML = h`<div class="screen"><header class="topbar"><a class="back" href="#/">${I.chev}Leads</a></header><main class="content"><div class="empty"><strong>${state.loaded ? "Lead not found" : "Loading…"}</strong></div></main></div>`; return; }
    if (!state.seen.has(l.id)) { state.seen.add(l.id); persistSeen(); }
    const act = (href, icon, label, ok) => `<a class="action" href="${ok ? href : "#"}" aria-disabled="${!ok}" ${ok && !href.startsWith("#") ? "" : ""} data-act="${label}">${icon}<span>${label}</span></a>`;
    const first = (l.name || "").split(" ")[0];
    $app.innerHTML = h`
      <div class="screen detail">
        <header class="topbar">
          <a class="back" href="#/">${I.chev}Leads</a>
          <h2>${esc(l.name)}</h2>
          <div class="since">Came in ${fmtFull(l.created_at)} · ${esc(l.source === "lead" ? "Start-a-project form" : l.source === "contact" ? "Contact form" : "added manually")}</div>
        </header>
        <main class="content">
          <div class="actions">
            ${act(telHref(l.phone), I.phone, "Call", !!l.phone)}
            ${act(smsHref(l.phone, l.name), I.msg, "Text", !!l.phone)}
            ${act(mailHref(l.email, l.name), I.mail, "Email", !!l.email)}
            <button class="action" id="copyCal">${I.cal}<span>Booking link</span></button>
          </div>

          <div class="group">
            <div class="g-title">Stage</div>
            <div class="statuses">${STATUS_ORDER.map((s) => `<button class="stbtn s-${s} ${l.status === s ? "active" : ""}" data-s="${s}">${STATUS_LABEL[s]}</button>`).join("")}</div>
            <div class="kv"><span class="k">Follow-up</span><span class="v" style="display:flex;gap:6px;align-items:center"><input type="date" id="fu" value="${esc(l.next_follow_up || "")}" />${l.next_follow_up ? `<button class="btn sm ghost" id="fuClear">Clear</button>` : ""}</span></div>
            <div class="kv"><span class="k">Quick set</span><span class="v" style="display:flex;gap:6px"><button class="btn sm ghost" data-fu="1">Tomorrow</button><button class="btn sm ghost" data-fu="3">3 days</button><button class="btn sm ghost" data-fu="7">1 week</button></span></div>
          </div>

          <div class="group">
            <div class="g-title">Contact</div>
            <div class="kv"><span class="k">Phone</span><span class="v">${l.phone ? `<a href="${telHref(l.phone)}">${esc(l.phone)}</a>` : "—"}</span></div>
            <div class="kv"><span class="k">Email</span><span class="v">${l.email ? `<a href="mailto:${esc(l.email)}">${esc(l.email)}</a>` : "—"}</span></div>
          </div>

          <div class="group">
            <div class="g-title">Project</div>
            <div class="kv"><span class="k">Type</span><span class="v">${esc(l.project_type) || "—"}</span></div>
            <div class="kv"><span class="k">Budget</span><span class="v">${esc(l.budget) || "—"}</span></div>
            <div class="kv"><span class="k">Timeline</span><span class="v">${esc(l.timeline) || "—"}</span></div>
            ${l.description ? `<div class="kv" style="border-bottom:0;padding-bottom:0"><span class="k">Details</span></div><div class="desc-full">${esc(l.description)}</div>` : ""}
          </div>

          <div class="group">
            <div class="g-title">Notes · ${(l.notes || []).length}</div>
            ${(l.notes || []).slice().reverse().map((n) => `<div class="note"><div class="t">${esc(n.text)}</div><div class="m"><span>${fmtFull(n.at)}</span><button data-del-note="${n.id}">Delete</button></div></div>`).join("")}
            <div class="notebox"><textarea id="noteText" placeholder="Add a note (call summary, next step…)"></textarea><button class="btn" id="addNote">Add</button></div>
          </div>

          <button class="btn ghost block" id="editBtn">Edit contact / project details</button>
          <div class="danger-zone"><button class="btn danger block" id="delBtn">Delete lead</button></div>
        </main>
      </div>`;

    document.querySelectorAll(".stbtn").forEach((b) => (b.onclick = () => { if (b.dataset.s !== l.status) patchLead(l.id, { status: b.dataset.s }, `Marked ${STATUS_LABEL[b.dataset.s]}`); }));
    const $fu = document.getElementById("fu");
    $fu.onchange = () => patchLead(l.id, { next_follow_up: $fu.value || null }, $fu.value ? "Follow-up set" : "Follow-up cleared");
    const $fuClear = document.getElementById("fuClear"); if ($fuClear) $fuClear.onclick = () => patchLead(l.id, { next_follow_up: null }, "Follow-up cleared");
    document.querySelectorAll("[data-fu]").forEach((b) => (b.onclick = () => { const d = new Date(); d.setDate(d.getDate() + Number(b.dataset.fu)); const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; patchLead(l.id, { next_follow_up: v, ...(l.status === "new" ? {} : {}) }, "Follow-up set"); }));
    document.getElementById("copyCal").onclick = async () => {
      const url = `${CALENDLY}?name=${encodeURIComponent(l.name)}&email=${encodeURIComponent(l.email || "")}`;
      if (navigator.share) { try { await navigator.share({ title: "Book a consult with Studio Visionary", text: `Hi ${first}, grab a time here:`, url }); return; } catch {} }
      try { await navigator.clipboard.writeText(url); toast("Booking link copied"); } catch { prompt("Booking link", url); }
    };
    document.getElementById("addNote").onclick = async () => {
      const t = document.getElementById("noteText").value.trim(); if (!t) return;
      await patchLead(l.id, { note: t, ...(l.status === "new" ? { status: "contacted" } : {}) }, l.status === "new" ? "Note added · marked Contacted" : "Note added");
    };
    document.querySelectorAll("[data-del-note]").forEach((b) => (b.onclick = () => patchLead(l.id, { delete_note_id: b.dataset.delNote }, "Note deleted")));
    document.getElementById("editBtn").onclick = () => renderEdit(l);
    const $del = document.getElementById("delBtn");
    $del.onclick = async () => {
      if ($del.dataset.armed !== "1") { $del.dataset.armed = "1"; $del.textContent = "Tap again to permanently delete"; setTimeout(() => { $del.dataset.armed = "0"; $del.textContent = "Delete lead"; }, 3000); return; }
      try { await api("/leads/" + encodeURIComponent(l.id), { method: "DELETE" }); state.leads = state.leads.filter((x) => x.id !== l.id); toast("Lead deleted"); location.hash = "#/"; } catch (e) { toast(e.message); }
    };
    // Auto-mark contacted when tapping call/text/email on a New lead
    document.querySelectorAll(".action[data-act]").forEach((a) => (a.onclick = () => { if (a.getAttribute("aria-disabled") === "true") return; if (l.status === "new") setTimeout(() => patchLead(l.id, { status: "contacted" }), 800); }));
  }

  function leadForm(l = {}) {
    return h`
      <div class="form">
        <label>Name</label><input id="f_name" value="${esc(l.name || "")}" autocomplete="off" />
        <label>Phone</label><input id="f_phone" type="tel" value="${esc(l.phone || "")}" />
        <label>Email</label><input id="f_email" type="email" value="${esc(l.email || "")}" autocapitalize="off" />
        <label>Project type</label><input id="f_type" value="${esc(l.project_type || "")}" placeholder="New build, renovation, addition…" />
        <label>Budget</label><input id="f_budget" value="${esc(l.budget || "")}" />
        <label>Timeline</label><input id="f_timeline" value="${esc(l.timeline || "")}" />
        <label>Details</label><textarea id="f_desc">${esc(l.description || "")}</textarea>
      </div>`;
  }
  const readForm = () => ({
    name: document.getElementById("f_name").value, phone: document.getElementById("f_phone").value, email: document.getElementById("f_email").value,
    project_type: document.getElementById("f_type").value, budget: document.getElementById("f_budget").value, timeline: document.getElementById("f_timeline").value, description: document.getElementById("f_desc").value,
  });

  function renderNew() {
    $app.innerHTML = h`
      <div class="screen detail">
        <header class="topbar"><a class="back" href="#/">${I.chev}Cancel</a><h2>New lead</h2></header>
        <main class="content">
          ${leadForm()}
          <div class="form"><label>First note (optional)</label><textarea id="f_note" placeholder="Where did this lead come from?"></textarea></div>
          <div style="margin-top:16px"><button class="btn block" id="save">Save lead</button></div>
        </main>
      </div>`;
    document.getElementById("save").onclick = async () => {
      const b = { ...readForm(), note: document.getElementById("f_note").value };
      if (!b.name.trim() && !b.email.trim() && !b.phone.trim()) return toast("Add a name, phone or email");
      const btn = document.getElementById("save"); btn.disabled = true;
      try { const { lead } = await api("/leads", { method: "POST", body: b }); replaceLead(lead); toast("Lead added"); location.hash = "#/lead/" + encodeURIComponent(lead.id); }
      catch (e) { toast(e.message); btn.disabled = false; }
    };
  }

  function renderEdit(l) {
    $app.innerHTML = h`
      <div class="screen detail">
        <header class="topbar"><a class="back" href="#/lead/${encodeURIComponent(l.id)}">${I.chev}Back</a><h2>Edit lead</h2></header>
        <main class="content">${leadForm(l)}<div style="margin-top:16px"><button class="btn block" id="save">Save changes</button></div></main>
      </div>`;
    document.getElementById("save").onclick = async () => {
      const btn = document.getElementById("save"); btn.disabled = true;
      const lead = await patchLead(l.id, readForm(), "Saved");
      if (lead) location.hash = "#/lead/" + encodeURIComponent(l.id); else btn.disabled = false;
    };
  }

  function render() {
    if (!state.token) return renderLogin();
    const r = route();
    if (r.view === "detail") return renderDetail(r.id);
    if (r.view === "new") return renderNew();
    if (r.view === "followups") return renderFollowups();
    if (r.view === "stats") return renderStats();
    return renderLeads();
  }

  /* ---------- boot ---------- */
  render();
  if (state.token) loadLeads();
  document.addEventListener("visibilitychange", () => { if (!document.hidden && state.token) loadLeads({ quiet: true }); });
  setInterval(() => { if (!document.hidden && state.token) loadLeads({ quiet: true }); }, 120e3);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/crm/sw.js", { scope: "/crm/" }).catch(() => {});
})();
