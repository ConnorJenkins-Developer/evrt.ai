/* Shared includes + nav + theme + reveal (unchanged from earlier) */
async function includePartials(){
  for (const n of document.querySelectorAll("[data-include]")) {
    const path = n.getAttribute("data-include");
    try { const res = await fetch(path); n.innerHTML = await res.text(); } catch {}
  }
}
function setupNav(){
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");
  if (menuBtn && navLinks) menuBtn.addEventListener("click", ()=>{
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  const cur = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("header nav a").forEach(a=>{
    const href = a.getAttribute("href"); if (!href) return;
    const name = href.split("/").pop();
    if (name === cur) a.classList.add("active");
  });
}
function setupTheme(){
  const root = document.documentElement;
  const saved = localStorage.getItem("evrt-theme");
  if (saved) root.setAttribute("data-theme", saved);
  document.getElementById("themeBtn")?.addEventListener("click", ()=>{
    const cur = root.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("evrt-theme", next);
  });
}
function setupReveal(){
  const els = document.querySelectorAll("[data-reveal]");
  const io = new IntersectionObserver((entries)=>{
    for (const e of entries) if (e.isIntersecting) e.target.classList.add("in");
  }, {threshold:.08});
  els.forEach(el=>io.observe(el));
}

/* ---------------------------------------------------------
   Interactive Studio (unified demo)
   -------------------------------------------------------*/
function seedRand(seed=1){
  let t = seed >>> 0;
  return ()=> (t = (t*1664525 + 1013904223) >>> 0) / 4294967296;
}

// Faux “model” state
const state = {
  step: "compose",
  platforms: new Set(["x"]),
  tone: "professional",
  sliders: { clarity:72, energy:64, depth:58 },
  text: "",
  variants: [],
  bestMinute: null,
  schedule: [],
  previewPlatform: "facebook",
  seed: 1337,
};

function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

// Step switching
function setStep(step){
  state.step = step;
  $all(".step").forEach(b=>b.classList.toggle("is-active", b.dataset.step===step));
  $all("[data-pane]").forEach(p=>p.classList.toggle("hidden", p.dataset.pane!==step));
  $all("[data-canvas]").forEach(p=>p.classList.toggle("hidden", p.dataset.canvas!==step));
}

// Platforms & tone
function togglePill(el, group, single=false){
  if (single){
    $all(".pill", group).forEach(p=>p.classList.remove("is-on"));
    el.classList.add("is-on");
  } else {
    el.classList.toggle("is-on");
  }
}

// Fake variant generation
function generateVariants(){
  const txt = state.text.trim() || "Announcing EVRT Social AI — create, schedule, and measure with predictive intelligence.";
  const tones = {
    professional: ["Clarity-first", "Outcome-driven", "Enterprise-ready"],
    playful: ["Let’s ship it", "Make scroll-stoppers", "Zero fluff"],
    bold: ["Go bigger", "Win the feed", "Built for velocity"]
  }[state.tone];

  const r = seedRand(state.seed + txt.length);
  const v = [];
  for (let i=0;i<6;i++){
    const hook = tones[i % tones.length];
    const spice = ["🚀","✨","⚡","🔥","🧠","📈"][Math.floor(r()*6)];
    v.push({
      id: `${Date.now()}-${i}`,
      text: `${hook}: ${txt} ${spice}`,
      score: Math.round(60 + r()*40),
      tone: state.tone
    });
  }
  state.variants = v;
  renderCatalog();
  renderTray();
}

// Heatmap + best minute (simulated)
function buildHeatmap(){
  const root = $("#heatmap");
  if (!root) return;
  root.innerHTML = "";
  const r = seedRand(state.seed + state.sliders.clarity*3 + state.sliders.energy*7 + state.sliders.depth*13);
  let best = { day:0, hour:0, val:0 };
  for (let d=0; d<7; d++){
    for (let h=0; h<24; h++){
      const base = Math.sin((h/24)*Math.PI) * Math.cos((d/7)*Math.PI*1.3);
      const noise = (r()-.5)*.4;
      const toneBias = state.tone==="bold" ? .12 : state.tone==="playful" ? .06 : 0;
      const val = Math.max(0, base + noise + toneBias + (state.sliders.energy-50)/400);
      const cell = document.createElement("div");
      cell.className = "hm-cell";
      cell.style.background = `linear-gradient(180deg, rgba(0,0,0,.1), rgba(255,255,255,.05)),
        radial-gradient(60% 60% at 50% 50%, hsl(var(--accent)/${(val*.9).toFixed(2)}), transparent 65%)`;
      cell.setAttribute("data-val", val.toFixed(3));
      if (val > best.val){ best = { day:d, hour:h, val }; }
      root.appendChild(cell);
    }
  }
  // mark best
  const idx = best.day*24 + best.hour;
  const bestCell = root.children[idx];
  if (bestCell){
    bestCell.classList.add("hot");
    const dot = document.createElement("div");
    dot.className = "hm-dot"; bestCell.appendChild(dot);
  }
  state.bestMinute = best;
  $("#bestMinuteText").textContent = `Best minute: ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][best.day]} ${String(best.hour).padStart(2,"0")}:00 • score ${(best.val*100|0)}`;
  renderTopWindows();
  renderSparkline();
}

// Top windows list
function renderTopWindows(){
  const list = $("#topWindows");
  if (!list) return;
  list.innerHTML = "";
  const r = seedRand(state.seed + 900);
  const wins = [];
  for (let i=0;i<6;i++){
    const d = Math.floor(r()*7), h = Math.floor(r()*24), s = 60 + Math.floor(r()*35);
    wins.push({ day:d, hour:h, score:s });
  }
  wins.sort((a,b)=>b.score-a.score);
  wins.slice(0,5).forEach(w=>{
    const li = document.createElement("li");
    li.textContent = `${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][w.day]} ${String(w.hour).padStart(2,"0")}:00 — score ${w.score}`;
    li.className = "row"; li.style.gap = "8px";
    const chip = document.createElement("button"); chip.className="chip sch"; chip.textContent="Add";
    chip.onclick = ()=> addSchedule(w);
    li.appendChild(chip);
    list.appendChild(li);
  });
}

// Sparkline
function renderSparkline(){
  const el = $("#sparkline"); if (!el) return;
  const r = seedRand(state.seed + 444);
  const pts = Array.from({length:30}, (_,i)=>{
    const t = i/29;
    const y = 0.5 + 0.35*Math.sin(t*3.14*1.6 + r()*2) + (state.sliders.clarity-50)/300;
    return { x: i*(300/29), y: 70 - y*65 };
  });
  const d = pts.map((p,i)=> (i?"L":"M")+p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
  el.innerHTML = `<path d="${d}" fill="none" stroke="hsl(var(--accent))" stroke-width="2"/>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="hsl(var(--accent)/.35)"/><stop offset="100%" stop-color="transparent"/>
                  </linearGradient>
                  <path d="${d} L300,80 L0,80 Z" fill="url(#g)" opacity=".5"/>`;
}

// Schedule
function addSchedule(w){
  state.schedule.push(w);
  renderScheduleChips();
  renderWeekGrid();
}
function renderScheduleChips(){
  const el = $("#scheduleChips"); if (!el) return;
  el.innerHTML = "";
  state.schedule.forEach((s,idx)=>{
    const b = document.createElement("button");
    b.className="chip sch"; b.textContent = `${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][s.day]} ${String(s.hour).padStart(2,"0")}:00`;
    b.onclick = ()=>{ state.schedule.splice(idx,1); renderScheduleChips(); renderWeekGrid(); };
    el.appendChild(b);
  });
}
function renderWeekGrid(){
  const el = $("#weekGrid"); if (!el) return;
  el.innerHTML = "";
  for (let d=0; d<7; d++){
    const day = document.createElement("div"); day.className="day";
    day.innerHTML = `<div class="title">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]}</div>`;
    state.schedule.filter(s=>s.day===d).forEach(s=>{
      const span = document.createElement("span");
      span.className="slot"; span.textContent = `${String(s.hour).padStart(2,"0")}:00`;
      day.appendChild(span);
    });
    el.appendChild(day);
  }
}

// Catalog & tray
function renderCatalog(){
  const el = $("#catalog"); if (!el) return;
  el.innerHTML = "";
  state.variants.forEach(v=>{
    const tile = document.createElement("div");
    tile.className="tile";
    tile.innerHTML = `<div>${v.text}</div><div class="meta"><span>Score ${v.score}</span><span>•</span><span>${v.tone}</span></div>`;
    tile.onclick = ()=> setPreviewText(v.text);
    el.appendChild(tile);
  });
}
function renderTray(){
  const el = $("#variantsTray"); if (!el) return;
  el.innerHTML = "";
  state.variants.slice(0,6).forEach(v=>{
    const m = document.createElement("div");
    m.className="mini"; m.textContent = v.text.slice(0,140);
    m.onclick = ()=> setPreviewText(v.text);
    el.appendChild(m);
  });
}

// Preview
function setPreviewText(text){
  state.text = text;
  renderPreview();
  updateKPIs();
}
function previewCard(platform, text){
  const brand = platform==="facebook" ? { name:"EVRT", badge:"Facebook", cls:"fb" } :
                platform==="instagram" ? { name:"evrt.ai", badge:"Instagram", cls:"ig" } :
                { name:"EVRT", badge:"TikTok", cls:"tk" };
  return `
  <article class="feed-card ${brand.cls}">
    <div class="feed-head">
      <div class="avatar"></div>
      <div class="handle">${brand.name}</div>
      <span class="badge">${brand.badge}</span>
    </div>
    <div class="feed-body">
      <div>${(text||"Your post preview will appear here…").replace(/\n/g,"<br/>")}</div>
      <div class="feed-media"></div>
    </div>
  </article>`;
}
function renderPreview(){
  const mount = $("#previewMount"); if (!mount) return;
  mount.innerHTML = previewCard(state.previewPlatform, state.text);
}

// KPIs (quick + preview)
function updateKPIs(){
  const base = (state.sliders.clarity + state.sliders.energy + state.sliders.depth)/3;
  const toneBump = state.tone==="bold" ? 8 : state.tone==="playful" ? 4 : 0;
  const reach = Math.round(1000 + base*25 + toneBump*20);
  const ctr = (2 + base/80 + (state.tone==="professional"? .2: .35)).toFixed(1)+"%";
  const conf = (60 + base/3 | 0) + "%";
  const ids = [["kpiReach","kpiCtr","kpiConf"],["pvReach","pvCtr","pvConf"]];
  ids.forEach(([a,b,c])=>{
    const A=$("#"+a),B=$("#"+b),C=$("#"+c);
    if (A) A.textContent = reach.toLocaleString();
    if (B) B.textContent = ctr;
    if (C) C.textContent = conf;
  });
}

// Charts (analytics)
function miniLine(elId, seedOffset=0, hueOffset=0){
  const el = $("#"+elId); if (!el) return;
  const r = seedRand(state.seed + seedOffset + state.sliders.energy);
  const H = 110, W = 320, N = 24;
  const pts = Array.from({length:N}, (_,i)=>{
    const t = i/(N-1);
    const y = 0.52 + 0.34*Math.sin(t*3.14*1.8 + r()*2) + (state.sliders.depth-50)/320;
    return { x: i*(W/(N-1)), y: H - y*H*0.8 };
  });
  const d = pts.map((p,i)=> (i?"L":"M")+p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
  el.innerHTML =
   `<defs>
      <linearGradient id="lg${elId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="hsl(${252+hueOffset} 86% 62% / .35)"/>
        <stop offset="100%" stop-color="transparent"/>
      </linearGradient>
    </defs>
    <path d="${d}" fill="none" stroke="hsl(${252+hueOffset} 86% 62%)" stroke-width="2"/>
    <path d="${d} L ${W},${H} 0,${H} Z" fill="url(#lg${elId})" opacity=".7"/>`;
}
function renderAnalytics(){
  miniLine("chartEng", 21, 0);
  miniLine("chartCtr", 55, -30);
  miniLine("chartQual", 89, 40);
}

/* ---------- Boot ---------- */
function setupStudio(){
  const root = document.getElementById("studio");
  if (!root) return;

  // Steps
  $all(".step").forEach(b=>{
    b.addEventListener("click", ()=>{
      setStep(b.dataset.step);
      if (state.step==="timing") { buildHeatmap(); }
      if (state.step==="schedule") { renderWeekGrid(); }
      if (state.step==="analytics") { updateKPIs(); renderAnalytics(); }
    });
  });
  setStep("compose");

  // Platforms
  const platforms = $("#platforms");
  platforms.addEventListener("click", e=>{
    const t = e.target.closest(".pill"); if (!t) return;
    togglePill(t, platforms, false);
    const p = t.dataset.platform;
    if (t.classList.contains("is-on")) state.platforms.add(p);
    else state.platforms.delete(p);
  });

  // Tone
  const tone = $("#tone");
  tone.addEventListener("click", e=>{
    const t = e.target.closest(".pill"); if (!t) return;
    togglePill(t, tone, true);
    state.tone = t.dataset.tone;
    updateKPIs();
  });

  // Sliders
  ["clarity","energy","depth"].forEach(id=>{
    $("#"+id).addEventListener("input", e=>{
      state.sliders[id] = +e.target.value;
      updateKPIs();
    });
  });

  // Compose input
  const postInput = $("#postInput");
  postInput.addEventListener("input", e=>{ state.text = e.target.value; });
  postInput.addEventListener("keydown", e=>{
    if ((e.metaKey||e.ctrlKey) && e.key==="Enter"){ setPreviewText(state.text); }
  });

  $("#genVariant").addEventListener("click", generateVariants);
  $("#predictBtn").addEventListener("click", ()=>{ setStep("timing"); buildHeatmap(); });

  // Preview platform
  const pv = $("#previewPlatform");
  pv.addEventListener("click", e=>{
    const t = e.target.closest(".pill"); if (!t) return;
    togglePill(t, pv, true);
    state.previewPlatform = t.dataset.pv;
    renderPreview();
  });
  $("#clearPreview").addEventListener("click", ()=>{ state.text=""; renderPreview(); });

  // Initial render
  generateVariants();
  renderPreview();
  updateKPIs();
}

window.addEventListener("DOMContentLoaded", async ()=>{
  await includePartials();
  setupNav(); setupTheme(); setupReveal();
  const y = document.getElementById("y"); if (y) y.textContent = new Date().getFullYear();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    document.querySelector(".bg-orbs")?.style.setProperty("animation","none");
  }
  setupStudio();
});
