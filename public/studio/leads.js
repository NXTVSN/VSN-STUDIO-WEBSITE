import { state, route, esc, pill, fmtWhen, fmtFull, dueClass, todayStr, addDays, telHref, smsHref, mailHref, toast, patch, create, remove, find, upsert, loadAll, api, saveUI, persistSeen, confirmDanger, go, I, LEAD_STATUS, LEAD_ORDER, render } from "./core.js";

const dueLabel = (date) => { if (!date) return ""; const c = dueClass(date); if (c === "today") return "Follow up today"; const lbl = new Date(date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); return c === "overdue" ? `Overdue · ${lbl}` : `Follow up ${lbl}`; };
const srcLabel = (s) => (s === "lead" ? "Start-a-project form" : s === "contact" ? "Contact form" : s === "manual" ? "Added manually" : s === "calendly" ? "Calendly booking" : s);
const consultLabel = (b) => {
  if (!b) return "";
  if (b.event_status === "canceled") return "Consult canceled";
  if (!b.start_time) return "Consult booked";
  const d = new Date(b.start_time);
  return `Consult · ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
};
const consultClass = (b) => (!b ? "" : b.event_status === "canceled" ? "c-lost" : new Date(b.start_time || 0) < new Date() ? "" : "c-booked");
function bookingPanel(l) {
  const b = l.booking; if (!b) return "";
  const link = (href, label) => (href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${label} ↗</a>` : "—");
  return `<div class="group">
    <div class="g-title"><span class="eyebrow">Consultation</span>${pill(b.event_status === "canceled" ? "lost" : "booked", b.event_status === "canceled" ? "Canceled" : "Booked")}</div>
    <div class="kv"><span class="k">When</span><span class="v">${b.start_time ? esc(fmtFull(b.start_time)) : `<span style="opacity:.6">Time pending${b.enrich_error ? " · " + esc(b.enrich_error) : state.settings.calendly_connected ? "" : " · add CALENDLY_TOKEN to pull details"}</span>`}</span></div>
    ${b.event_name ? `<div class="kv"><span class="k">Event</span><span class="v">${esc(b.event_name)}</span></div>` : ""}
    <div class="kv"><span class="k">Booked</span><span class="v">${esc(fmtFull(b.booked_at))}${b.source === "calendly" ? " · direct" : " · via site"}</span></div>
    ${b.join_url ? `<div class="kv"><span class="k">Join</span><span class="v">${link(b.join_url, "Google Meet")}</span></div>` : b.location ? `<div class="kv"><span class="k">Where</span><span class="v">${esc(b.location)}</span></div>` : ""}
    <div class="kv"><span class="k">Manage</span><span class="v" style="display:flex;gap:12px;justify-content:flex-end">${link(b.reschedule_url, "Reschedule")}${link(b.cancel_url, "Cancel")}${b.event_uri && !b.reschedule_url ? link("https://calendly.com/app/scheduled_events/user/me", "Open in Calendly") : ""}</span></div>
    ${(b.answers || []).filter((x) => x.a).map((x) => `<div class="kv" style="padding-bottom:2px"><span class="k">${esc(x.q)}</span></div><div class="body-text">${esc(x.a)}</div>`).join("")}
  </div>`;
}

export function leadCard(l) {
  const meta = [l.project_type, l.budget, l.timeline].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("");
  const contact = [l.phone, l.email].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("");
  const unread = l.status === "new" && !state.seen.has(l.id);
  const dc = dueClass(l.next_follow_up);
  return `
    <a class="card link ${unread ? "unread" : ""}" href="#/lead/${encodeURIComponent(l.id)}">
      <div class="top"><div class="name">${esc(l.name)}</div><div class="when">${fmtWhen(l.created_at)}</div></div>
      ${meta ? `<div class="meta">${meta}</div>` : contact ? `<div class="meta">${contact}</div>` : ""}
      ${l.description ? `<div class="desc">${esc(l.description)}</div>` : ""}
      <div class="foot">${pill(l.status, LEAD_STATUS[l.status])}${l.booking ? `<span class="pill ${consultClass(l.booking)}">${esc(consultLabel(l.booking))}</span>` : ""}${l.next_follow_up ? `<span class="pill ${dc === "overdue" ? "c-overdue" : dc === "today" ? "c-contacted" : ""}">${dueLabel(l.next_follow_up)}</span>` : ""}</div>
    </a>`;
}

function filtered(filter, q) {
  q = (q || "").trim().toLowerCase();
  return state.leads.filter((l) => {
    if (filter === "open" && ["won", "lost"].includes(l.status)) return false;
    if (LEAD_ORDER.includes(filter) && l.status !== filter) return false;
    if (filter === "due" && !(l.next_follow_up && dueClass(l.next_follow_up) !== "upcoming" && !["won", "lost"].includes(l.status))) return false;
    if (!q) return true;
    return [l.name, l.email, l.phone, l.project_type, l.budget, l.timeline, l.description, l.booking ? "consult booked" : "", ...(l.notes || []).map((n) => n.text)].join(" ").toLowerCase().includes(q);
  });
}

route("/leads", () => {
  const filter = state.ui.leadFilter || "open"; const q = state.ui.leadQuery || "";
  const counts = { all: state.leads.length, open: 0, due: 0 }; LEAD_ORDER.forEach((s) => (counts[s] = 0));
  state.leads.forEach((l) => { counts[l.status]++; if (!["won", "lost"].includes(l.status)) { counts.open++; if (l.next_follow_up && dueClass(l.next_follow_up) !== "upcoming") counts.due++; } });
  const chips = [["open", "Open"], ["due", "Due"], ["all", "All"], ...LEAD_ORDER.map((s) => [s, LEAD_STATUS[s]])];
  const list = filtered(filter, q);
  const html = `
    <div class="pagehead">
      <div><div class="eyebrow dash">Pipeline</div><h1 class="display">Leads</h1><div class="subtle" style="margin-top:6px">${state.loaded ? `${counts.open} open · ${counts.all} total` : "Loading…"}</div></div>
      <div class="actions"><button class="iconbtn ${state.loading ? "spin" : ""}" id="refresh" aria-label="Sync">${I.refresh}</button><a class="btn" href="#/lead/new">New lead <span class="arrow">+</span></a></div>
    </div>
    <div class="toolbar"><div class="search"><input id="q" type="search" placeholder="Search name, email, phone, notes" value="${esc(q)}" /></div></div>
    <div class="chips">${chips.map(([k, lbl]) => `<button class="chip ${filter === k ? "active" : ""}" data-f="${k}">${lbl}<span class="n">${counts[k]}</span></button>`).join("")}</div>
    ${state.error ? `<div class="banner red">${esc(state.error)}</div>` : ""}${state.syncNote ? `<div class="banner">${esc(state.syncNote)}</div>` : ""}
    <div class="grid cards" id="leadList">${state.loaded && !list.length ? `<div class="empty" style="grid-column:1/-1"><strong>No leads here</strong>${q ? "Try a different search." : state.leads.length ? "Change the filter above." : "New website leads appear here automatically."}</div>` : list.map(leadCard).join("")}</div>`;
  return { html, mount() {
    document.getElementById("refresh").onclick = () => loadAll({ forceLeads: true });
    const $q = document.getElementById("q");
    $q.oninput = () => { state.ui.leadQuery = $q.value; saveUI(); const l = filtered(state.ui.leadFilter || "open", $q.value); document.getElementById("leadList").innerHTML = l.length ? l.map(leadCard).join("") : `<div class="empty" style="grid-column:1/-1"><strong>No matches</strong></div>`; };
    document.querySelectorAll(".chip").forEach((c) => (c.onclick = () => { state.ui.leadFilter = c.dataset.f; saveUI(); render(); }));
  } };
});

function leadForm(l = {}) {
  return `
    <div class="form">
      <label>Name</label><input id="f_name" value="${esc(l.name || "")}" autocomplete="off" />
      <div class="row"><div><label>Phone</label><input id="f_phone" type="tel" value="${esc(l.phone || "")}" /></div><div><label>Email</label><input id="f_email" type="email" value="${esc(l.email || "")}" autocapitalize="off" /></div></div>
      <label>Project type</label><input id="f_type" value="${esc(l.project_type || "")}" placeholder="New build, renovation, addition…" />
      <div class="row"><div><label>Budget</label><input id="f_budget" value="${esc(l.budget || "")}" /></div><div><label>Timeline</label><input id="f_timeline" value="${esc(l.timeline || "")}" /></div></div>
      <label>Details</label><textarea id="f_desc">${esc(l.description || "")}</textarea>
    </div>`;
}
const readForm = () => ({ name: f_name.value, phone: f_phone.value, email: f_email.value, project_type: f_type.value, budget: f_budget.value, timeline: f_timeline.value, description: f_desc.value });

route("/lead/new", () => ({ html: `
    <a class="back" href="#/leads">${I.chev} Leads</a>
    <div class="eyebrow dash">Leads</div><h2 class="title">New lead</h2>
    <div style="max-width:640px;margin-top:16px">${leadForm()}<div class="form"><label>First note (optional)</label><textarea id="f_note" placeholder="Where did this lead come from?"></textarea></div>
    <div class="formbar"><button class="btn" id="save">Save lead</button><a class="btn ghost" href="#/leads">Cancel</a></div></div>`,
  mount() {
    document.getElementById("save").onclick = async () => {
      const b = { ...readForm(), note: f_note.value };
      if (!b.name.trim() && !b.email.trim() && !b.phone.trim()) return toast("Add a name, phone or email");
      save.disabled = true;
      try { const lead = await create("leads", b, "Lead added"); go("#/lead/" + encodeURIComponent(lead.id)); } catch (e) { toast(e.message); save.disabled = false; }
    };
  } }));

route("/lead/:id/edit", ({ id }) => {
  const l = find("leads", id); if (!l) return `<div class="empty">Loading…</div>`;
  return { html: `<a class="back" href="#/lead/${encodeURIComponent(id)}">${I.chev} Back</a><div class="eyebrow dash">Leads</div><h2 class="title">Edit lead</h2><div style="max-width:640px;margin-top:16px">${leadForm(l)}<div class="formbar"><button class="btn" id="save">Save changes</button><a class="btn ghost" href="#/lead/${encodeURIComponent(id)}">Cancel</a></div></div>`,
    mount() { document.getElementById("save").onclick = async () => { save.disabled = true; const r = await patch("leads", id, readForm(), "Saved"); if (r) go("#/lead/" + encodeURIComponent(id)); else save.disabled = false; }; } };
});

route("/lead/:id", ({ id }) => {
  const l = find("leads", id);
  if (!l) return `<a class="back" href="#/leads">${I.chev} Leads</a><div class="empty"><strong>${state.loaded ? "Lead not found" : "Loading…"}</strong></div>`;
  if (!state.seen.has(l.id)) { state.seen.add(l.id); persistSeen(); }
  const job = l.job_id && find("jobs", l.job_id);
  const props = state.proposals.filter((p) => p.lead_id === l.id);
  const act = (href, icon, label, ok) => `<a class="action" href="${ok ? href : "#"}" aria-disabled="${!ok}" data-act="1">${I[icon]}<span>${label}</span></a>`;
  const html = `
    <a class="back" href="#/leads">${I.chev} Leads</a>
    <div class="detail-head">
      <div><div class="eyebrow dash">${esc(srcLabel(l.source))} · ${fmtFull(l.created_at)}</div><h1 class="display">${esc(l.name)}</h1></div>
      <div class="actions"><a class="btn ghost sm" href="#/lead/${encodeURIComponent(id)}/edit">Edit</a>${job ? `<a class="btn navy sm" href="#/job/${encodeURIComponent(job.id)}">Open job ↗</a>` : `<button class="btn sm" id="toJob">Convert to job ↗</button>`}<button class="btn ghost sm" id="newProp">New proposal</button></div>
    </div>
    <div class="detail-grid">
      <div class="col">
        <div class="actions4">${act(telHref(l.phone), "phone", "Call", !!l.phone)}${act(smsHref(l.phone, l.name), "msg", "Text", !!l.phone)}${act(mailHref(l.email, l.name), "mail", "Email", !!l.email)}<button class="action" id="copyCal">${I.cal}<span>Booking</span></button></div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Stage</span></div>
          <div class="segs">${LEAD_ORDER.map((s) => `<button class="seg ${l.status === s ? "active" : ""}" data-s="${s}">${LEAD_STATUS[s]}</button>`).join("")}</div>
          <div class="kv"><span class="k">Follow-up</span><span class="v" style="display:flex;gap:6px;align-items:center;justify-content:flex-end"><input type="date" id="fu" value="${esc(l.next_follow_up || "")}" />${l.next_follow_up ? `<button class="btn ghost sm" id="fuClear">Clear</button>` : ""}</span></div>
          <div class="kv"><span class="k">Quick set</span><span class="v" style="display:flex;gap:6px"><button class="btn ghost sm" data-fu="1">Tomorrow</button><button class="btn ghost sm" data-fu="3">3 days</button><button class="btn ghost sm" data-fu="7">1 week</button></span></div>
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Notes · ${(l.notes || []).length}</span></div>
          ${(l.notes || []).slice().reverse().map((n) => `<div class="note"><div class="t">${esc(n.text)}</div><div class="m"><span>${fmtFull(n.at)}</span><button class="linkbtn red" data-del-note="${n.id}">Delete</button></div></div>`).join("")}
          <div class="inputrow"><textarea id="noteText" placeholder="Add a note (call summary, next step…)"></textarea><button class="btn sm" id="addNote">Add</button></div>
        </div>
      </div>
      <div class="col">
        ${bookingPanel(l)}
        <div class="group">
          <div class="g-title"><span class="eyebrow">Contact</span></div>
          <div class="kv"><span class="k">Phone</span><span class="v">${l.phone ? `<a href="${telHref(l.phone)}">${esc(l.phone)}</a>` : "—"}</span></div>
          <div class="kv"><span class="k">Email</span><span class="v">${l.email ? `<a href="mailto:${esc(l.email)}">${esc(l.email)}</a>` : "—"}</span></div>
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Project</span></div>
          <div class="kv"><span class="k">Type</span><span class="v">${esc(l.project_type) || "—"}</span></div>
          <div class="kv"><span class="k">Budget</span><span class="v">${esc(l.budget) || "—"}</span></div>
          <div class="kv"><span class="k">Timeline</span><span class="v">${esc(l.timeline) || "—"}</span></div>
          ${l.description ? `<div class="kv" style="padding-bottom:2px"><span class="k">Details</span></div><div class="body-text">${esc(l.description)}</div>` : ""}
        </div>
        ${props.length ? `<div class="group"><div class="g-title"><span class="eyebrow">Proposals</span></div>${props.map((p) => `<a class="kv" href="#/proposal/${encodeURIComponent(p.id)}"><span class="k">${esc(p.number)}</span><span class="v">${pill(p.status, p.status)}</span></a>`).join("")}</div>` : ""}
        <button class="btn danger block" id="delBtn">Delete lead</button>
      </div>
    </div>`;
  return { html, mount() {
    document.querySelectorAll(".seg").forEach((b) => (b.onclick = () => { if (b.dataset.s !== l.status) patch("leads", id, { status: b.dataset.s }, `Marked ${LEAD_STATUS[b.dataset.s]}`); }));
    fu.onchange = () => patch("leads", id, { next_follow_up: fu.value || null }, fu.value ? "Follow-up set" : "Follow-up cleared");
    const fc = document.getElementById("fuClear"); if (fc) fc.onclick = () => patch("leads", id, { next_follow_up: null }, "Follow-up cleared");
    document.querySelectorAll("[data-fu]").forEach((b) => (b.onclick = () => patch("leads", id, { next_follow_up: addDays(Number(b.dataset.fu)) }, "Follow-up set")));
    document.getElementById("copyCal").onclick = async () => {
      const url = `${state.settings.calendly}?name=${encodeURIComponent(l.name)}&email=${encodeURIComponent(l.email || "")}`;
      if (navigator.share) { try { await navigator.share({ title: "Book a consult", url }); return; } catch {} }
      try { await navigator.clipboard.writeText(url); toast("Booking link copied"); } catch { prompt("Booking link", url); }
    };
    addNote.onclick = async () => { const t = noteText.value.trim(); if (!t) return; await patch("leads", id, { note: t, ...(l.status === "new" ? { status: "contacted" } : {}) }, l.status === "new" ? "Note added · marked Contacted" : "Note added"); };
    document.querySelectorAll("[data-del-note]").forEach((b) => (b.onclick = () => patch("leads", id, { delete_note_id: b.dataset.delNote }, "Note deleted")));
    document.querySelectorAll(".action[data-act]").forEach((a) => (a.onclick = () => { if (a.getAttribute("aria-disabled") === "true") return; if (l.status === "new") setTimeout(() => patch("leads", id, { status: "contacted" }), 800); }));
    delBtn.onclick = () => confirmDanger(delBtn, "Delete lead", async () => { try { await remove("leads", id, "Lead deleted"); go("#/leads"); } catch (e) { toast(e.message); } });
    const tj = document.getElementById("toJob"); if (tj) tj.onclick = async () => { tj.disabled = true; try { const job = await create("jobs", { title: `${l.name} — ${l.project_type || "Project"}`, client: { name: l.name, email: l.email, phone: l.phone }, project_type: l.project_type, description: l.description, lead_id: l.id }, "Job created"); await loadAll({ quiet: true }); go("#/job/" + encodeURIComponent(job.id)); } catch (e) { toast(e.message); tj.disabled = false; } };
    newProp.onclick = async () => { newProp.disabled = true; try { const p = await create("proposals", { client: { name: l.name, email: l.email, phone: l.phone }, project_summary: l.description, lead_id: l.id, title: l.project_type ? `Architectural Design Services — ${l.project_type}` : undefined }, "Proposal drafted"); go("#/proposal/" + encodeURIComponent(p.id) + "/edit"); } catch (e) { toast(e.message); newProp.disabled = false; } };
  } };
});
