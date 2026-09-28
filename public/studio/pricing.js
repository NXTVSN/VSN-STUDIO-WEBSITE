/* VSN Studio — Pricing: package + add-on quote calculator with hours check, market band, and one-click proposal. */
import { state, route, esc, money, toast, create, api, upsert, go, I, addDays, confirmDanger, render, modal } from "./core.js";

I.calc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/></svg>';

/* ---------- storage ---------- */
const LS = { rates: "vsn_pricing_rates", draft: "vsn_pricing_draft", saved: "vsn_pricing_saved" };
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
const store = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------- rate card (defaults; editable in the tab) ----------
   Sources: Codex package framework (Sep 2026), nvinterior pricing.json, and 2025–26 published NYC/NJ + drafting rates. */
export const DEFAULT_RATES = {
  version: 1,
  target_hourly: 95,
  round_to: 50,
  deposit_pct: 50,
  valid_days: 14,
  area_included: 700,
  review_area: 1200,
  zones_included: 4,
  rush_pct: 25,
  tiers: {
    direction: {
      label: "Design Direction", price: 2800, hours: 30, sf_rate: 1.5,
      tagline: "A clear plan they can develop themselves.",
      inc: { renders: 0, features: 0, categories: 8, options: 1, meetings: 1, revisions: 1, model: false },
      band: [1000, 3000], band_note: "NYC 2D basement plans $1,000–2,500 · KDS kitchen pkg $2,400 · Design Direction offers from $3,000",
      phases: [["Discover", "1 wk", 0.25], ["Concept", "1 wk", 0.4], ["Selections", "1 wk", 0.35]],
    },
    visual: {
      label: "Design + Visualization", price: 5000, hours: 53, sf_rate: 2.5,
      tagline: "A coordinated design they can see and shop.",
      inc: { renders: 3, features: 0, categories: 12, options: 1, meetings: 2, revisions: 1, model: true },
      band: [3000, 5500], band_note: "Kish basements $3,000–4,000 · NYC 3D basement plans $3,000–5,000 · NYC full-service room floor $5,000",
      phases: [["Discover", "1 wk", 0.15], ["Concept", "1 wk", 0.25], ["Design", "2 wks", 0.6]],
    },
    signature: {
      label: "Signature Interior Package", price: 7500, hours: 80, sf_rate: 3.5,
      tagline: "Contractor-ready: renders, custom features, drawings and every selection.",
      inc: { renders: 6, features: 3, categories: 15, options: 2, meetings: 2, revisions: 1, model: true },
      band: [5000, 12000], band_note: "Gilsenan NY basement from $6,500 · NYC single room $5,000–15,000 · kitchen designer premium tier w/ elevations + 3D $6,000–12,000",
      phases: [["Discover", "1 wk", 0.1], ["Concept", "1 wk", 0.2], ["Design", "2 wks", 0.4], ["Document", "1 wk", 0.3]],
    },
  },
  addons: {
    render:   { label: "Rendered view",                        unit: "view",     fee: 250,  hours: 1.5 },
    feature:  { label: "Custom feature (cabinetry / built-in)", unit: "feature",  fee: 750,  hours: 8,   desc: "Design + isometric + up to 2 dimensioned elevations, V.I.F." },
    sheet:    { label: "Extra detail sheet",                   unit: "sheet",    fee: 250,  hours: 1.5, desc: "Elevation, section or isometric beyond the 2 per feature." },
    category: { label: "Extra selection category",             unit: "category", fee: 40,   hours: 0.5 },
    meeting:  { label: "Extra design meeting",                 unit: "meeting",  fee: 250,  hours: 2 },
    revision: { label: "Extra revision round",                 unit: "round",    fee: 400,  hours: 4 },
    zone:     { label: "Additional zone / space",              unit: "zone",     fee: 350,  hours: 4 },
    measure:  { label: "Measure visit",                        unit: "visit",    fee: 350,  hours: 3 },
    site:     { label: "Construction site visit",              unit: "visit",    fee: 200,  hours: 2 },
    model:    { label: "3D model added to Design Direction",   unit: "space",    fee: 1200, hours: 10 },
  },
  complexity: {
    standard: { label: "Standard rooms",             mult: 1 },
    wet:      { label: "Kitchen or bath included",   mult: 1.2 },
    layout:   { label: "Layout / structural change", mult: 1.3 },
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
  name: "", address: "", email: "", phone: "", area: 700, zones: 4, tier: "signature", complexity: "standard",
  renders: null, features: null, sheets: 0, categories: null, meetings: null, revisions: null,
  measure: 0, site: 0, add_model: false, rush: false, outside: 0, outside_desc: "", discount: 0, notes: "",
  hours_override: "", enforce_floor: false,
});
let q = { ...BLANK(), ...load(LS.draft, {}) };
const saveDraft = () => store(LS.draft, q);

/* ---------- compute ---------- */
export function compute(q, R = rates()) {
  const T = R.tiers[q.tier] || R.tiers.signature; const inc = T.inc; const A = R.addons;
  const C = R.complexity[q.complexity] || R.complexity.standard;
  const n = (v, d = 0) => (v === null || v === undefined || v === "" ? d : Math.max(0, Number(v) || 0));
  const want = { renders: n(q.renders, inc.renders), features: n(q.features, inc.features), categories: n(q.categories, inc.categories), meetings: n(q.meetings, inc.meetings), revisions: n(q.revisions, inc.revisions) };
  const lines = [], flags = [];
  const push = (label, amt, hrs, note) => { if (amt || hrs) lines.push({ label, amt: Math.round(amt), hrs: Math.round((hrs || 0) * 10) / 10, note }); };

  push(`${T.label} package`, T.price, T.hours, T.tagline);
  if (C.mult !== 1) push(`Complexity: ${C.label} (×${C.mult})`, T.price * (C.mult - 1), T.hours * (C.mult - 1), "Applied to the package fee only");
  const overSf = Math.max(0, n(q.area) - R.area_included);
  if (overSf) push(`Area over ${R.area_included} sq ft (${overSf} sq ft × $${T.sf_rate})`, overSf * T.sf_rate, overSf / 50);
  const extraZones = Math.max(0, n(q.zones) - R.zones_included);
  if (extraZones) push(`${extraZones} additional zone${extraZones > 1 ? "s" : ""}`, extraZones * A.zone.fee, extraZones * A.zone.hours);
  const hasModel = inc.model || q.add_model;
  if (!inc.model && q.add_model) push(A.model.label, A.model.fee, A.model.hours);
  const ex = (k, w, i) => { const e = Math.max(0, w - i); if (e) push(`${e} extra ${A[k].unit}${e > 1 ? "s" : ""} (${A[k].label.toLowerCase()})`, e * A[k].fee, e * A[k].hours, i ? `${i} included` : ""); return e; };
  const exR = ex("render", want.renders, inc.renders);
  const exF = ex("feature", want.features, inc.features);
  if (n(q.sheets)) push(`${n(q.sheets)} extra detail sheet${n(q.sheets) > 1 ? "s" : ""}`, n(q.sheets) * A.sheet.fee, n(q.sheets) * A.sheet.hours);
  ex("category", want.categories, inc.categories);
  ex("meeting", want.meetings, inc.meetings);
  ex("revision", want.revisions, inc.revisions);
  if (n(q.measure)) push(`${n(q.measure)} measure visit${n(q.measure) > 1 ? "s" : ""}`, n(q.measure) * A.measure.fee, n(q.measure) * A.measure.hours);
  if (n(q.site)) push(`${n(q.site)} construction site visit${n(q.site) > 1 ? "s" : ""}`, n(q.site) * A.site.fee, n(q.site) * A.site.hours);

  const subtotal = lines.reduce((s, l) => s + l.amt, 0);
  let hours = lines.reduce((s, l) => s + (l.hrs || 0), 0);
  const rush = q.rush ? Math.round(subtotal * R.rush_pct / 100) : 0;
  if (rush) lines.push({ label: `Rush delivery (+${R.rush_pct}%)`, amt: rush, hrs: 0 });
  const discount = Math.min(n(q.discount), subtotal + rush);
  if (discount) lines.push({ label: "Discount", amt: -discount, hrs: 0 });
  let service = subtotal + rush - discount;
  if (q.hours_override !== "" && q.hours_override != null && Number(q.hours_override) > 0) hours = Number(q.hours_override);
  hours = Math.round(hours * 10) / 10;
  const hoursTarget = Math.round(hours * R.target_hourly);
  const rawGap = hoursTarget - service;
  const gap = rawGap > Math.max(100, service * 0.015) ? rawGap : 0; // ignore rounding-scale shortfalls
  let floorApplied = 0;
  if (q.enforce_floor && gap > 0) { floorApplied = gap; service = hoursTarget; lines.push({ label: `Hours floor (${hours} h × $${R.target_hourly})`, amt: gap, hrs: 0 }); }
  const outside = n(q.outside);
  const unrounded = service + outside;
  const quote = Math.ceil(unrounded / R.round_to) * R.round_to;
  const rounding = quote - unrounded;
  const effHourly = hours ? Math.round((quote - outside) / hours) : 0;
  const deposit = Math.round((quote - outside) * R.deposit_pct / 100);

  if (n(q.area) > R.review_area) flags.push(`Area is over ${R.review_area} sq ft: confirm scope before quoting.`);
  if (q.complexity !== "standard") flags.push("Kitchen / bath / layout work: review scope and drawings before sending.");
  if (want.renders > 0 && !hasModel) flags.push("Renders need a 3D model. Add the model or move to Design + Visualization.");
  if (want.features > 0 && !hasModel) flags.push("Custom features usually need the model for coordination. Consider Design + Visualization or Signature.");
  if (q.tier === "direction" && (exR + exF) * 1 > 0 && want.renders + want.features >= 4) flags.push("This many add-ons on Design Direction: the next tier may be cheaper for the client.");
  if (hours && !q.enforce_floor && gap > 0) flags.push(`Under the $${R.target_hourly}/h target by ${money(gap)} (${money(effHourly)}/h effective). Decide: trim scope, accept, or enable the hours floor.`);
  if (!hours) flags.push("Hours are required for the check.");
  if (q.rush) flags.push("Rush: confirm you can actually deliver in under 2 weeks before sending.");
  if (want.categories > 20) flags.push("Over 20 selection categories: consider a separate sourcing scope.");

  const band = T.band; const pos = Math.max(0, Math.min(1, (quote - outside - band[0] * 0.6) / (band[1] * 1.25 - band[0] * 0.6)));
  const included = [];
  included.push("Concept direction and mood board", "Proposed furniture / layout plan");
  if (hasModel) included.push("3D model of the space with colors and finishes applied");
  if (want.renders) included.push(`${want.renders} final rendered view${want.renders > 1 ? "s" : ""}`);
  if (want.features) included.push(`${want.features} custom feature${want.features > 1 ? "s" : ""} with isometric and up to 2 dimensioned elevations each (V.I.F.)`);
  if (n(q.sheets)) included.push(`${n(q.sheets)} additional detail sheet${n(q.sheets) > 1 ? "s" : ""}`);
  included.push(`Material and furniture selections: up to ${want.categories} categories, ${inc.options === 2 ? "up to two options" : "one recommendation"} per category, with links and pricing`);
  included.push(`${want.meetings} design meeting${want.meetings > 1 ? "s" : ""} (up to 60 min each)`, `${want.revisions} consolidated revision round${want.revisions > 1 ? "s" : ""}`);
  if (n(q.measure)) included.push(`${n(q.measure)} on-site measure visit${n(q.measure) > 1 ? "s" : ""}`);
  if (n(q.site)) included.push(`${n(q.site)} construction site visit${n(q.site) > 1 ? "s" : ""}`);
  included.push(q.tier === "signature" ? "Final design package PDF, drawings and selection schedules" : "Final design PDF and selection links");

  return { T, C, inc, want, lines, subtotal, rush, discount, service, outside, unrounded, quote, rounding, hours, hoursTarget, gap, floorApplied, effHourly, deposit, flags, band, pos, included, hasModel };
}

/* ---------- text outputs ---------- */
function clientText(q, r, R) {
  const first = (q.name || "").split(" ")[0] || "there";
  const bits = [q.area ? `${q.area} sq ft` : "", q.zones ? `${q.zones} zone${q.zones > 1 ? "s" : ""}` : "", r.want.features ? `${r.want.features} custom feature${r.want.features > 1 ? "s" : ""}` : ""].filter(Boolean).join(", ");
  return `Hi ${first},\n\nBased on what you've shared${bits ? ` (${bits})` : ""}, this fits our ${r.T.label}${q.address ? ` for ${q.address}` : ""}.\n\nDesign fee: ${money(r.quote)}${r.outside ? ` (includes ${money(r.outside)} ${q.outside_desc || "reimbursable costs"})` : ""}\n\nIncluded:\n${r.included.map((s) => `• ${s}`).join("\n")}\n\nNot included: furniture, materials, contractor costs, permits, shop drawings, procurement and construction management.\n\n${R.deposit_pct}% deposit (${money(r.deposit)}) to begin; balance on delivery of the final package. Scope is confirmed once I review your photos, dimensions and goals.\n\nBest,\n${state.settings.owner_name || "Noah"}\n${state.settings.studio_name || "Studio Visionary"}`;
}
function internalText(q, r, R) {
  return `QUOTE — ${q.name || "Unnamed"}${q.address ? ` · ${q.address}` : ""}\n${r.T.label} · ${q.complexity} · ${q.area} sq ft · ${q.zones} zones\n\n${r.lines.map((l) => `${l.label.padEnd(48)} ${money(l.amt).padStart(10)}${l.hrs ? `  ${l.hrs} h` : ""}`).join("\n")}\n${"Outside costs".padEnd(48)} ${money(r.outside).padStart(10)}\n${"Rounding".padEnd(48)} ${money(r.rounding).padStart(10)}\n${"QUOTE".padEnd(48)} ${money(r.quote).padStart(10)}\n\nHours ${r.hours} · target $${R.target_hourly}/h = ${money(r.hoursTarget)} · effective ${money(r.effHourly)}/h · gap ${money(r.gap)}\nDeposit ${money(r.deposit)} · valid ${R.valid_days} days\n${r.flags.length ? "\nFLAGS\n" + r.flags.map((f) => "! " + f).join("\n") : ""}`;
}

/* ---------- proposal ---------- */
function buildProposal(q, r, R) {
  const fee = r.quote - r.outside;
  const ph = r.T.phases.map(([name, weeks, w]) => ({ name, weeks, fee: Math.round(fee * w / R.round_to) * R.round_to, desc: "" }));
  const diff = fee - ph.reduce((s, p) => s + p.fee, 0); ph[ph.length - 1].fee += diff;
  const descs = { Discover: "Site walkthrough and measurements, client brief (needs, wish list, budget), existing conditions plan.", Concept: "Design direction and key features, mood boards and palette, one concept review call.", Selections: "Sourced material and furniture selections with links and pricing; final design PDF.", Design: `Rendered floor plan, 3D model with color selections${r.want.renders ? `, ${r.want.renders} photoreal rendering${r.want.renders > 1 ? "s" : ""}` : ""}, one design review round.`, Document: "Detail drawings for custom features, cabinetry elevations and notes, material list and furniture schedule with links and pricing, final package PDF." };
  ph.forEach((p) => (p.desc = descs[p.name] || ""));
  if (r.outside) ph.push({ name: "Reimbursable costs", weeks: "", fee: r.outside, desc: q.outside_desc || "Project-specific outside costs, billed at cost." });
  const terms = state.settings.proposal_terms || `${R.deposit_pct}% deposit (${money(r.deposit)}) to begin; balance due on delivery of the final package.\nOne approved design direction; ${r.want.revisions} consolidated revision round${r.want.revisions > 1 ? "s" : ""} at the agreed review stage. Additional rounds, views, features or meetings are quoted separately before work begins.\nSelections are recommendations and sourcing links; purchasing and coordination are separate services.\nDrawings are design-intent only. ${R.vif}\nThis proposal is valid for ${R.valid_days} days.`;
  return {
    title: `${r.T.label} — ${q.address || q.name || "Interior design"}`,
    client: { name: q.name, email: q.email, phone: q.phone, company: "", address: "" },
    project_address: q.address,
    project_summary: q.notes || `${r.T.tagline} ${q.area ? `${q.area} sq ft, ` : ""}${q.zones ? `${q.zones} zones.` : ""}`.trim(),
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
.pc .kv{padding:9px 16px}.pc .kv .k{font-size:12px;flex:1 1 auto;min-width:0;line-height:1.3}.pc .kv .v{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex:0 0 auto}
.pc .kv input[type=number]{min-width:0;width:82px;padding:8px 10px;font-size:15px;text-align:center;-moz-appearance:textfield}
.pc input[type=number]::-webkit-inner-spin-button,.pc input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.pc .kv input[type=text]{width:auto;min-width:0;flex:1;padding:8px 10px;font-size:14px;text-align:right}
.pc .kv select{min-width:0;max-width:210px;font-size:13px;padding:8px 32px 8px 10px}
.pc-step{width:34px;height:34px;border-radius:9px;border:1px solid var(--line-2);color:var(--text-2);font-size:18px;line-height:1;display:grid;place-items:center;flex:0 0 auto}.pc-step:hover{color:#fff;border-color:#fff}
.pc .inc{color:var(--muted);font-size:11px;margin-left:6px;white-space:nowrap}
.pc-tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px 16px 14px}
.pc-tier{padding:12px 10px;border-radius:12px;background:#0c0c0c;border:1px solid var(--line);text-align:left;color:var(--text-2)}.pc-tier .p{font-size:20px;font-weight:300;letter-spacing:-.02em;color:#fff;margin-top:4px}.pc-tier .l{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}.pc-tier.active{background:#fff;color:#000}.pc-tier.active .p{color:#000}
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
  const R = rates(); const r = compute(q, R);
  const saved = load(LS.saved, []);
  const num = (k, label, inc, opts = {}) => `
    <div class="kv"><span class="k">${label}${inc != null ? `<span class="inc">${inc} incl.</span>` : ""}</span><span class="v">
      <button class="pc-step" data-step="${k}" data-d="-1">−</button><input type="number" inputmode="numeric" min="0" step="${opts.step || 1}" data-k="${k}" value="${q[k] === null || q[k] === undefined ? (inc ?? "") : q[k]}" placeholder="${inc ?? ""}" />
      <button class="pc-step" data-step="${k}" data-d="1">+</button></span></div>`;
  const check = (k, label) => `<div class="kv"><span class="k">${label}</span><span class="v"><input type="checkbox" data-k="${k}" ${q[k] ? "checked" : ""} /></span></div>`;

  const html = `
    <div class="pc">
    <div class="pagehead">
      <div><div class="eyebrow dash">Sales</div><h1 class="display">Pricing</h1><div class="subtle" style="margin-top:6px">Package + add-ons, checked against hours and the NYC market. Fees only; goods, construction and taxes are separate.</div></div>
      <div class="actions"><button class="btn ghost sm" id="pcRates">Rate card</button><button class="btn ghost sm" id="pcReset">New quote</button></div>
    </div>
    <div class="tile navy pc-mobile"><div class="eyebrow">Quote</div><div class="big money" id="pcMobileTotal">${money(r.quote)}</div><div class="sub" style="color:#a9bde0" id="pcMobileSub">${esc(r.T.label)} · ${r.hours} h · ${money(r.effHourly)}/h</div></div>
    <div class="detail-grid">
      <div class="col">
        <div class="group">
          <div class="g-title"><span class="eyebrow">Job</span></div>
          <div class="form" style="padding:6px 16px 16px;gap:8px">
            <div class="row"><input data-k="name" value="${esc(q.name)}" placeholder="Client name" /><input data-k="address" value="${esc(q.address)}" placeholder="Project address" /></div>
            <div class="row"><input data-k="email" type="email" value="${esc(q.email)}" placeholder="Email (optional)" autocapitalize="off" /><input data-k="phone" type="tel" value="${esc(q.phone)}" placeholder="Phone (optional)" /></div>
            <textarea data-k="notes" style="min-height:64px" placeholder="What they told you: zones, wish list, custom pieces, timeline">${esc(q.notes)}</textarea>
          </div>
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Package</span><span class="subtle">Pick the closest fit, then adjust counts</span></div>
          <div class="pc-tiers">${Object.entries(R.tiers).map(([k, t]) => `<button class="pc-tier ${q.tier === k ? "active" : ""}" data-tier="${k}"><span class="l">${esc(t.label)}</span><div class="p">${money(t.price)}</div></button>`).join("")}</div>
          <div class="kv"><span class="k">Complexity</span><span class="v"><select data-k="complexity">${Object.entries(R.complexity).map(([k, c]) => `<option value="${k}" ${q.complexity === k ? "selected" : ""}>${esc(c.label)}</option>`).join("")}</select></span></div>
          ${num("area", "Designed area (sq ft)", null, { step: 10 })}
          ${num("zones", "Zones / spaces", R.zones_included)}
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Deliverables</span><span class="subtle">Blank = package default</span></div>
          ${num("renders", "Rendered views", r.inc.renders)}
          ${num("features", "Custom features", r.inc.features)}
          ${num("sheets", "Extra detail sheets", 0)}
          ${num("categories", "Selection categories", r.inc.categories)}
          ${num("meetings", "Design meetings", r.inc.meetings)}
          ${num("revisions", "Revision rounds", r.inc.revisions)}
          ${num("measure", "Measure visits", 0)}
          ${num("site", "Construction site visits", 0)}
          ${q.tier === "direction" ? check("add_model", `Add 3D model (${money(R.addons.model.fee)})`) : ""}
        </div>
        <div class="group">
          <div class="g-title"><span class="eyebrow">Adjustments</span></div>
          ${check("rush", `Rush delivery, under 2 weeks (+${R.rush_pct}%)`)}
          <div class="kv"><span class="k">Outside costs ($)</span><span class="v"><input type="number" inputmode="decimal" min="0" step="10" data-k="outside" value="${q.outside || ""}" placeholder="0" /></span></div>
          <div class="kv"><span class="k">Outside costs for</span><span class="v"><input type="text" data-k="outside_desc" value="${esc(q.outside_desc)}" placeholder="e.g. outsourced drafting" /></span></div>
          <div class="kv"><span class="k">Discount ($)</span><span class="v"><input type="number" inputmode="decimal" min="0" step="50" data-k="discount" value="${q.discount || ""}" placeholder="0" /></span></div>
          <div class="kv"><span class="k">Hours override</span><span class="v"><input type="number" inputmode="decimal" min="0" step="1" data-k="hours_override" value="${esc(q.hours_override)}" placeholder="${r.hours}" /></span></div>
          ${check("enforce_floor", `Raise quote to the hours floor ($${R.target_hourly}/h)`)}
        </div>
      </div>
      <div class="col" id="pcOut">${resultsHTML(q, r, R, saved)}</div>
    </div></div>`;

  return { html, mount() {
    const root = document.querySelector(".pc");
    const repaint = () => { const r2 = compute(q, rates()); document.getElementById("pcOut").innerHTML = resultsHTML(q, r2, rates(), load(LS.saved, [])); const mt = document.getElementById("pcMobileTotal"); if (mt) { mt.textContent = money(r2.quote); document.getElementById("pcMobileSub").textContent = `${r2.T.label} · ${r2.hours} h · ${money(r2.effHourly)}/h`; } wireOut(); };
    const setVal = (k, v) => { q[k] = v; saveDraft(); };
    root.addEventListener("input", (e) => {
      const k = e.target.dataset.k; if (!k) return;
      if (e.target.type === "checkbox") setVal(k, e.target.checked);
      else if (e.target.type === "number") setVal(k, e.target.value === "" ? (["renders", "features", "categories", "meetings", "revisions"].includes(k) ? null : k === "hours_override" ? "" : 0) : Number(e.target.value));
      else setVal(k, e.target.value);
      if (k === "complexity") render(); else repaint();
    });
    root.addEventListener("click", (e) => {
      const t = e.target.closest("[data-tier]"); if (t) { setVal("tier", t.dataset.tier); if (t.dataset.tier !== "direction") setVal("add_model", false); render(); return; }
      const s = e.target.closest("[data-step]"); if (s) { const k = s.dataset.step; const inp = root.querySelector(`input[data-k="${k}"]`); const cur = inp.value === "" ? Number(inp.placeholder) || 0 : Number(inp.value); const next = Math.max(0, cur + Number(s.dataset.d) * (Number(inp.step) || 1)); inp.value = next; setVal(k, next); repaint(); }
    });
    document.getElementById("pcReset").onclick = () => confirmDanger(pcReset, "New quote", () => { q = BLANK(); saveDraft(); render(); toast("Cleared"); });
    document.getElementById("pcRates").onclick = openRates;
    const wireOut = () => {
      const out = document.getElementById("pcOut"); const R2 = rates(); const r2 = compute(q, R2);
      const copy = async (txt, msg) => { try { await navigator.clipboard.writeText(txt); toast(msg); } catch { prompt("Copy", txt); } };
      out.querySelector("#pcCopyClient").onclick = () => copy(clientText(q, r2, R2), "Client message copied");
      out.querySelector("#pcCopyInt").onclick = () => copy(internalText(q, r2, R2), "Breakdown copied");
      out.querySelector("#pcSave").onclick = () => { const list = load(LS.saved, []); const id = q._id || crypto.randomUUID(); q._id = id; const rec = { id, at: new Date().toISOString(), name: q.name, address: q.address, tier: r2.T.label, quote: r2.quote, q: { ...q } }; const i = list.findIndex((x) => x.id === id); if (i >= 0) list[i] = rec; else list.unshift(rec); store(LS.saved, list.slice(0, 30)); saveDraft(); toast("Quote saved"); repaint(); };
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
    <div class="tile navy"><div class="eyebrow">Design fee quote</div><div class="big money">${money(r.quote)}</div><div class="sub" style="color:#a9bde0">${esc(r.T.label)}${first ? ` · ${esc(first)}` : ""} · deposit ${money(r.deposit)} · valid ${R.valid_days} days</div></div>
    <div class="group">
      <div class="g-title"><span class="eyebrow">Breakdown</span><span class="subtle">${r.lines.length} line${r.lines.length === 1 ? "" : "s"}</span></div>
      ${r.lines.map((l) => `<div class="pc-line"><span>${esc(l.label)}${l.note ? `<span class="n">${esc(l.note)}</span>` : ""}</span><span class="a money">${money(l.amt)}${l.hrs ? `<span class="n" style="text-align:right">${Math.round(l.hrs * 10) / 10} h</span>` : ""}</span></div>`).join("")}
      ${r.outside ? `<div class="pc-line"><span>Outside costs${q.outside_desc ? `<span class="n">${esc(q.outside_desc)}</span>` : ""}</span><span class="a money">${money(r.outside)}</span></div>` : ""}
      ${r.rounding ? `<div class="pc-line"><span>Rounded up to $${R.round_to}</span><span class="a money">${money(r.rounding)}</span></div>` : ""}
      <div class="pc-line tot"><span>Quote</span><span class="a money">${money(r.quote)}</span></div>
    </div>
    <div class="group">
      <div class="g-title"><span class="eyebrow">Hours check</span><span class="subtle">internal · not shown to client</span></div>
      <div class="pc-check"><div><span>Est. hours</span><b>${r.hours}</b></div><div><span>Effective</span><b>${money(r.effHourly)}/h</b></div><div><span>Target $${R.target_hourly}/h</span><b style="color:${r.gap ? "var(--amber)" : "var(--green)"}">${r.gap ? "−" + money(r.gap) : "OK"}</b></div></div>
      ${r.flags.map((f) => `<div class="pc-flag">! ${esc(f)}</div>`).join("")}
    </div>
    <div class="group">
      <div class="g-title"><span class="eyebrow">Market band</span><span class="subtle">${money(r.band[0])} – ${money(r.band[1])} published</span></div>
      <div class="pc-band"><div class="bar"><i style="left:${Math.round(r.pos * 100)}%"></i></div><div class="lbl"><span>Under market</span><span>In band</span><span>Premium</span></div><div class="subtle" style="font-size:11px;margin-top:8px;line-height:1.45">${esc(r.T.band_note)}</div></div>
    </div>
    <div class="group">
      <div class="g-title"><span class="eyebrow">Included</span></div>
      <div class="body-text" style="font-size:13px">${r.included.map((s) => "• " + esc(s)).join("\n")}</div>
    </div>
    <div class="group">
      <div class="g-title"><span class="eyebrow">Send</span></div>
      <div class="pc-actions"><button class="btn sm" id="pcProposal">Create proposal ↗</button><button class="btn ghost sm" id="pcCopyClient">Copy client message</button><button class="btn ghost sm" id="pcCopyInt">Copy breakdown</button><button class="btn ghost sm" id="pcSave">${q._id ? "Update saved" : "Save quote"}</button></div>
    </div>
    ${saved.length ? `<div class="group"><div class="g-title"><span class="eyebrow">Saved quotes</span><span class="subtle">${saved.length}</span></div>${saved.map((s) => `<div class="pc-saved"><button data-load="${s.id}" style="text-align:left;color:var(--text)"><div>${esc(s.name || "Unnamed")}${s.address ? ` · ${esc(s.address)}` : ""}</div><div class="subtle" style="font-size:11px">${esc(s.tier)} · ${new Date(s.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div></button><span class="money">${money(s.quote)}</span><button class="x" data-del="${s.id}" title="Remove">×</button></div>`).join("")}</div>` : ""}`;
}

/* ---------- rate card editor ---------- */
function openRates() {
  const R = rates();
  const row = (path, label, val, step = 1) => `<div class="kv"><span class="k">${esc(label)}</span><span class="v"><input type="number" inputmode="decimal" step="${step}" data-p="${path}" value="${val}" /></span></div>`;
  const html = `
    <h3>Rate card</h3>
    <div class="subtle" style="font-size:12px;margin:-6px 0 10px;line-height:1.45">Stored on this device. Defaults come from the Sep 2026 package framework, pricing.json and published NYC/NJ rates. Changes apply to every new quote.</div>
    <div class="pc pc-rates" style="max-height:60vh;overflow:auto;border:1px solid var(--line);border-radius:12px">
      <div class="g-title"><span class="eyebrow">Studio</span></div>
      ${row("target_hourly", "Target $/hour (internal)", R.target_hourly, 5)}${row("deposit_pct", "Deposit %", R.deposit_pct, 5)}${row("valid_days", "Quote valid (days)", R.valid_days)}${row("round_to", "Round up to ($)", R.round_to, 10)}${row("rush_pct", "Rush %", R.rush_pct, 5)}${row("area_included", "Area included (sq ft)", R.area_included, 50)}${row("review_area", "Flag review above (sq ft)", R.review_area, 50)}${row("zones_included", "Zones included", R.zones_included)}
      ${Object.entries(R.tiers).map(([k, t]) => `<div class="g-title"><span class="eyebrow">${esc(t.label)}</span></div>${row(`tiers.${k}.price`, "Package fee", t.price, 100)}${row(`tiers.${k}.hours`, "Budgeted hours", t.hours)}${row(`tiers.${k}.sf_rate`, "$/sq ft over included area", t.sf_rate, 0.5)}${row(`tiers.${k}.inc.renders`, "Renders included", t.inc.renders)}${row(`tiers.${k}.inc.features`, "Custom features included", t.inc.features)}${row(`tiers.${k}.inc.categories`, "Selection categories", t.inc.categories)}${row(`tiers.${k}.inc.meetings`, "Meetings", t.inc.meetings)}${row(`tiers.${k}.inc.revisions`, "Revision rounds", t.inc.revisions)}`).join("")}
      <div class="g-title"><span class="eyebrow">Add-ons</span></div>
      ${Object.entries(R.addons).map(([k, a]) => `${row(`addons.${k}.fee`, `${a.label} — fee / ${a.unit}`, a.fee, 25)}${row(`addons.${k}.hours`, `${a.label} — hours / ${a.unit}`, a.hours, 0.5)}`).join("")}
      <div class="g-title"><span class="eyebrow">Complexity multipliers</span></div>
      ${Object.entries(R.complexity).map(([k, c]) => row(`complexity.${k}.mult`, c.label, c.mult, 0.05)).join("")}
    </div>
    <div class="formbar" style="position:static;background:none;padding-bottom:0"><button class="btn" id="rSave">Save rates</button><button class="btn ghost" id="rReset">Reset to defaults</button><button class="btn ghost" id="rClose">Close</button></div>`;
  modal(html, (bg, close) => {
    bg.querySelector("#rClose").onclick = close;
    bg.querySelector("#rReset").onclick = () => confirmDanger(bg.querySelector("#rReset"), "Reset to defaults", () => { localStorage.removeItem(LS.rates); close(); render(); toast("Rate card reset"); });
    bg.querySelector("#rSave").onclick = () => {
      const over = {};
      bg.querySelectorAll("[data-p]").forEach((i) => { const v = Number(i.value); if (!Number.isFinite(v)) return; const parts = i.dataset.p.split("."); let o = over; parts.slice(0, -1).forEach((p) => (o = o[p] ||= {})); o[parts.at(-1)] = v; });
      store(LS.rates, over); close(); render(); toast("Rate card saved");
    };
  });
}
