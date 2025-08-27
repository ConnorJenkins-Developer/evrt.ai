/* ==========================================================================
   EVRT site – shared utilities (partials, nav, theme, reveal)
   ========================================================================== */
async function includePartials(){
  for (const n of document.querySelectorAll("[data-include]")) {
    const path = n.getAttribute("data-include");
    try { const res = await fetch(path); n.innerHTML = await res.text(); } catch(e){ /* ignore */ }
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
    const name = href.split("/").pop(); if (name === cur) a.classList.add("active");
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
window.addEventListener("DOMContentLoaded", async ()=>{
  await includePartials();
  setupNav(); setupTheme(); setupReveal();
  const y = document.getElementById("y"); if (y) y.textContent = new Date().getFullYear();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    document.querySelector(".bg-orbs")?.style.setProperty("animation","none");
  }
});

/* ==========================================================================
   EVRT Virtual Demo – powered preview, timing heatmap, schedule, analytics
   ========================================================================== */
(function(){
  const stage = document.querySelector(".demo-stage");
  if (!stage) return;

  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const steps = ["compose","timing","schedule","analytics"];

  // ---------- Tabs / view selection ----------
  function setView(v){
    stage.setAttribute("data-view", v);
    $$(".demo-tabs .btn").forEach(b => b.classList.toggle("primary", b.dataset.step===v));
  }
  $$(".demo-tabs .btn").forEach(btn => btn.addEventListener("click", ()=> setView(btn.dataset.step)));
  window.addEventListener("keydown",(e)=>{
    if (e.target.closest("textarea,input")) return;
    if (["1","2","3","4"].includes(e.key)) setView(steps[+e.key-1]);
    if ((e.ctrlKey||e.metaKey) && e.key==="Enter") $("#btn-predict")?.click();
    if (e.key.toLowerCase()==="s") $("#btn-schedule")?.click();
  });
  setView("timing");

  // ---------- Inputs / preview ----------
  const textArea = $("#post-text");
  const preview  = $("#preview");
  const phonePrev = $("#post-preview");
  function syncPreview(){
    const v = textArea?.value.trim() || "Announcing EVRT Social AI — create, predict, and scale content.";
    if (preview) preview.textContent = v;
    if (phonePrev) phonePrev.textContent = v;
  }
  ["input","change"].forEach(ev => textArea?.addEventListener(ev, syncPreview));
  syncPreview();

  $$("#chips-platforms .chip").forEach(chip=>{
    chip.addEventListener("click", ()=>{ chip.classList.toggle("is-on"); paint(); });
  });
  $$("#chips-tone .chip").forEach(chip=>{
    chip.addEventListener("click", ()=>{
      $$("#chips-tone .chip").forEach(c=>c.classList.remove("is-on"));
      chip.classList.add("is-on");
      paint();
    });
  });
  $("#s-clarity")?.addEventListener("input", paint);
  $("#s-energy")?.addEventListener("input", paint);
  $("#s-depth")?.addEventListener("input", paint);

  $("#btn-variant")?.addEventListener("click", ()=>{
    const base = textArea.value.trim() || "EVRT Social AI makes creative scale predictable.";
    const tone = document.querySelector("#chips-tone .chip.is-on")?.dataset.tone || "pro";
    const openers = {
      pro: ["Here’s the plan:","In short:","What changes:","Signal > noise:"],
      playful: ["BTW —","Fun fact:","Hot take:","ICYMI:"],
      bold: ["Real talk:","Look —","Heads up:","Let’s be blunt:"]
    }[tone];
    textArea.value = `${openers[Math.floor(Math.random()*openers.length)]} ${base}`;
    syncPreview();
  });

  // ---------- KPI helpers ----------
  function animateNumber(el, value, suffix=""){
    if (!el) return;
    const start = Number((el.dataset.v||"0").replace(/[^\d.]/g,"")) || 0;
    const end = Number(value);
    const t0 = performance.now(), dur = 600;
    function tick(t){
      const k = Math.min(1,(t-t0)/dur);
      const v = start + (end-start)*(0.5-0.5*Math.cos(Math.PI*k));
      el.textContent = suffix==="%" ? `${v.toFixed(0)}%` : v.toLocaleString();
      if (k<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    el.dataset.v = String(end);
  }
  function pulse(node){
    node.animate([{transform:"scale(1)"},{transform:"scale(1.01)"},{transform:"scale(1)"}],{duration:300});
  }

  // ---------- Heatmap + scanline ----------
  const heat = $("#heatmap"), scan = $("#scanline");
  if (!heat || !scan) return;
  const hctx = heat.getContext("2d"), sctx = scan.getContext("2d");

  function sizeCanvases(){
    [heat, scan].forEach(c=>{
      const r = c.getBoundingClientRect();
      const dpr = Math.max(1, devicePixelRatio||1);
      c.width  = Math.floor(r.width*dpr);
      c.height = Math.floor(Math.max(380,r.height)*dpr);
      c.getContext("2d").setTransform(dpr,0,0,dpr,0,0);
    });
  }
  window.addEventListener("resize", sizeCanvases, {passive:true});

  function paint(jiggle=false){
    sizeCanvases();
    const w = heat.clientWidth, h = Math.max(380, heat.clientHeight);
    hctx.clearRect(0,0,w,h);
    const cols=24, rows=7, cw=w/cols, ch=h/rows;

    const clarity=+($("#s-clarity")?.value||70), energy=+($("#s-energy")?.value||60), depth=+($("#s-depth")?.value||60);
    const tone = document.querySelector("#chips-tone .chip.is-on")?.dataset.tone || "pro";
    const plats = $$("#chips-platforms .chip.is-on").map(c=>c.dataset.pl);
    const seed = (clarity*3 + energy*5 + depth*7 + tone.length*11 + plats.join("").length*13) % 997;

    const rnd = (i,j)=> {
      const x = Math.sin((i*37 + j*57 + seed)*0.01)*43758.5453;
      return x - Math.floor(x);
    };

    // cells
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const base = rnd(r,c);
        const hourBias = Math.sin((c/24)*Math.PI) * 0.6 + 0.22; // evenings ↑
        const platBoost = plats.length>0 ? 0.08*plats.length : 0.04;
        const jitter = jiggle ? (Math.random()*0.06) : 0;
        const val = Math.min(1, base*0.35 + hourBias + platBoost + energy*0.003 + jitter);

        const hue = 275 + (195-275)*val, alpha = 0.12 + val*0.38;
        hctx.fillStyle = `hsla(${hue} 90% 55% / ${alpha})`;
        const pad = 2;
        hctx.fillRect(c*cw+pad, r*ch+pad, cw-2*pad, ch-2*pad);
      }
    }
    // grid lines
    hctx.strokeStyle = "rgba(255,255,255,0.06)";
    for(let c=1;c<cols;c++){ hctx.beginPath(); hctx.moveTo(c*cw,0); hctx.lineTo(c*cw,h); hctx.stroke(); }
    for(let r=1;r<rows;r++){ hctx.beginPath(); hctx.moveTo(0,r*ch); hctx.lineTo(w,r*ch); hctx.stroke(); }

    // scanline
    sctx.clearRect(0,0,w,h);
    let x = 0;
    const scanDur = 2200;
    const start = performance.now();
    (function loop(t){
      const k = Math.min(1,(t-start)/scanDur);
      x = k*w;
      sctx.clearRect(0,0,w,h);
      const grad = sctx.createLinearGradient(x-18,0,x+18,0);
      grad.addColorStop(0,"rgba(255,255,255,0)");
      grad.addColorStop(0.5,"rgba(255,255,255,0.25)");
      grad.addColorStop(1,"rgba(255,255,255,0)");
      sctx.fillStyle = grad; sctx.fillRect(x-18,0,36,h);
      if (k<1) requestAnimationFrame(loop);
    })(start);
  }

  // ---------- Schedule ----------
  const grid = $("#schedule-grid");
  const week = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const slots = []; // {day,hour,text}

  function buildGrid(){
    if (!grid) return;
    grid.innerHTML = "";
    const rect = grid.getBoundingClientRect();
    const cw = rect.width/24, ch = rect.height/7;

    for(let r=0;r<7;r++){
      for(let c=0;c<24;c++){
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.style.gridRow = (r+1);
        cell.style.gridColumn = (c+1);
        cell.title = `${week[r]} ${String(c).padStart(2,"0")}:00`;
        cell.addEventListener("click", ()=>{
          addSlot(r,c, (textArea?.value.trim() || "Post"));
          setView("schedule");
        });
        grid.appendChild(cell);
      }
    }

    // existing slots
    slots.forEach(s => {
      const el = document.createElement("div");
      el.className = "slot";
      el.textContent = `${week[s.day]} ${String(s.hour).padStart(2,"0")}:00`;
      el.style.left = `${s.hour*cw + 6}px`;
      el.style.top  = `${s.day*ch + 6}px`;
      grid.appendChild(el);
    });
  }

  function addSlot(day,hour,text){
    slots.push({day,hour,text});
    buildGrid();
    drawSparks();
  }
  $("#btn-clear")?.addEventListener("click", ()=>{ slots.length=0; buildGrid(); drawSparks(); });

  $("#btn-schedule")?.addEventListener("click", ()=>{
    // choose “best minute” roughly from heat map bias
    const bestHour = 19 + Math.floor(Math.random()*3) - 1; // 6–8pm cluster
    const day = Math.floor(Math.random()*7);
    addSlot(day, Math.max(0, Math.min(23,bestHour)), textArea?.value.trim() || "Post");
    setView("schedule");
  });

  // ---------- Analytics (sparklines) ----------
  function drawSpark(canvas, seed){
    const ctx = canvas.getContext("2d");
    const r = canvas.getBoundingClientRect();
    const dpr = Math.max(1, devicePixelRatio||1);
    canvas.width = Math.floor(r.width*dpr); canvas.height = Math.floor(r.height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,r.width,r.height);

    ctx.strokeStyle = "rgba(255,255,255,.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const n = 32;
    for (let i=0;i<n;i++){
      const t = i/(n-1);
      const base = Math.sin((t*3 + seed)*Math.PI)*.35 + .5;
      const lift = Math.min(1, .15*slots.length);
      const y = (1 - Math.min(1, base + lift)) * (r.height-6) + 3;
      const x = t * (r.width-6) + 3;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  function drawSparks(){
    drawSpark($("#spark-reach"), 0.1);
    drawSpark($("#spark-ctr"),   0.6);
    drawSpark($("#spark-cons"),  0.9);
  }

  // ---------- Predict button ----------
  const meters = {
    reach: $("#kpi-reach"), ctr: $("#kpi-ctr"), consistency: $("#kpi-consistency")
  };
  $("#btn-predict")?.addEventListener("click", ()=>{
    const plats = $$("#chips-platforms .chip.is-on").length || 1;
    const clarity = +($("#s-clarity")?.value||70);
    const energy  = +($("#s-energy")?.value||60);
    const depth   = +($("#s-depth")?.value||60);

    const reach = Math.round( (clarity*0.6 + energy*0.45 + depth*0.25) * plats * 3 );
    const ctr   = (1.1 + (energy*0.012 + clarity*0.009)).toFixed(1);
    const cons  = Math.min(99, Math.round( 55 + depth*0.3 + plats*6 ));

    animateNumber(meters.reach, reach);
    animateNumber(meters.ctr, ctr, "%");
    animateNumber(meters.consistency, cons, "%");

    setView("timing");
    pulse(stage.querySelector(".stage-canvas"));
    paint(true); drawSparks();
  });

  // ---------- init ----------
  sizeCanvases(); paint(false); buildGrid(); drawSparks();
})();
