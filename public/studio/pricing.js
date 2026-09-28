/* VSN Studio — Pricing: base fee + per-view quote. Count the images, add the base, done. */
import { state, route, esc, money, toast, create, api, upsert, go, I, addDays, confirmDanger, render, modal } from "./core.js";

I.calc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/></svg>';

/* ---------- storage (v2 keys: the v1 package model is retired) ---------- */
const LS = { rates: "vsn_pricing_rates_v2", draft: "vsn_pricing_draft_v2", saved: "vsn_pricing_saved_v2" };
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
const store = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------- rate card ----------
   Model (Sep 28 2026): one base fee covers the site visit, the design decisions and the 3D model.
   Everything the client receives after that is priced per image or per sheet.
   Calibrated against 2025–26 published US viz-studio and NYC design rates (see nvinterior/reference/PRICING_RESEARCH_2026-09.md). */
export const DEFAULT_RATES = {
  version: 2,
  round_to: 50,
  deposit_pct: 50,
  valid_days: 14,
  min_views: 3,
  revisions_included: 2,
  rush_pct: 25,
  markets: {
    residential: {
      label: "Residential",
      base: 2000, base_desc: "Site visit and measure, design decisions, palette, 3D model of the space",
      hero: 400, angle: 200, plan: 400, sheet: 300, facade: 300, list: 500, revision_view: 150, site_visit: 250,
      band: [5000, 12000], band_note: "NYC single-room design fee from $5,000 · Staten Island $2,500–15,000 · US viz studios $250–600 per residential view",
    },
    commercial: {
      label: "Commercial",
      base: 4000, base_desc: "Site visit and measure, design decisions, brand and signage integration, 3D model of the space",
      hero: 650, angle: 325, plan: 500, sheet: 400, facade: 250, list: 750, revision_view: 200, site_visit: 350,
      band: [10000, 30000], band_note: "Commercial concept phase ≈ a quarter to a third of a 6–10% design fee · US viz studios $400–1,000 per commercial view",
    },
  },
  units: {
    hero:     { label: "Hero view",               unit: "view",   desc: "Final photoreal image of a space. One or two per space." },
    angle:    { label: "Additional angle",         unit: "view",   desc: "Another view of a space already modeled and rendered." },
    plan:     { label: "Rendered floor plan",      unit: "level",  desc: "Furnished, colored plan pulled from the model." },
    sheet:    { label: "Detail sheet",             unit: "sheet",  desc: "Dimensioned elevation, section or isometric from the model. V.I.F." },
    facade:   { label: "Facade / exterior option", unit: "option", desc: "Exterior study rendered from the model." },
    list:     { label: "Sourced list",             unit: "list",   desc: "Material or furniture schedule with links and pricing." },
    revision: { label: "Extra revision round",     unit: "round",  desc: "Beyond the included rounds; billed per view re-rendered." },
    site:     { label: "Construction site visit",  unit: "visit",  desc: "Check built work against the images and sheets." },
  },
  exclusions: [
    "Permits, filings and expediting",
    "Structural, MEP or code engineering",
    "Fabrication / shop drawings",
    "Procurement, ordering and delivery coordination",
    "Construction management and contractor supervision",
    "Furniture, materials, contractor costs, delivery and taxes",
    "Product pricing and availability are as found on the date sourced and are subject to change",
  ],
  vif: "All dimensions shall be verified by the contractor in the field prior to the commencement of any work, fabrication, or material procurement.",
};
const deepMerge = (a, b) => { const o = { ...a }; for (const k in b) o[k] = b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) ? deepMerge(a[k] || {}, b[k]) : b[k]; return o; };
export const rates = () => deepMerge(DEFAULT_RATES, load(LS.rates, {}));

/* ---------- quote draft ---------- */
const BLANK = () => ({
  name: "", address: "", email: "", phone: "", notes: "", market: "residential",
  hero: 3, angle: 0, plan: 1, sheet: 0, facade: 0, list: 0, revision: 0, site: 0,
  rush: false, discount: 0,
});
let q = { ...BLANK(), ...load(LS.draft, {}) };
const saveDraft = () => store(LS.draft, q);

/* ---------- compute ---------- */
export function compute(q, R = rates()) {
  const M = R.markets[q.market] || R.markets.residential; const U = R.units;
  const n = (v) => Math.max(0, Number(v) || 0);
  const lines = [], flags = [], included = [];
  const push = (label, amt, note) => { if (amt) lines.push({ label, amt: Math.round(amt), note }); };
  const count = (k, rate, note) => { const c = n(q[k]); if (c) push(`${c} ${U[k].label.toLowerCase()}${c > 1 ? "s" : ""} × ${money(rate)}`, c * rate, note); return c; };

  push(`${M.label} base fee`, M.base, M.base_desc);
  const hero = count("hero", M.hero);
  const angle = count("angle", M.angle);
  const plan = count("plan", M.plan);
  const sheet = count("sheet", M.sheet);
  const facade = count("facade", M.facade);
  const list = count("list", M.list);
  const views = hero + angle + facade;
  const rev = n(q.revision);
  if (rev) push(`${rev} extra revision round${rev > 1 ? "s" : ""} × ${views} view${views === 1 ? "" : "s"} × ${money(M.revision_view)}`, rev * views * M.revision_view, `${R.revisions_included} rounds included`);
  const site = count("site", M.site_visit);

  const subtotal = lines.reduce((s, l) => s + l.amt, 0);
  const rush = q.rush ? Math.round(subtotal * R.rush_pct / 100) : 0;
  if (rush) lines.push({ label: `Rush delivery (+${R.rush_pct}%)`, amt: rush });
  const discount = Math.min(n(q.discount), subtotal + rush);
  if (discount) lines.push({ label: "Discount", amt: -discount });
  const unrounded = subtotal + rush - discount;
  const quote = Math.ceil(unrounded / R.round_to) * R.round_to;
  const rounding = quote - unrounded;
  const deposit = Math.round(quote * R.deposit_pct / 100);
  const perView = views ? Math.round(quote / views) : 0;

  if (views < R.min_views) flags.push(`Under the ${R.min_views}-view minimum. Add views or quote the base fee as a model-only job.`);
  if (hero && angle > hero * 2) flags.push("More than two angles per hero view: check that every space is actually modeled.");
  if (sheet && !hero) flags.push("Detail sheets without any rendered views: confirm the client wants drawings only.");
  if (q.rush) flags.push("Rush: confirm you can actually deliver in under 2 weeks before sending.");
  if (quote < M.band[0]) flags.push(`Below the ${M.label.toLowerCase()} market floor (${money(M.band[0])}). Fine for a small job; do not discount further.`);

  included.push(M.base_desc);
  if (hero) included.push(`${hero} final photoreal view${hero > 1 ? "s" : ""}`);
  if (angle) included.push(`${angle} additional angle${angle > 1 ? "s" : ""}`);
  if (plan) included.push(`${plan} rendered floor plan${plan > 1 ? "s" : ""}`);
  if (facade) included.push(`${facade} facade / exterior option${facade > 1 ? "s" : ""}`);
  if (sheet) included.push(`${sheet} dimensioned detail sheet${sheet > 1 ? "s" : ""} for the contractor (V.I.F.)`);
  if (list) included.push(`${list} sourced list${list > 1 ? "s" : ""} with links and pricing`);
  included.push(`${R.revisions_included + rev} revision round${R.revisions_included + rev > 1 ? "s" : ""}`);
  if (site) included.push(`${site} construction site visit${site > 1 ? "s" : ""}`);
  included.push("Final package PDF, images at print resolution");

  const pos = Math.max(0, Math.min(1, (quote - M.band[0] * 0.6) / (M.band[1] * 1.25 - M.band[0] * 0.6)));
  return { M, lines, subtotal, rush, discount, unrounded, quote, rounding, deposit, views, hero, angle, plan, sheet, facade, list, rev, site, perView, flags, included, pos };
}

/* ---------- text outputs ---------- */
function clientText(q, r, R) {
  const first = (q.name || "").split(" ")[0] || "there";
  return `Hi ${first},\n\nHere is the design fee for ${q.address || "your project"}:\n\n${money(r.quote)}\n\nIncluded:\n${r.included.map((s) => `• ${s}`).join("\n")}\n\nNot included: furniture, materials, contractor costs, permits, shop drawings, procurement and construction management.\n\n${R.deposit_pct}% deposit (${money(r.deposit)}) to begin; balance on delivery of the final package. Extra views or sheets are quoted at the same per-item rates before work begins.\n\nBest,\n${state.settings.owner_name || "Noah"}\n${state.settings.studio_name || "Studio Visionary"}`;
}
function internalText(q, r, R) {
  return `QUOTE — ${q.name || "Unnamed"}${q.address ? ` · ${q.address}` : ""}\n${r.M.label} · ${r.views} views · ${r.sheet} sheets · ${r.list} lists\n\n${r.lines.map((l) => `${l.label.padEnd(52)} ${money(l.amt).padStart(10)}`).join("\n")}\n${"Rounding".padEnd(52)} ${money(r.rounding).padStart(10)}\n${"QUOTE".padEnd(52)} ${money(r.quote).padStart(10)}\n\nPer view ${money(r.perView)} · deposit ${money(r.deposit)} · valid ${R.valid_days} days\n${r.flags.length ? "\nFLAGS\n" + r.flags.map((f) => "! " + f).join("\n") : ""}`;
}

/* ---------- proposal ---------- */
function buildProposal(q, r, R) {
  const M = r.M; const rd = (v) => Math.round(v / R.round_to) * R.round_to;
  const viz = r.hero * M.hero + r.angle * M.angle + r.plan * M.plan + r.facade * M.facade;
  const doc = r.sheet * M.sheet + r.list * M.list;
  const ph = [
    { name: "Discover + Model", weeks: "1–2 wks", fee: rd(M.base), desc: `${M.base_desc}. One review of the model before rendering.` },
    { name: "Visualize", weeks: "1–2 wks", fee: rd(viz), desc: `${r.hero} photoreal view${r.hero === 1 ? "" : "s"}${r.angle ? `, ${r.angle} additional angle${r.angle > 1 ? "s" : ""}` : ""}${r.plan ? `, ${r.plan} rendered plan${r.plan > 1 ? "s" : ""}` : ""}${r.facade ? `, ${r.facade} facade option${r.facade > 1 ? "s" : ""}` : ""}. ${R.revisions_included} revision rounds.` },
  ];
  if (doc) ph.push({ name: "Document", weeks: "1 wk", fee: rd(doc), desc: `${r.sheet ? `${r.sheet} dimensioned detail sheet${r.sheet > 1 ? "s" : ""} (V.I.F.)` : ""}${r.sheet && r.list ? ", " : ""}${r.list ? `${r.list} sourced list${r.list > 1 ? "s" : ""} with links and pricing` : ""}. Final package PDF.` });
  const diff = r.quote - ph.reduce((s, p) => s + p.fee, 0); ph[ph.length - 1].fee += diff;
  const terms = state.settings.proposal_terms || `${R.deposit_pct}% deposit (${money(r.deposit)}) to begin; balance due on delivery of the final package.\n${R.revisions_included + r.rev} revision round${R.revisions_included + r.rev > 1 ? "s" : ""} included. Additional views, sheets, lists or rounds are quoted at the same per-item rates before work begins.\nImages and sheets are design intent for the contractor. ${R.vif}\nThis proposal is valid for ${R.valid_days} days.`;
  return {
    title: `Design + visualization — ${q.address || q.name || "Project"}`,
    client: { name: q.name, email: q.email, phone: q.phone, company: "", address: "" },
    project_address: q.address,
    project_summary: q.notes || `${M.label} design and 3D visualization: ${r.views} rendered view${r.views === 1 ? "" : "s"}${r.sheet ? `, ${r.sheet} detail sheet${r.sheet > 1 ? "s" : ""}` : ""}${r.list ? `, ${r.list} sourced list${r.list > 1 ? "s" : ""}` : ""}.`,
    scope: r.included,
    phases: ph,
    deliverables: r.included,
    exclusions: (state.settings.default_exclusions || "") || R.exclusions.join("\n"),
    terms,
    valid_until: addDays(R.valid_days),
  };
}

/* ---------- styles (scoped to this tab) ---------- */
const CSS = `
.pc .kv{padding:9px 16px}.pc .kv .k{font-size:12px;flex:1 1 auto;min-width:0;line-height:1.3}.pc .kv .k small{display:block;color:var(--muted);font-size:11px;margin-top:2px}.pc .kv .v{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex:0 0 auto}
.pc .kv input[type=number]{min-width:0;width:82px;padding:8px 10px;font-size:15px;text-align:center;-moz-appearance:textfield}
.pc input[type=number]::-webkit-inner-spin-button,.pc input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.pc-step{width:34px;height:34px;border-radius:9px;border:1px solid var(--line-2);color:var(--text-2);font-size:18px;line-height:1;display:grid;place-items:center;flex:0 0 auto}.pc-step:hover{color:#fff;border-color:#fff}
.pc .rate{color:var(--muted);font-size:11px;margin-left:6px;white-space:nowrap}
.pc-tiers{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:8px 16px 14px}
.pc-tier{padding:12px 10px;border-radius:12px;background:#0c0c0c;border:1px solid var(--line);text-align:left;color:var(--text-2)}.pc-tier .p{font-size:20px;font-weight:300;letter-spacing:-.02em;color:#fff;margin-top:4px}.pc-tier .l{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}.pc-tier .s{font-size:11px;color:var(--muted);margin-top:4px}.pc-tier.active{background:#fff;color:#000}.pc-tier.active .p{color:#000}.pc-tier.active .s{color:#444}
.pc-line{display:flex;justify-content:space-between;gap:10px;padding:8px 16px;border-top:1px solid var(--line);font-size:13px}.pc-line .n{color:var(--muted);font-size:11px;display:block}.pc-line .a{white-space:nowrap}.pc-line.tot{font-size:15px;color:#fff}
.pc-band{margin:6px 16px 14px}.pc-band .bar{height:8px;border-radius:999px;background:linear-gradient(90deg,#3fb27f33,#3fb27f 30%,#e0a03a 75%,#e0524f);position:relative;margin:8px 0 6px}.pc-band .bar i{position:absolute;top:-4px;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid #000;transform:translateX(-50%)}.pc-band .lbl{display:flex;justify-content:space-between;font-size:11px;color:var(--muted)}
.pc-flag{padding:8px 16px;border-top:1px solid var(--line);font-size:12.5px;color:#f0c274;line-height:1.4}
.pc-check{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px 16px 14px}.pc-check div{background:#0c0c0c;border:1px solid var(--line);border-radius:12px;padding:10px}.pc-check b{display:block;font-size:18px;font-weight:300;letter-spacing:-.02em}.pc-check span{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.pc-saved{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 16px;border-top:1px solid var(--line);font-size:13px}.pc-saved button{color:var(--muted)}.pc-saved button:hover{color:#fff}.pc-saved .x:hover{color:var(--red)}
.pc-actions{display:flex;flex-wrap:wrap;gap:8px;padding:6px 16px 16px}
.pc-mobile{margin-bottom:12px}@media(min-width:900px){.pc-mobile{display:none}}
.pc-rates .kv input[type=number]{width:96px}
`;
let cssMounted = false;
const mountCSS = () => { if (cssMounted) return; const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s); cssMounted = true; };

/* ---------- page ---------- */
route("/pricing", () => {
  mountCSS();
  const R = rates(); const r = compute(q, R); const M = r.M;
  const saved = load(LS.saved, []);
  const num = (k, label, rate, hint) => `
    <div class="kv"><span class="k">${label}<span class="rate">${money(rate)} / ${R.units[k]?.unit || "each"}</span>${hint ? `<small>${esc(hint)}</small>` : ""}</span><span class="v">
      <button class="pc-step" data-step="${k}" data-d="-1">−</button><input type="number" inputmode="numeric" min="0" step="1" data-k="${k}" value="${q[k] ?? 0}" />
      <button class="pc-step" data-step="${k}" data-d="1">+</button></span></div>`;
  const check = (k, label) => `<div class="kv"><span class="k">${label}</span><span class="v"><input type="checkbox" data-k="${k}" ${q[k] ? "checked" : ""} /></span></div>`;

  const html = `
    <div class="pc">
    <div class="pagehead">
      <div><div class="eyebrow dash">Sales</div><h1 class="display">Pricing</h1><div class="subtle" style="margin-top:6px">Base fee plus the images. Count the views on the walkthrough, add the base, send.</div></div>
      <div class="actions"><button class="btn ghost sm" id="pcRates">Rate card</button><button class="btn ghost sm" id="pcReset">New quote</button></div>
    </div>
    <div class="tile navy pc-mobile"><div class="eyebrow">Quote</div><div class="big money" id="pcMobileTotal">${money(r.quote)}</div><div class="sub" style="color:#a9bde0" id="pcMobileSub">${esc(M.label)} · ${r.views} views · ${money(r.perView)}/view</div></div>
    <div class="detail-grid">
      <div class="col">
        <div class="group">
          <div class="g-title"><span class="eyebrow">Job</span></div>
          <div class="form" style="padding:6px 16px 16px;gap:8px">
            <div class="row"><input data-k="name" value="${esc(q.name)}" placeholder="Client name" /><input data-k="address" value="${esc(q.address)}" placeholder="Project address" /></div>
            <div class="row"><input data-k="email" type="email" value="${esc(q.email)}" placeholder="Email (optional)" autocapitalize="off" /><input data-k="phone" type="tel" value="${esc(q.phone)}" placeholder="Phone (optional)" /></div>
            <textarea data-k="notes" style="min-height:64px" placeholder="What they told you: spaces, custom pieces, timeline">${esc(q.notes)}</textarea>
          </div>
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Market</span><span class="subtle">Base fee covers the visit, the design and the model</span></div>
          <div class="pc-tiers">${Object.entries(R.markets).map(([k, m]) => `<button class="pc-tier ${q.market === k ? "active" : ""}" data-market="${k}"><span class="l">${esc(m.label)}</span><div class="p">${money(m.base)}</div><div class="s">${money(m.hero)} hero · ${money(m.angle)} angle</div></button>`).join("")}</div>
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Images</span><span class="subtle">${R.min_views}-view minimum</span></div>
          ${num("hero", "Hero views", M.hero, "One or two per space")}
          ${num("angle", "Additional angles", M.angle, "Same space, another view")}
          ${num("plan", "Rendered floor plans", M.plan, "Per level")}
          ${num("facade", "Facade / exterior options", M.facade)}
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">For the contractor</span><span class="subtle">Optional</span></div>
          ${num("sheet", "Detail sheets", M.sheet, "Elevation, section or isometric, dimensioned")}
          ${num("list", "Sourced lists", M.list, "Material list, furniture schedule")}
          ${num("site", "Construction site visits", M.site_visit)}
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Adjustments</span></div>
          ${num("revision", "Extra revision rounds", M.revision_view, `${R.revisions_included} included · billed per view`)}
          ${check("rush", `Rush delivery, under 2 weeks (+${R.rush_pct}%)`)}
          <div class="kv"><span class="k">Discount ($)</span><span class="v"><input type="number" inputmode="decimal" min="0" step="50" data-k="discount" value="${q.discount || ""}" placeholder="0" /></span></div>
        </div>
      </div>
      <div class="col" id="pcOut">${resultsHTML(q, r, R, saved)}</div>
    </div></div>`;

  return { html, mount() {
    const root = document.querySelector(".pc");
    const repaint = () => { const R2 = rates(); const r2 = compute(q, R2); document.getElementById("pcOut").innerHTML = resultsHTML(q, r2, R2, load(LS.saved, [])); const mt = document.getElementById("pcMobileTotal"); if (mt) { mt.textContent = money(r2.quote); document.getElementById("pcMobileSub").textContent = `${r2.M.label} · ${r2.views} views · ${money(r2.perView)}/view`; } wireOut(); };
    const setVal = (k, v) => { q[k] = v; saveDraft(); };
    root.addEventListener("input", (e) => {
      const k = e.target.dataset.k; if (!k) return;
      if (e.target.type === "checkbox") setVal(k, e.target.checked);
      else if (e.target.type === "number") setVal(k, e.target.value === "" ? 0 : Number(e.target.value));
      else setVal(k, e.target.value);
      repaint();
    });
    root.addEventListener("click", (e) => {
      const t = e.target.closest("[data-market]"); if (t) { setVal("market", t.dataset.market); render(); return; }
      const s = e.target.closest("[data-step]"); if (s) { const k = s.dataset.step; const inp = root.querySelector(`input[data-k="${k}"]`); const next = Math.max(0, (Number(inp.value) || 0) + Number(s.dataset.d)); inp.value = next; setVal(k, next); repaint(); }
    });
    document.getElementById("pcReset").onclick = () => confirmDanger(pcReset, "New quote", () => { q = BLANK(); saveDraft(); render(); toast("Cleared"); });
    document.getElementById("pcRates").onclick = openRates;
    const wireOut = () => {
      const out = document.getElementById("pcOut"); const R2 = rates(); const r2 = compute(q, R2);
      const copy = async (txt, msg) => { try { await navigator.clipboard.writeText(txt); toast(msg); } catch { prompt("Copy", txt); } };
      out.querySelector("#pcCopyClient").onclick = () => copy(clientText(q, r2, R2), "Client message copied");
      out.querySelector("#pcCopyInt").onclick = () => copy(internalText(q, r2, R2), "Breakdown copied");
      out.querySelector("#pcSave").onclick = () => { const list = load(LS.saved, []); const id = q._id || crypto.randomUUID(); q._id = id; const rec = { id, at: new Date().toISOString(), name: q.name, address: q.address, market: r2.M.label, views: r2.views, quote: r2.quote, q: { ...q } }; const i = list.findIndex((x) => x.id === id); if (i >= 0) list[i] = rec; else list.unshift(rec); store(LS.saved, list.slice(0, 30)); saveDraft(); toast("Quote saved"); repaint(); };
      out.querySelector("#pcProposal").onclick = async () => {
        const b = out.querySelector("#pcProposal"); b.disabled = true;
        try { const p = await create("proposals", {}, ""); const { item } = await api("/proposals/" + encodeURIComponent(p.id), { method: "PATCH", body: buildProposal(q, r2, R2) }); upsert("proposals", item); toast("Proposal drafted from quote"); go("#/proposal/" + encodeURIComponent(item.id) + "/edit"); }
        catch (e) { toast(e.message); b.disabled = false; }
      };
      out.querySelectorAll("[data-load]").forEach((b) => (b.onclick = () => { const rec = load(LS.saved, []).find((x) => x.id === b.dataset.load); if (rec) { q = { ...BLANK(), ...rec.q, _id: rec.id }; saveDraft(); render(); toast("Quote loaded"); } }));
      out.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => { store(LS.saved, load(LS.saved, []).filter((x) => x.id !== b.dataset.del)); repaint(); }));
    };
    wireOut();
  } };
});

function resultsHTML(q, r, R, saved) {
  const first = (q.name || "").trim();
  return `
    <div class="tile navy"><div class="eyebrow">Design fee quote</div><div class="big money">${money(r.quote)}</div><div class="sub" style="color:#a9bde0">${esc(r.M.label)}${first ? ` · ${esc(first)}` : ""} · deposit ${money(r.deposit)} · valid ${R.valid_days} days</div></div>
    <div class="group">
      <div class="g-title"><span class="eyebrow">Breakdown</span><span class="subtle">${r.lines.length} line${r.lines.length === 1 ? "" : "s"}</span></div>
      ${r.lines.map((l) => `<div class="pc-line"><span>${esc(l.label)}${l.note ? `<span class="n">${esc(l.note)}</span>` : ""}</span><span class="a money">${money(l.amt)}</span></div>`).join("")}
      ${r.rounding ? `<div class="pc-line"><span>Rounded up to $${R.round_to}</span><span class="a money">${money(r.rounding)}</span></div>` : ""}
      <div class="pc-line tot"><span>Quote</span><span class="a money">${money(r.quote)}</span></div>
    </div>
    <div class="group">
      <div class="g-title"><span class="eyebrow">Check</span><span class="subtle">internal · not shown to client</span></div>
      <div class="pc-check"><div><span>Views</span><b>${r.views}</b></div><div><span>Per view, all in</span><b>${money(r.perView)}</b></div><div><span>Market floor</span><b style="color:${r.quote < r.M.band[0] ? "var(--amber)" : "var(--green)"}">${r.quote < r.M.band[0] ? "Under" : "OK"}</b></div></div>
      ${r.flags.map((f) => `<div class="pc-flag">! ${esc(f)}</div>`).join("")}
    </div>
    <div class="group">
      <div class="g-title"><span class="eyebrow">Market band</span><span class="subtle">${money(r.M.band[0])} – ${money(r.M.band[1])} published</span></div>
      <div class="pc-band"><div class="bar"><i style="left:${Math.round(r.pos * 100)}%"></i></div><div class="lbl"><span>Under market</span><span>In band</span><span>Premium</span></div><div class="subtle" style="font-size:11px;margin-top:8px;line-height:1.45">${esc(r.M.band_note)}</div></div>
    </div>
    <div class="group">
      <div class="g-title"><span class="eyebrow">Included</span></div>
      <div class="body-text" style="font-size:13px">${r.included.map((s) => "• " + esc(s)).join("\n")}</div>
    </div>
    <div class="group">
      <div class="g-title"><span class="eyebrow">Send</span></div>
      <div class="pc-actions"><button class="btn sm" id="pcProposal">Create proposal ↗</button><button class="btn ghost sm" id="pcCopyClient">Copy client message</button><button class="btn ghost sm" id="pcCopyInt">Copy breakdown</button><button class="btn ghost sm" id="pcSave">${q._id ? "Update saved" : "Save quote"}</button></div>
    </div>
    ${saved.length ? `<div class="group"><div class="g-title"><span class="eyebrow">Saved quotes</span><span class="subtle">${saved.length}</span></div>${saved.map((s) => `<div class="pc-saved"><button data-load="${s.id}" style="text-align:left;color:var(--text)"><div>${esc(s.name || "Unnamed")}${s.address ? ` · ${esc(s.address)}` : ""}</div><div class="subtle" style="font-size:11px">${esc(s.market)} · ${s.views} views · ${new Date(s.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div></button><span class="money">${money(s.quote)}</span><button class="x" data-del="${s.id}" title="Remove">×</button></div>`).join("")}</div>` : ""}`;
}

/* ---------- rate card editor ---------- */
function openRates() {
  const R = rates();
  const row = (path, label, val, step = 25) => `<div class="kv"><span class="k">${esc(label)}</span><span class="v"><input type="number" inputmode="decimal" step="${step}" data-p="${path}" value="${val}" /></span></div>`;
  const html = `
    <h3>Rate card</h3>
    <div class="subtle" style="font-size:12px;margin:-6px 0 10px;line-height:1.45">Stored on this device. One base fee per market, then a price per image or sheet. Changes apply to every new quote.</div>
    <div class="pc pc-rates" style="max-height:60vh;overflow:auto;border:1px solid var(--line);border-radius:12px">
      <div class="g-title"><span class="eyebrow">Rules</span></div>
      ${row("min_views", "Minimum views", R.min_views, 1)}${row("revisions_included", "Revision rounds included", R.revisions_included, 1)}${row("rush_pct", "Rush %", R.rush_pct, 5)}${row("deposit_pct", "Deposit %", R.deposit_pct, 5)}${row("valid_days", "Quote valid (days)", R.valid_days, 1)}${row("round_to", "Round up to ($)", R.round_to, 10)}
      ${Object.entries(R.markets).map(([k, m]) => `<div class="g-title"><span class="eyebrow">${esc(m.label)}</span></div>${row(`markets.${k}.base`, "Base fee (visit + design + model)", m.base, 100)}${row(`markets.${k}.hero`, "Hero view", m.hero)}${row(`markets.${k}.angle`, "Additional angle", m.angle)}${row(`markets.${k}.plan`, "Rendered floor plan, per level", m.plan)}${row(`markets.${k}.facade`, "Facade / exterior option", m.facade)}${row(`markets.${k}.sheet`, "Detail sheet", m.sheet)}${row(`markets.${k}.list`, "Sourced list", m.list)}${row(`markets.${k}.revision_view`, "Extra revision, per view", m.revision_view)}${row(`markets.${k}.site_visit`, "Construction site visit", m.site_visit)}${row(`markets.${k}.band.0`, "Market floor", m.band[0], 500)}${row(`markets.${k}.band.1`, "Market ceiling", m.band[1], 500)}`).join("")}
    </div>
    <div class="formbar" style="position:static;background:none;padding-bottom:0"><button class="btn" id="rSave">Save rates</button><button class="btn ghost" id="rReset">Reset to defaults</button><button class="btn ghost" id="rClose">Close</button></div>`;
  modal(html, (bg, close) => {
    bg.querySelector("#rClose").onclick = close;
    bg.querySelector("#rReset").onclick = () => confirmDanger(bg.querySelector("#rReset"), "Reset to defaults", () => { localStorage.removeItem(LS.rates); close(); render(); toast("Rate card reset"); });
    bg.querySelector("#rSave").onclick = () => {
      const over = {};
      bg.querySelectorAll("[data-p]").forEach((i) => { const v = Number(i.value); if (!Number.isFinite(v)) return; const parts = i.dataset.p.split("."); let o = over; parts.slice(0, -1).forEach((p) => (o = o[p] ||= {})); o[parts.at(-1)] = v; });
      if (over.markets) for (const k in over.markets) { const b = over.markets[k].band; if (b && !Array.isArray(b)) over.markets[k].band = [b[0] ?? R.markets[k].band[0], b[1] ?? R.markets[k].band[1]]; }
      store(LS.rates, over); close(); render(); toast("Rate card saved");
    };
  });
}
