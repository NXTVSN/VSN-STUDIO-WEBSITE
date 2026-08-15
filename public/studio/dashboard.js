import { state, route, esc, pill, money, fmtWhen, fmtDateShort, dueClass, toast, api, loadAll, counts, I, LEAD_STATUS, JOB_PHASE, PROP_STATUS, logout, render } from "./core.js";
import { leadCard } from "./leads.js";
import { jobCard } from "./jobs.js";
import { propCard } from "./proposals.js";

const total = (p) => (p.phases || []).reduce((s, ph) => s + (Number(ph.fee) || 0), 0);

route("/", () => {
  const c = counts();
  const hour = new Date().getHours(); const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = (state.settings.owner_name || "Noah").split(" ")[0];
  const week = state.leads.filter((l) => Date.now() - new Date(l.created_at) < 7 * 86400e3).length;
  const activeJobs = state.jobs.filter((j) => j.status === "active");
  const outstandingProps = state.proposals.filter((p) => ["sent", "viewed"].includes(p.status));
  const outstandingFee = outstandingProps.reduce((s, p) => s + total(p), 0);
  const invoicesDue = activeJobs.flatMap((j) => (j.invoices || []).filter((i) => !i.paid_at).map((i) => ({ ...i, job: j })));
  const receivable = invoicesDue.reduce((s, i) => s + i.amount, 0);
  const newLeads = state.leads.filter((l) => l.status === "new").sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const dueLeads = state.leads.filter((l) => l.next_follow_up && dueClass(l.next_follow_up) !== "upcoming" && !["won", "lost"].includes(l.status));
  const dueTasks = activeJobs.flatMap((j) => (j.tasks || []).filter((t) => !t.done && t.due).map((t) => ({ ...t, job: j }))).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 8);
  const accepted = state.proposals.filter((p) => p.status === "accepted" && !p.job_id);
  const attention = [
    ...accepted.map((p) => ({ k: "accepted", html: `<a class="card link" href="#/proposal/${encodeURIComponent(p.id)}"><div class="top"><div><div class="eyebrow" style="color:#8fe0b7">Proposal accepted</div><div class="name">${esc(p.client?.name || p.number)}</div><div class="meta"><span>${esc(p.title)}</span><span>${money(total(p))}</span></div></div><span class="pill c-accepted">Convert to job</span></div></a>` })),
    ...newLeads.slice(0, 3).map((l) => ({ k: "lead", html: leadCard(l) })),
    ...dueLeads.slice(0, 3).map((l) => ({ k: "due", html: leadCard(l) })),
  ];
  const html = `
    <div class="pagehead">
      <div><div class="eyebrow dash">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div><h1 class="display">${greet}, ${esc(first)}.</h1></div>
      <div class="actions"><button class="iconbtn ${state.loading ? "spin" : ""}" id="refresh" aria-label="Sync">${I.refresh}</button><a class="btn" href="#/lead/new">Lead +</a><a class="btn ghost" href="#/proposal/new">Proposal +</a></div>
    </div>
    ${state.error ? `<div class="banner red">${esc(state.error)}</div>` : ""}
    <div class="grid two" style="grid-template-columns:repeat(2,1fr)">
      <a class="tile navy" href="#/leads"><div class="eyebrow">New leads</div><div class="big">${newLeads.length}</div><div class="sub" style="color:#a9bde0">${week} in the last 7 days</div></a>
      <a class="tile" href="#/jobs"><div class="eyebrow">Active jobs</div><div class="big">${activeJobs.length}</div><div class="sub">${money(activeJobs.reduce((s, j) => s + (j.fee || 0), 0))} contracted</div></a>
      <a class="tile" href="#/proposals"><div class="eyebrow">Proposals out</div><div class="big">${outstandingProps.length}</div><div class="sub">${money(outstandingFee)} awaiting decision</div></a>
      <a class="tile" href="#/jobs"><div class="eyebrow">Receivable</div><div class="big">${money(receivable)}</div><div class="sub">${invoicesDue.length} unpaid invoice${invoicesDue.length === 1 ? "" : "s"}</div></a>
    </div>
    ${attention.length ? `<div class="section"><div class="section-head"><span class="eyebrow dash">Needs attention</span><a class="linkbtn" href="#/leads">All leads</a></div><div class="grid cards">${attention.map((a) => a.html).join("")}</div></div>` : `<div class="section"><div class="empty"><strong>All clear</strong>No new leads, overdue follow-ups, or accepted proposals waiting.</div></div>`}
    <div class="section grid cards" style="align-items:start">
      <div><div class="section-head"><span class="eyebrow dash">Upcoming tasks</span><a class="linkbtn" href="#/jobs">Jobs</a></div>
        <div class="group">${dueTasks.length ? dueTasks.map((t) => `<a class="task" href="#/job/${encodeURIComponent(t.job.id)}"><span class="t">${esc(t.text)}<div class="subtle">${esc(t.job.title)}</div></span><span class="d ${dueClass(t.due) === "overdue" ? "overdue" : ""}">${fmtDateShort(t.due)}</span></a>`).join("") : `<div class="body-text" style="padding:16px">No dated tasks on active jobs.</div>`}</div></div>
      <div><div class="section-head"><span class="eyebrow dash">Active jobs</span><a class="linkbtn" href="#/jobs">All</a></div>
        <div class="list">${activeJobs.slice(0, 4).map(jobCard).join("") || `<div class="empty">No active jobs yet.</div>`}</div></div>
    </div>
    ${state.proposals.length ? `<div class="section"><div class="section-head"><span class="eyebrow dash">Recent proposals</span><a class="linkbtn" href="#/proposals">All</a></div><div class="grid cards">${state.proposals.slice(0, 4).map(propCard).join("")}</div></div>` : ""}`;
  return { html, mount() { document.getElementById("refresh").onclick = () => loadAll({ forceLeads: true }); } };
});

route("/settings", () => {
  const s = state.settings || {};
  const phases = s.default_phases || [];
  const html = `
    <div class="pagehead"><div><div class="eyebrow dash">Workspace</div><h1 class="display">Settings</h1></div><div class="actions"><button class="btn ghost sm" id="logoutBtn">Sign out</button></div></div>
    <div class="form" style="max-width:720px">
      <fieldset><legend>Studio</legend><div class="form" style="gap:8px">
        <div class="row"><div><label>Studio name</label><input id="s_studio" value="${esc(s.studio_name || "")}" /></div><div><label>Your name</label><input id="s_owner" value="${esc(s.owner_name || "")}" /></div></div>
        <div class="row"><div><label>Email</label><input id="s_email" value="${esc(s.email || "")}" /></div><div><label>Phone</label><input id="s_phone" value="${esc(s.phone || "")}" /></div></div>
        <div class="row"><div><label>Website</label><input id="s_web" value="${esc(s.website || "")}" /></div><div><label>Booking link</label><input id="s_cal" value="${esc(s.calendly || "")}" /></div></div>
        <label>Address (shown on proposals)</label><input id="s_addr" value="${esc(s.address || "")}" />
      </div></fieldset>
      <fieldset><legend>Proposal defaults</legend><div class="form" style="gap:8px">
        <label>Number prefix</label><input id="s_prefix" value="${esc(s.proposal_prefix || "SV")}" style="max-width:160px" />
        <label>Introduction</label><textarea id="s_intro">${esc(s.proposal_intro || "")}</textarea>
        <label>Default phases</label>
        <div class="list-edit" id="phList" style="gap:8px">${phases.map((ph) => `<div class="phase-row"><input class="ph-name" value="${esc(ph.name)}" placeholder="Phase" /><textarea class="ph-desc" style="min-height:52px">${esc(ph.desc || "")}</textarea><div class="r2"><span class="subtle">Default fee</span><span></span><input class="ph-fee fee" type="number" value="${ph.fee || ""}" placeholder="$" /><button class="rm">×</button></div></div>`).join("")}</div>
        <button class="btn ghost sm" id="addPh" style="align-self:flex-start">+ Add phase</button>
        <label>Default exclusions</label><textarea id="s_excl">${esc(s.default_exclusions || "")}</textarea>
        <label>Default terms</label><textarea id="s_terms" style="min-height:160px">${esc(s.proposal_terms || "")}</textarea>
      </div></fieldset>
      <div class="formbar"><button class="btn" id="save">Save settings</button></div>
      <p class="hint" style="text-align:left">Passcode is set in Netlify (env var <code>CRM_PASSCODE</code>). Leads sync from vsndesignstudio.com's forms automatically. Install: Safari → Share → Add to Home Screen.</p>
    </div>`;
  return { html, mount() {
    logoutBtn.onclick = logout;
    const wire = () => document.querySelectorAll("#phList .rm").forEach((b) => (b.onclick = () => b.closest(".phase-row").remove()));
    wire();
    addPh.onclick = () => { phList.insertAdjacentHTML("beforeend", `<div class="phase-row"><input class="ph-name" placeholder="Phase" /><textarea class="ph-desc" style="min-height:52px"></textarea><div class="r2"><span class="subtle">Default fee</span><span></span><input class="ph-fee fee" type="number" placeholder="$" /><button class="rm">×</button></div></div>`); wire(); };
    save.onclick = async () => {
      save.disabled = true;
      const body = { studio_name: s_studio.value, owner_name: s_owner.value, email: s_email.value, phone: s_phone.value, website: s_web.value, calendly: s_cal.value, address: s_addr.value, proposal_prefix: s_prefix.value, proposal_intro: s_intro.value, default_exclusions: s_excl.value, proposal_terms: s_terms.value,
        default_phases: [...document.querySelectorAll("#phList .phase-row")].map((r) => ({ name: r.querySelector(".ph-name").value, desc: r.querySelector(".ph-desc").value, fee: Number(r.querySelector(".ph-fee").value) || 0 })).filter((p) => p.name.trim()) };
      try { const { settings } = await api("/settings", { method: "PUT", body }); state.settings = settings; toast("Settings saved"); } catch (e) { toast(e.message); }
      save.disabled = false;
    };
  } };
});
