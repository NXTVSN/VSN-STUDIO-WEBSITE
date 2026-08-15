import { state, route, esc, pill, money, fmtWhen, fmtFull, fmtDate, fmtDateShort, dueClass, addDays, telHref, smsHref, mailHref, toast, patch, create, remove, find, upsert, loadAll, api, saveUI, confirmDanger, go, I, JOB_PHASE, JOB_PHASES, JOB_STATUS, fmtBytes, render, modal } from "./core.js";

const paid = (j) => (j.invoices || []).filter((i) => i.paid_at).reduce((s, i) => s + i.amount, 0);
const invoiced = (j) => (j.invoices || []).reduce((s, i) => s + i.amount, 0);
const openTasks = (j) => (j.tasks || []).filter((t) => !t.done);
const nextDue = (j) => openTasks(j).filter((t) => t.due).sort((a, b) => a.due.localeCompare(b.due))[0];
const phaseIdx = (j) => JOB_PHASES.indexOf(j.phase);

export function jobCard(j) {
  const nd = nextDue(j);
  return `
    <a class="card link" href="#/job/${encodeURIComponent(j.id)}">
      <div class="top"><div><div class="name">${esc(j.title)}</div><div class="meta"><span>${esc(j.client?.name || "—")}</span>${j.site_address ? `<span>${esc(j.site_address)}</span>` : ""}</div></div>${pill(j.status, JOB_STATUS[j.status])}</div>
      <div class="phasebar">${JOB_PHASES.map((p, i) => `<i class="${i < phaseIdx(j) ? "on" : i === phaseIdx(j) ? "cur" : ""}"></i>`).join("")}</div>
      <div class="foot"><span class="subtle">${JOB_PHASE[j.phase]}${j.fee ? ` · ${money(paid(j))} / ${money(j.fee)}` : ""}</span>${nd ? `<span class="pill ${dueClass(nd.due) === "overdue" ? "c-overdue" : dueClass(nd.due) === "today" ? "c-contacted" : ""}">${esc(nd.text.slice(0, 28))}${nd.text.length > 28 ? "…" : ""} · ${fmtDateShort(nd.due)}</span>` : openTasks(j).length ? `<span class="subtle">${openTasks(j).length} open task${openTasks(j).length > 1 ? "s" : ""}</span>` : ""}</div>
    </a>`;
}

route("/jobs", () => {
  const filter = state.ui.jobFilter || "active";
  const counts = { active: 0, "on-hold": 0, complete: 0, archived: 0, all: state.jobs.length };
  state.jobs.forEach((j) => counts[j.status]++);
  const list = state.jobs.filter((j) => filter === "all" || j.status === filter);
  const active = state.jobs.filter((j) => j.status === "active");
  const pipelineFee = active.reduce((s, j) => s + (j.fee || 0), 0);
  const outstanding = active.reduce((s, j) => s + invoiced(j) - paid(j), 0);
  const html = `
    <div class="pagehead">
      <div><div class="eyebrow dash">Work</div><h1 class="display">Jobs</h1><div class="subtle" style="margin-top:6px">${counts.active} active · ${money(pipelineFee)} contracted · ${money(outstanding)} outstanding</div></div>
      <div class="actions"><a class="btn" href="#/job/new">New job <span class="arrow">+</span></a></div>
    </div>
    <div class="chips">${[["active", "Active"], ["on-hold", "On hold"], ["complete", "Complete"], ["archived", "Archived"], ["all", "All"]].map(([k, l]) => `<button class="chip ${filter === k ? "active" : ""}" data-f="${k}">${l}<span class="n">${counts[k]}</span></button>`).join("")}</div>
    <div class="grid cards">${list.length ? list.map(jobCard).join("") : `<div class="empty" style="grid-column:1/-1"><strong>No jobs here</strong>Convert a won lead or an accepted proposal into a job, or create one manually.</div>`}</div>`;
  return { html, mount() { document.querySelectorAll(".chip").forEach((c) => (c.onclick = () => { state.ui.jobFilter = c.dataset.f; saveUI(); render(); })); } };
});

function jobForm(j = {}) {
  const c = j.client || {};
  return `
    <div class="form">
      <label>Project title</label><input id="f_title" value="${esc(j.title || "")}" placeholder="e.g. Hillside Residence — new build" />
      <div class="row"><div><label>Project type</label><input id="f_type" value="${esc(j.project_type || "")}" placeholder="New build, renovation…" /></div><div><label>Contract fee ($)</label><input id="f_fee" type="number" inputmode="decimal" value="${j.fee || ""}" /></div></div>
      <label>Site address</label><input id="f_addr" value="${esc(j.site_address || "")}" />
      <fieldset><legend>Client</legend><div class="form" style="gap:8px">
        <input id="f_cname" value="${esc(c.name || "")}" placeholder="Client name" />
        <div class="row"><input id="f_cphone" type="tel" value="${esc(c.phone || "")}" placeholder="Phone" /><input id="f_cemail" type="email" value="${esc(c.email || "")}" placeholder="Email" autocapitalize="off" /></div>
        <input id="f_ccompany" value="${esc(c.company || "")}" placeholder="Company (optional)" />
        <input id="f_caddr" value="${esc(c.address || "")}" placeholder="Mailing address (optional)" />
      </div></fieldset>
      <div class="row"><div><label>Start date</label><input id="f_start" type="date" value="${esc(j.start_date || "")}" /></div><div><label>Target completion</label><input id="f_target" type="date" value="${esc(j.target_date || "")}" /></div></div>
      <label>Scope / description</label><textarea id="f_desc">${esc(j.description || "")}</textarea>
    </div>`;
}
const readJob = () => ({ title: f_title.value, project_type: f_type.value, fee: f_fee.value, site_address: f_addr.value, client: { name: f_cname.value, phone: f_cphone.value, email: f_cemail.value, company: f_ccompany.value, address: f_caddr.value }, start_date: f_start.value || null, target_date: f_target.value || null, description: f_desc.value });

route("/job/new", () => ({ html: `<a class="back" href="#/jobs">${I.chev} Jobs</a><div class="eyebrow dash">Jobs</div><h2 class="title">New job</h2><div style="max-width:640px;margin-top:16px">${jobForm()}<div class="formbar"><button class="btn" id="save">Create job</button><a class="btn ghost" href="#/jobs">Cancel</a></div></div>`,
  mount() { document.getElementById("save").onclick = async () => { const b = readJob(); if (!b.title.trim()) return toast("Add a project title"); save.disabled = true; try { const j = await create("jobs", b, "Job created"); go("#/job/" + encodeURIComponent(j.id)); } catch (e) { toast(e.message); save.disabled = false; } }; } }));

route("/job/:id/edit", ({ id }) => {
  const j = find("jobs", id); if (!j) return `<div class="empty">Loading…</div>`;
  return { html: `<a class="back" href="#/job/${encodeURIComponent(id)}">${I.chev} Back</a><div class="eyebrow dash">Jobs</div><h2 class="title">Edit job</h2><div style="max-width:640px;margin-top:16px">${jobForm(j)}<div class="formbar"><button class="btn" id="save">Save changes</button><a class="btn ghost" href="#/job/${encodeURIComponent(id)}">Cancel</a></div></div>`,
    mount() { document.getElementById("save").onclick = async () => { save.disabled = true; const r = await patch("jobs", id, readJob(), "Saved"); if (r) go("#/job/" + encodeURIComponent(id)); else save.disabled = false; }; } };
});

route("/job/:id", ({ id }) => {
  const j = find("jobs", id);
  if (!j) return `<a class="back" href="#/jobs">${I.chev} Jobs</a><div class="empty"><strong>${state.loaded ? "Job not found" : "Loading…"}</strong></div>`;
  const c = j.client || {}; const props = state.proposals.filter((p) => p.job_id === j.id); const lead = j.lead_id && find("leads", j.lead_id);
  const tasks = (j.tasks || []).slice().sort((a, b) => (a.done - b.done) || ((a.due || "9") > (b.due || "9") ? 1 : -1));
  const inv = j.invoices || []; const images = (j.files || []).filter((f) => (f.type || "").startsWith("image/"));
  const act = (href, icon, label, ok) => `<a class="action" href="${ok ? href : "#"}" aria-disabled="${!ok}" ${ok && !href.startsWith("tel") && !href.startsWith("sms") && !href.startsWith("mailto") ? 'target="_blank" rel="noopener"' : ""}>${I[icon]}<span>${label}</span></a>`;
  const html = `
    <a class="back" href="#/jobs">${I.chev} Jobs</a>
    <div class="detail-head">
      <div><div class="eyebrow dash">${esc(JOB_PHASE[j.phase])} · ${pill(j.status, JOB_STATUS[j.status])}</div><h1 class="display">${esc(j.title)}</h1><div class="subtle" style="margin-top:6px">${esc(c.name || "")}${j.site_address ? ` · ${esc(j.site_address)}` : ""}</div></div>
      <div class="actions"><a class="btn ghost sm" href="#/job/${encodeURIComponent(id)}/edit">Edit</a><button class="btn ghost sm" id="newProp">New proposal</button></div>
    </div>
    <div class="detail-grid">
      <div class="col">
        <div class="actions4">${act(telHref(c.phone), "phone", "Call", !!c.phone)}${act(smsHref(c.phone, c.name), "msg", "Text", !!c.phone)}${act(mailHref(c.email, c.name), "mail", "Email", !!c.email)}${act("https://maps.apple.com/?q=" + encodeURIComponent(j.site_address || ""), "map", "Site", !!j.site_address)}</div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Phase</span><span class="subtle">${phaseIdx(j) + 1} / ${JOB_PHASES.length}</span></div>
          <div class="segs" style="grid-template-columns:repeat(4,1fr)">${JOB_PHASES.map((p) => `<button class="seg ${j.phase === p ? "active" : ""}" data-p="${p}">${JOB_PHASE[p]}</button>`).join("")}</div>
          <div class="kv"><span class="k">Status</span><span class="v"><select id="jstatus">${Object.entries(JOB_STATUS).map(([k, v]) => `<option value="${k}" ${j.status === k ? "selected" : ""}>${v}</option>`).join("")}</select></span></div>
          <div class="kv"><span class="k">Start</span><span class="v">${fmtDate(j.start_date)}</span></div>
          <div class="kv"><span class="k">Target</span><span class="v">${fmtDate(j.target_date)}</span></div>
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Tasks · ${openTasks(j).length} open</span></div>
          ${tasks.map((t) => `<div class="task ${t.done ? "done" : ""}"><input type="checkbox" ${t.done ? "checked" : ""} data-toggle="${t.id}" /><span class="t">${esc(t.text)}</span>${t.due ? `<span class="d ${!t.done && dueClass(t.due) === "overdue" ? "overdue" : ""}">${fmtDateShort(t.due)}</span>` : ""}<button class="x" data-del-task="${t.id}">×</button></div>`).join("")}
          <div class="inputrow"><input id="taskText" placeholder="Add a task…" /><input id="taskDue" type="date" style="width:150px;flex:0 0 auto" /><button class="btn sm" id="addTask">Add</button></div>
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Notes · ${(j.notes || []).length}</span></div>
          ${(j.notes || []).slice().reverse().map((n) => `<div class="note"><div class="t">${esc(n.text)}</div><div class="m"><span>${fmtFull(n.at)}</span><button class="linkbtn red" data-del-note="${n.id}">Delete</button></div></div>`).join("")}
          <div class="inputrow"><textarea id="noteText" placeholder="Site visit notes, decisions, client requests…"></textarea><button class="btn sm" id="addNote">Add</button></div>
        </div>
      </div>
      <div class="col">
        <div class="group">
          <div class="g-title"><span class="eyebrow">Fees & invoices</span><span class="subtle">${money(paid(j))} paid of ${money(j.fee || invoiced(j))}</span></div>
          <div style="padding:0 16px 8px"><div class="progress"><span style="width:${j.fee ? Math.min(100, (paid(j) / j.fee) * 100) : 0}%"></span></div></div>
          ${inv.map((i) => `<div class="task ${i.paid_at ? "done" : ""}"><input type="checkbox" ${i.paid_at ? "checked" : ""} data-toggle-inv="${i.id}" title="Mark paid" /><span class="t">${esc(i.label)}${i.due && !i.paid_at ? `<span class="d ${dueClass(i.due) === "overdue" ? "overdue" : ""}" style="margin-left:8px">due ${fmtDateShort(i.due)}</span>` : i.paid_at ? `<span class="d" style="margin-left:8px">paid ${fmtWhen(i.paid_at)}</span>` : ""}</span><span class="money">${money(i.amount)}</span><button class="x" data-del-inv="${i.id}">×</button></div>`).join("")}
          <div class="inputrow"><input id="invLabel" placeholder="Invoice / phase" /><input id="invAmt" type="number" inputmode="decimal" placeholder="$" style="width:110px;flex:0 0 auto" /><input id="invDue" type="date" style="width:150px;flex:0 0 auto" /><button class="btn sm" id="addInv">Add</button></div>
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Files · ${(j.files || []).length}</span><label class="linkbtn" style="cursor:pointer">Upload<input type="file" id="fileIn" multiple hidden accept="image/*,.pdf,.dwg,.dxf,.skp,.zip,.doc,.docx,.xls,.xlsx" /></label></div>
          ${images.length ? `<div class="thumbs">${images.slice(0, 9).map((f) => `<a href="/api/studio/files/${f.id}?t=${encodeURIComponent(state.token)}" target="_blank" rel="noopener"><img src="/api/studio/files/${f.id}?t=${encodeURIComponent(state.token)}" alt="" loading="lazy" /></a>`).join("")}</div>` : ""}
          ${(j.files || []).map((f) => `<div class="filerow"><span class="fn"><a href="/api/studio/files/${f.id}?t=${encodeURIComponent(state.token)}" target="_blank" rel="noopener">${esc(f.name)}</a></span><span class="fs">${fmtBytes(f.size)}</span><button class="x" data-del-file="${f.id}" style="color:var(--muted)">×</button></div>`).join("")}
          <div id="upStatus" class="subtle" style="padding:0 16px 12px" hidden></div>
          ${(j.links || []).map((l) => `<div class="filerow"><span class="fn"><a href="${esc(l.url)}" target="_blank" rel="noopener">↗ ${esc(l.label || l.url)}</a></span><button class="x" data-del-link="${l.id}" style="color:var(--muted)">×</button></div>`).join("")}
          <div class="inputrow"><input id="linkLabel" placeholder="Link label (Drive, Dropbox…)" /><input id="linkUrl" placeholder="https://" style="flex:1.4" /><button class="btn sm" id="addLink">Add</button></div>
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Client</span></div>
          <div class="kv"><span class="k">Name</span><span class="v">${esc(c.name || "—")}${c.company ? `<div class="subtle">${esc(c.company)}</div>` : ""}</span></div>
          <div class="kv"><span class="k">Phone</span><span class="v">${c.phone ? `<a href="${telHref(c.phone)}">${esc(c.phone)}</a>` : "—"}</span></div>
          <div class="kv"><span class="k">Email</span><span class="v">${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : "—"}</span></div>
          ${c.address ? `<div class="kv"><span class="k">Address</span><span class="v">${esc(c.address)}</span></div>` : ""}
          ${lead ? `<a class="kv" href="#/lead/${encodeURIComponent(lead.id)}"><span class="k">Lead</span><span class="v">View original inquiry ↗</span></a>` : ""}
        </div>
        ${props.length ? `<div class="group"><div class="g-title"><span class="eyebrow">Proposals</span></div>${props.map((p) => `<a class="kv" href="#/proposal/${encodeURIComponent(p.id)}"><span class="k">${esc(p.number)}</span><span class="v">${pill(p.status, p.status)}</span></a>`).join("")}</div>` : ""}
        ${j.description ? `<div class="group"><div class="g-title"><span class="eyebrow">Scope</span></div><div class="body-text">${esc(j.description)}</div></div>` : ""}
        <button class="btn danger block" id="delBtn">Delete job</button>
      </div>
    </div>`;
  return { html, mount() {
    document.querySelectorAll(".seg[data-p]").forEach((b) => (b.onclick = () => patch("jobs", id, { phase: b.dataset.p }, `Phase: ${JOB_PHASE[b.dataset.p]}`)));
    jstatus.onchange = () => patch("jobs", id, { status: jstatus.value }, "Status updated");
    addTask.onclick = () => { const t = taskText.value.trim(); if (!t) return; patch("jobs", id, { add_task: { text: t, due: taskDue.value || null } }); };
    taskText.onkeydown = (e) => { if (e.key === "Enter") addTask.onclick(); };
    document.querySelectorAll("[data-toggle]").forEach((c) => (c.onchange = () => patch("jobs", id, { toggle_task: c.dataset.toggle })));
    document.querySelectorAll("[data-del-task]").forEach((b) => (b.onclick = () => patch("jobs", id, { delete_task: b.dataset.delTask })));
    addNote.onclick = () => { const t = noteText.value.trim(); if (!t) return; patch("jobs", id, { note: t }, "Note added"); };
    document.querySelectorAll("[data-del-note]").forEach((b) => (b.onclick = () => patch("jobs", id, { delete_note_id: b.dataset.delNote })));
    addInv.onclick = () => { if (!invLabel.value.trim() || !invAmt.value) return toast("Add a label and amount"); patch("jobs", id, { add_invoice: { label: invLabel.value, amount: invAmt.value, due: invDue.value || null } }, "Invoice added"); };
    document.querySelectorAll("[data-toggle-inv]").forEach((c) => (c.onchange = () => patch("jobs", id, { toggle_invoice: c.dataset.toggleInv })));
    document.querySelectorAll("[data-del-inv]").forEach((b) => (b.onclick = () => patch("jobs", id, { delete_invoice: b.dataset.delInv })));
    addLink.onclick = () => { if (!linkUrl.value.trim()) return; patch("jobs", id, { add_link: { label: linkLabel.value, url: linkUrl.value } }, "Link added"); };
    document.querySelectorAll("[data-del-link]").forEach((b) => (b.onclick = () => patch("jobs", id, { delete_link: b.dataset.delLink })));
    document.querySelectorAll("[data-del-file]").forEach((b) => (b.onclick = () => confirmDanger(b, "×", async () => { try { await api("/files/" + b.dataset.delFile, { method: "DELETE" }); await loadAll({ quiet: true }); render(); } catch (e) { toast(e.message); } })));
    fileIn.onchange = async () => {
      const files = [...fileIn.files]; if (!files.length) return; const st = document.getElementById("upStatus"); st.hidden = false;
      for (let i = 0; i < files.length; i++) {
        st.textContent = `Uploading ${i + 1}/${files.length}: ${files[i].name}…`;
        const fd = new FormData(); fd.append("file", files[i]);
        try { await api(`/files?job=${encodeURIComponent(id)}`, { method: "POST", body: fd }); } catch (e) { toast(`${files[i].name}: ${e.message}`); }
      }
      await loadAll({ quiet: true }); toast("Uploaded"); render();
    };
    newProp.onclick = async () => { newProp.disabled = true; try { const p = await create("proposals", { client: c, project_address: j.site_address, project_summary: j.description, job_id: j.id, lead_id: j.lead_id, title: j.title }, "Proposal drafted"); go("#/proposal/" + encodeURIComponent(p.id) + "/edit"); } catch (e) { toast(e.message); newProp.disabled = false; } };
    delBtn.onclick = () => confirmDanger(delBtn, "Delete job", async () => { try { await remove("jobs", id, "Job deleted"); go("#/jobs"); } catch (e) { toast(e.message); } });
  } };
});
