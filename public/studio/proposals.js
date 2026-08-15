import { state, route, esc, pill, money, fmtWhen, fmtFull, fmtDate, toast, patch, create, remove, find, upsert, loadAll, api, saveUI, confirmDanger, go, I, PROP_STATUS, render, modal } from "./core.js";

const total = (p) => (p.phases || []).reduce((s, ph) => s + (Number(ph.fee) || 0), 0);
export const publicUrl = (p) => `${location.origin}/p/${p.token}`;

export function propCard(p) {
  return `
    <a class="card link" href="#/proposal/${encodeURIComponent(p.id)}">
      <div class="top"><div><div class="eyebrow" style="margin-bottom:4px">${esc(p.number)}</div><div class="name">${esc(p.client?.name || "—")}</div><div class="meta"><span>${esc(p.title)}</span></div></div>${pill(p.status, PROP_STATUS[p.status])}</div>
      <div class="foot"><span class="money" style="font-size:18px;font-weight:300">${money(total(p))}</span><span class="subtle">${p.status === "accepted" ? `Accepted ${fmtWhen(p.accepted_at)}` : p.status === "viewed" ? `Viewed ${fmtWhen(p.last_viewed_at || p.viewed_at)}` : p.sent_at ? `Sent ${fmtWhen(p.sent_at)}` : `Edited ${fmtWhen(p.updated_at)}`}</span></div>
      ${p.status === "accepted" && !p.job_id ? `<div class="banner" style="margin:10px 0 0">Accepted — convert to a job</div>` : ""}
    </a>`;
}

route("/proposals", () => {
  const filter = state.ui.propFilter || "open";
  const counts = { all: state.proposals.length, open: 0 }; Object.keys(PROP_STATUS).forEach((s) => (counts[s] = 0));
  state.proposals.forEach((p) => { counts[p.status]++; if (["draft", "sent", "viewed"].includes(p.status)) counts.open++; });
  const list = state.proposals.filter((p) => filter === "all" || (filter === "open" ? ["draft", "sent", "viewed"].includes(p.status) : p.status === filter));
  const outstanding = state.proposals.filter((p) => ["sent", "viewed"].includes(p.status)).reduce((s, p) => s + total(p), 0);
  const won = state.proposals.filter((p) => p.status === "accepted").reduce((s, p) => s + total(p), 0);
  const html = `
    <div class="pagehead">
      <div><div class="eyebrow dash">Sales</div><h1 class="display">Proposals</h1><div class="subtle" style="margin-top:6px">${money(outstanding)} awaiting decision · ${money(won)} accepted</div></div>
      <div class="actions"><a class="btn" href="#/proposal/new">New proposal <span class="arrow">+</span></a></div>
    </div>
    <div class="chips">${[["open", "Open"], ["all", "All"], ...Object.entries(PROP_STATUS)].map(([k, l]) => `<button class="chip ${filter === k ? "active" : ""}" data-f="${k}">${l}<span class="n">${counts[k]}</span></button>`).join("")}</div>
    <div class="grid cards">${list.length ? list.map(propCard).join("") : `<div class="empty" style="grid-column:1/-1"><strong>No proposals here</strong>Draft one from a lead, a job, or from scratch. Clients get a private link where they can review and accept.</div>`}</div>`;
  return { html, mount() { document.querySelectorAll(".chip").forEach((c) => (c.onclick = () => { state.ui.propFilter = c.dataset.f; saveUI(); render(); })); } };
});

route("/proposal/new", () => ({ html: `<div class="empty">Creating…</div>`, mount: async () => { try { const p = await create("proposals", {}, "Proposal drafted"); location.replace("#/proposal/" + encodeURIComponent(p.id) + "/edit"); } catch (e) { toast(e.message); go("#/proposals"); } } }));

/* ---------- editor ---------- */
route("/proposal/:id/edit", ({ id }) => {
  const p = find("proposals", id); if (!p) return `<div class="empty">Loading…</div>`;
  const c = p.client || {};
  const phaseRow = (ph = {}, i) => `
    <div class="phase-row" data-i="${i}">
      <input class="ph-name" value="${esc(ph.name || "")}" placeholder="Phase name" />
      <textarea class="ph-desc" style="min-height:56px" placeholder="What's included in this phase">${esc(ph.desc || "")}</textarea>
      <div class="r2"><span class="subtle">Duration / fee</span><input class="ph-weeks" value="${esc(ph.weeks || "")}" placeholder="e.g. 3 wks" /><input class="ph-fee fee" type="number" inputmode="decimal" value="${ph.fee || ""}" placeholder="$" /><button class="rm" title="Remove">×</button></div>
    </div>`;
  const listRow = (v = "") => `<div class="li"><input value="${esc(v)}" /><button title="Remove">×</button></div>`;
  const html = `
    <a class="back" href="#/proposal/${encodeURIComponent(id)}">${I.chev} Back to proposal</a>
    <div class="pagehead"><div><div class="eyebrow dash">${esc(p.number)} · ${PROP_STATUS[p.status]}</div><h2 class="title">Edit proposal</h2></div><div class="actions"><span class="subtle" id="autosave"></span></div></div>
    <div class="detail-grid" style="grid-template-columns:1fr">
    <div class="form" style="max-width:760px">
      <label>Proposal title</label><input id="f_title" value="${esc(p.title)}" />
      <fieldset><legend>Client</legend><div class="form" style="gap:8px">
        <input id="f_cname" value="${esc(c.name || "")}" placeholder="Client name" />
        <div class="row"><input id="f_cphone" type="tel" value="${esc(c.phone || "")}" placeholder="Phone" /><input id="f_cemail" type="email" value="${esc(c.email || "")}" placeholder="Email" autocapitalize="off" /></div>
        <input id="f_ccompany" value="${esc(c.company || "")}" placeholder="Company (optional)" />
        <input id="f_caddr" value="${esc(c.address || "")}" placeholder="Client address (optional)" />
      </div></fieldset>
      <label>Project address</label><input id="f_paddr" value="${esc(p.project_address || "")}" />
      <label>Project summary</label><textarea id="f_summary" placeholder="Brief description of the project as you understand it">${esc(p.project_summary || "")}</textarea>
      <label>Introduction</label><textarea id="f_intro">${esc(p.intro || "")}</textarea>
      <label>Scope of services</label><div class="list-edit" id="scopeList">${(p.scope || []).map(listRow).join("")}</div><button class="btn ghost sm" id="addScope" style="align-self:flex-start">+ Add scope item</button>
      <label>Phases & fees</label><div class="list-edit" id="phaseList" style="gap:8px">${(p.phases || []).map(phaseRow).join("")}</div><button class="btn ghost sm" id="addPhase" style="align-self:flex-start">+ Add phase</button>
      <div class="total"><span class="eyebrow">Total fee</span><span class="big money" id="totalOut">${money(total(p))}</span></div>
      <label>Deliverables</label><div class="list-edit" id="delivList">${(p.deliverables || []).map(listRow).join("")}</div><button class="btn ghost sm" id="addDeliv" style="align-self:flex-start">+ Add deliverable</button>
      <label>Exclusions</label><textarea id="f_excl">${esc(p.exclusions || "")}</textarea>
      <label>Terms</label><textarea id="f_terms" style="min-height:140px">${esc(p.terms || "")}</textarea>
      <label>Valid until</label><input id="f_valid" type="date" value="${esc(p.valid_until || "")}" style="max-width:220px" />
      <div class="formbar"><button class="btn" id="save">Save & preview</button><a class="btn ghost" href="#/proposal/${encodeURIComponent(id)}">Cancel</a></div>
    </div></div>`;
  return { html, mount() {
    const $ = (s, r = document) => r.querySelector(s);
    const readList = (sel) => [...document.querySelectorAll(`${sel} .li input`)].map((i) => i.value.trim()).filter(Boolean);
    const readPhases = () => [...document.querySelectorAll("#phaseList .phase-row")].map((r) => ({ name: $(".ph-name", r).value, desc: $(".ph-desc", r).value, weeks: $(".ph-weeks", r).value, fee: Number($(".ph-fee", r).value) || 0 }));
    const readAll = () => ({ title: f_title.value, client: { name: f_cname.value, phone: f_cphone.value, email: f_cemail.value, company: f_ccompany.value, address: f_caddr.value }, project_address: f_paddr.value, project_summary: f_summary.value, intro: f_intro.value, scope: readList("#scopeList"), phases: readPhases(), deliverables: readList("#delivList"), exclusions: f_excl.value, terms: f_terms.value, valid_until: f_valid.value || null });
    const wireRemove = (root) => root.querySelectorAll(".li button, .phase-row .rm").forEach((b) => (b.onclick = () => { b.closest(".li, .phase-row").remove(); updateTotal(); }));
    const updateTotal = () => { totalOut.textContent = money(readPhases().reduce((s, ph) => s + ph.fee, 0)); };
    wireRemove(document);
    document.addEventListener("input", (e) => { if (e.target.classList.contains("ph-fee")) updateTotal(); });
    addScope.onclick = () => { scopeList.insertAdjacentHTML("beforeend", listRow("")); wireRemove(scopeList); scopeList.lastElementChild.querySelector("input").focus(); };
    addDeliv.onclick = () => { delivList.insertAdjacentHTML("beforeend", listRow("")); wireRemove(delivList); delivList.lastElementChild.querySelector("input").focus(); };
    addPhase.onclick = () => { phaseList.insertAdjacentHTML("beforeend", phaseRow({}, phaseList.children.length)); wireRemove(phaseList); phaseList.lastElementChild.querySelector("input").focus(); };
    let dirty = false, timer;
    document.addEventListener("input", () => { dirty = true; autosave.textContent = "Unsaved changes"; clearTimeout(timer); timer = setTimeout(async () => { try { const { item } = await api("/proposals/" + encodeURIComponent(id), { method: "PATCH", body: readAll() }); upsert("proposals", item); dirty = false; autosave.textContent = "Saved " + new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); } catch (e) { autosave.textContent = "Save failed: " + e.message; } }, 1500); });
    save.onclick = async () => { save.disabled = true; clearTimeout(timer); const r = await patch("proposals", id, readAll(), "Saved"); if (r) go("#/proposal/" + encodeURIComponent(id)); else save.disabled = false; };
  } };
});

/* ---------- detail ---------- */
route("/proposal/:id", ({ id }) => {
  const p = find("proposals", id);
  if (!p) return `<a class="back" href="#/proposals">${I.chev} Proposals</a><div class="empty"><strong>${state.loaded ? "Proposal not found" : "Loading…"}</strong></div>`;
  const c = p.client || {}; const job = p.job_id && find("jobs", p.job_id); const lead = p.lead_id && find("leads", p.lead_id);
  const url = publicUrl(p);
  const tl = [["Created", p.created_at], ["Sent", p.sent_at], ["First viewed", p.viewed_at], ["Last viewed", p.last_viewed_at], ["Accepted", p.accepted_at], ["Declined", p.declined_at]].filter(([, v]) => v);
  const html = `
    <a class="back" href="#/proposals">${I.chev} Proposals</a>
    <div class="detail-head">
      <div><div class="eyebrow dash">${esc(p.number)} · ${pill(p.status, PROP_STATUS[p.status])}</div><h1 class="display">${esc(p.title)}</h1><div class="subtle" style="margin-top:6px">${esc(c.name || "No client yet")}${p.project_address ? ` · ${esc(p.project_address)}` : ""}</div></div>
      <div class="actions">
        <a class="btn ghost sm" href="#/proposal/${encodeURIComponent(id)}/edit">Edit</a>
        <a class="btn ghost sm" href="/p/${esc(p.token)}?preview=1" target="_blank" rel="noopener">Preview ↗</a>
        ${p.status === "draft" ? `<button class="btn sm" id="sendBtn">Mark sent & copy link</button>` : `<button class="btn sm" id="copyBtn">Copy client link</button>`}
        ${p.status === "accepted" && !job ? `<button class="btn navy sm" id="convertBtn">Convert to job ↗</button>` : job ? `<a class="btn navy sm" href="#/job/${encodeURIComponent(job.id)}">Open job ↗</a>` : ""}
      </div>
    </div>
    <div class="detail-grid">
      <div class="col">
        <div class="tile navy"><div class="eyebrow">Total fee</div><div class="big money">${money(total(p))}</div><div class="sub" style="color:#a9bde0">${(p.phases || []).length} phase${(p.phases || []).length === 1 ? "" : "s"} · valid until ${fmtDate(p.valid_until)}</div></div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Phases</span></div>
          ${(p.phases || []).map((ph) => `<div class="kv"><span class="k" style="color:var(--text)">${esc(ph.name)}${ph.weeks ? `<div class="subtle">${esc(ph.weeks)}</div>` : ""}</span><span class="v money">${money(ph.fee)}</span></div>`).join("") || `<div class="body-text">No phases yet.</div>`}
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Client link</span><span class="subtle">${p.views || 0} view${p.views === 1 ? "" : "s"}</span></div>
          <div class="body-text" style="word-break:break-all;color:#9fc0f5">${esc(url)}</div>
          <div class="inputrow" style="padding-top:0"><button class="btn ghost sm" id="shareBtn">Share…</button><a class="btn ghost sm" href="mailto:${esc(c.email || "")}?subject=${encodeURIComponent(`Proposal ${p.number} — ${state.settings.studio_name || "Studio Visionary"}`)}&body=${encodeURIComponent(`Hi ${(c.name || "").split(" ")[0]},\n\nThank you again for the conversation. Here is our proposal for ${p.title}:\n${url}\n\nYou can review everything there and accept online. Happy to walk through any questions.\n\nBest,\n${state.settings.owner_name || ""}\n${state.settings.studio_name || ""}`)}" id="emailBtn">Email to client</a><button class="btn ghost sm" id="regenBtn" title="Invalidate the old link">New link</button></div>
        </div>
        ${tl.length ? `<div class="group"><div class="g-title"><span class="eyebrow">Activity</span></div><div class="timeline">${tl.map(([k, v]) => `<div><b>${k}</b><span>${fmtFull(v)}</span></div>`).join("")}${p.accepted_by ? `<div><b>Signed by</b><span>${esc(p.accepted_by.name)}${p.accepted_by.email ? ` · ${esc(p.accepted_by.email)}` : ""}</span></div>` : ""}${p.decline_reason ? `<div><b>Reason</b><span>${esc(p.decline_reason)}</span></div>` : ""}</div></div>` : ""}
      </div>
      <div class="col">
        <div class="group">
          <div class="g-title"><span class="eyebrow">Status</span></div>
          <div class="segs">${Object.entries(PROP_STATUS).map(([k, v]) => `<button class="seg ${p.status === k ? "active" : ""}" data-s="${k}">${v}</button>`).join("")}</div>
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Client</span></div>
          <div class="kv"><span class="k">Name</span><span class="v">${esc(c.name || "—")}${c.company ? `<div class="subtle">${esc(c.company)}</div>` : ""}</span></div>
          <div class="kv"><span class="k">Phone</span><span class="v">${esc(c.phone || "—")}</span></div>
          <div class="kv"><span class="k">Email</span><span class="v">${esc(c.email || "—")}</span></div>
          ${lead ? `<a class="kv" href="#/lead/${encodeURIComponent(lead.id)}"><span class="k">Lead</span><span class="v">View inquiry ↗</span></a>` : ""}
        </div>
        ${p.project_summary ? `<div class="group"><div class="g-title"><span class="eyebrow">Project summary</span></div><div class="body-text">${esc(p.project_summary)}</div></div>` : ""}
        <div class="group"><div class="g-title"><span class="eyebrow">More</span></div><div class="inputrow" style="padding-top:6px"><button class="btn ghost sm" id="dupBtn">Duplicate</button><a class="btn ghost sm" href="/p/${esc(p.token)}?preview=1&print=1" target="_blank" rel="noopener">Print / PDF</a></div></div>
        <button class="btn danger block" id="delBtn">Delete proposal</button>
      </div>
    </div>`;
  return { html, mount() {
    const copy = async () => { try { await navigator.clipboard.writeText(url); toast("Client link copied"); } catch { prompt("Client link", url); } };
    const sb = document.getElementById("sendBtn"); if (sb) sb.onclick = async () => { sb.disabled = true; try { const { item } = await api(`/proposals/${encodeURIComponent(id)}/send`, { method: "POST" }); upsert("proposals", item); await copy(); render(); } catch (e) { toast(e.message); sb.disabled = false; } };
    const cb = document.getElementById("copyBtn"); if (cb) cb.onclick = copy;
    shareBtn.onclick = async () => { if (navigator.share) { try { await navigator.share({ title: `Proposal ${p.number}`, text: `${state.settings.studio_name || "Studio Visionary"} — proposal for ${p.title}`, url }); return; } catch {} } copy(); };
    regenBtn.onclick = () => confirmDanger(regenBtn, "New link", () => patch("proposals", id, { regenerate_token: true }, "New link generated — old link no longer works"));
    document.querySelectorAll(".seg[data-s]").forEach((b) => (b.onclick = () => { if (b.dataset.s !== p.status) patch("proposals", id, { status: b.dataset.s }, `Marked ${PROP_STATUS[b.dataset.s]}`); }));
    dupBtn.onclick = async () => { try { const { item } = await api(`/proposals/${encodeURIComponent(id)}/duplicate`, { method: "POST" }); upsert("proposals", item); toast("Duplicated"); go("#/proposal/" + encodeURIComponent(item.id) + "/edit"); } catch (e) { toast(e.message); } };
    const cv = document.getElementById("convertBtn"); if (cv) cv.onclick = async () => { cv.disabled = true; try { const { item } = await api(`/proposals/${encodeURIComponent(id)}/convert`, { method: "POST", body: {} }); await loadAll({ quiet: true }); toast("Job created"); go("#/job/" + encodeURIComponent(item.id)); } catch (e) { toast(e.message); cv.disabled = false; } };
    delBtn.onclick = () => confirmDanger(delBtn, "Delete proposal", async () => { try { await remove("proposals", id, "Proposal deleted"); go("#/proposals"); } catch (e) { toast(e.message); } });
  } };
});
