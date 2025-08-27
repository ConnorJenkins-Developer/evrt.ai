/* ---------------- Partials, nav, theme, reveal ---------------- */
async function includePartials(){
  for (const n of document.querySelectorAll("[data-include]")) {
    const path = n.getAttribute("data-include");
    try { const res = await fetch(path); n.innerHTML = await res.text(); } catch {}
  }
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
function markActiveLink(){
  const cur = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("header nav a").forEach(a=>{
    const href = a.getAttribute("href"); if (!href) return;
    const name = href.split("/").pop();
    if (name === cur) a.classList.add("active");
  });
}
function setupNav(){
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");
  const overlay = document.getElementById("navOverlay");
  if (!menuBtn || !navLinks || !overlay) return;

  const open = () => {
    document.body.classList.add("nav-open");
    menuBtn.setAttribute("aria-expanded","true");
    overlay.hidden = false;
    document.documentElement.style.overflow = "hidden";
  };
  const close = () => {
    document.body.classList.remove("nav-open");
    menuBtn.setAttribute("aria-expanded","false");
    overlay.hidden = true;
    document.documentElement.style.overflow = "";
  };
  const toggle = () => (document.body.classList.contains("nav-open") ? close() : open());

  menuBtn.addEventListener("click", toggle);
  overlay.addEventListener("click", close);
  window.addEventListener("keydown",(e)=>{ if(e.key==="Escape" && document.body.classList.contains("nav-open")) close(); });
  const mq = window.matchMedia("(min-width: 961px)");
  mq.addEventListener?.("change", e=>{ if (e.matches) close(); });
}

/* ---------------- Utilities ---------------- */
function hash(s){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0;}
function rng(seed){ let t=seed>>>0; return ()=>{ t^=t<<13; t^=t>>>17; t^=t<<5; return (t>>>0)/2**32; }; }
const label = p => ({x:"X",linkedin:"LinkedIn",instagram:"Instagram",tiktok:"TikTok"}[p]||"X");
function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

/* ---------------- Demo Pro ---------------- */
function setupDemoPro(){
  const root = document.getElementById("evrtDemoPro");
  if (!root) return;

  /* Tabs */
  root.querySelectorAll(".demo-tabs .tab").forEach(b=>{
    b.addEventListener("click", ()=>{
      root.querySelectorAll(".demo-tabs .tab").forEach(x=>x.classList.remove("active"));
      root.querySelectorAll(".demo-panel").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      root.querySelector(`.demo-panel[data-panel="${b.dataset.tab}"]`)?.classList.add("active");
    });
  });

  /* Elements */
  const platforms = root.querySelector("#dPlatforms");
  const tone = root.querySelector("#dTone");
  const txt = root.querySelector("#dText");
  const count = root.querySelector("#dCount");
  const variantBtn = root.querySelector("#dVariant");
  const predictBtn = root.querySelector("#dPredict");
  const platPill = root.querySelector("#dPlatPill");
  const rec = root.querySelector("#dRec");
  const copy = root.querySelector("#dCopy");
  const media = root.querySelector("#dMedia");
  const hints = root.querySelector("#dHints");
  const tags = root.querySelector("#dTags");
  const spark = root.querySelector("#dSpark");
  const kReach = root.querySelector("#kReach");
  const kCtr = root.querySelector("#kCtr");
  const kConf = root.querySelector("#kConf");

  const heat = root.querySelector("#dHeat");
  const autoPick = root.querySelector("#dAutoPick");
  const applySchedule = root.querySelector("#dApplySchedule");

  const queueTable = root.querySelector("#dQueue tbody");
  const downloadBtn = root.querySelector("#dDownload");
  const clearBtn = root.querySelector("#dClear");

  const bars = root.querySelector("#dBars");
  const abA = root.querySelector("#dA");
  const abB = root.querySelector("#dB");
  const pickWinner = root.querySelector("#dPickWinner");

  const sClarity = root.querySelector("#dSClarity");
  const sEnergy  = root.querySelector("#dSEnergy");
  const sDepth   = root.querySelector("#dSDepth");

  let currentPlatform = "x";
  let selectedPlatforms = new Set(["x"]);
  let heatSelected = new Set(); // "d-hh:mm" keys clicked
  let queue = [];

  /* Platform chips (multi-select) */
  platforms.addEventListener("click",(e)=>{
    const b = e.target.closest(".chip[data-platform]");
    if(!b) return;
    const p = b.dataset.platform;
    if(b.classList.contains("selected")){
      if(selectedPlatforms.size>1){ b.classList.remove("selected"); selectedPlatforms.delete(p); }
    } else { b.classList.add("selected"); selectedPlatforms.add(p); currentPlatform = p; }
    platPill.textContent = label([...selectedPlatforms][0]);
    // quick re-eval
    predictNow();
  });

  /* Tone chips (single-select) */
  tone.addEventListener("click",(e)=>{
    const b = e.target.closest(".chip[data-tone]"); if(!b) return;
    tone.querySelectorAll(".chip").forEach(x=>x.classList.remove("selected"));
    b.classList.add("selected");
    predictNow();
  });

  /* Char counter + shortcut */
  const updateCount = () => { count.textContent = `${(txt.value||"").length} chars`; };
  txt.addEventListener("input", ()=>{ updateCount(); copy.textContent = txt.value; smartTags(); smartHints(); });
  txt.addEventListener("keydown",(e)=>{ if((e.metaKey||e.ctrlKey) && e.key==="Enter"){ e.preventDefault(); predictNow(); }});
  updateCount();

  /* Variant generator */
  variantBtn.addEventListener("click", ()=>{
    const base = txt.value.trim() || "Introducing our latest update";
    const t = currentTone();
    txt.value = spinVariant(base, t);
    copy.textContent = txt.value;
    smartTags(); smartHints(); updateCount();
  });

  /* Predict */
  predictBtn.addEventListener("click", predictNow);
  function predictNow(){
    const p = [...selectedPlatforms][0] || currentPlatform;
    const { time, score, kpis, weekly } = predict(txt.value, p, sliders());
    rec.textContent = `${pad(time.h)}:${pad(time.m)} • ${label(p)}`;
    kReach.textContent = `${kpis.reach}k`;
    kCtr.textContent   = `${kpis.ctr}%`;
    kConf.textContent  = `${kpis.conf}%`;
    drawSparkline(spark, weekly);
    // regenerate heat for timing tab
    renderHeat(p, txt.value, sliders());
  }

  /* Smart hashtags + hints */
  function smartTags(){
    const topics = suggestTags(txt.value);
    tags.innerHTML = topics.map(t=>`<span class="pill">#${t} <span class="add" data-tag="${t}">＋</span></span>`).join("");
  }
  tags.addEventListener("click", (e)=>{
    const add = e.target.closest(".add[data-tag]"); if(!add) return;
    const tag = ` #${add.dataset.tag}`;
    if(!txt.value.includes(tag)) txt.value += tag, copy.textContent = txt.value, updateCount();
  });
  function smartHints(){
    const arr = [];
    const t = txt.value||"";
    if(t.length<60) arr.push("Try a stronger opening hook");
    if(!/[!?]$/.test(t)) arr.push("End with a nudge");
    if(!/(http|www\.)/i.test(t)) arr.push("Add a supporting link");
    if(!/[#@]/.test(t)) arr.push("1–2 smart hashtags/mentions");
    if(!arr.length) arr.push("Looks strong—ship it");
    hints.innerHTML = arr.map(x=>`<span class="pill">${x}</span>`).join("");
  }
  smartTags(); smartHints();

  /* Media stub */
  media.addEventListener("click", ()=>{
    media.textContent = "📷 Image attached (mock)";
  });

  /* Heatmap render + selection */
  function renderHeat(platform, text, w){
    const data = buildHeat(platform, text, w); // [7][24] 0..1
    heat.innerHTML = "";
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    for(let d=0; d<7; d++){
      for(let h=0; h<24; h++){
        const v = data[d][h];
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.style.background = `hsl(var(--accent) / ${0.08 + v*0.55})`;
        cell.dataset.key = `${d}-${pad(h)}:00`;
        cell.dataset.label = (h%6===0? `${days[d]} ${pad(h)}:00` : "");
        cell.setAttribute("role","gridcell");
        cell.title = `${days[d]} ${pad(h)}:00 — score ${(v*100|0)}%`;
        if (heatSelected.has(cell.dataset.key)) cell.dataset.sel="1";
        cell.addEventListener("click", ()=>{
          const k = cell.dataset.key;
          if(heatSelected.has(k)){ heatSelected.delete(k); cell.dataset.sel="0"; }
          else { heatSelected.add(k); cell.dataset.sel="1"; }
        });
        heat.appendChild(cell);
      }
    }
  }

  autoPick.addEventListener("click", ()=>{
    const p = [...selectedPlatforms][0] || currentPlatform;
    const data = buildHeat(p, txt.value, sliders());
    const scores = [];
    for(let d=0; d<7; d++) for(let h=0; h<24; h++) scores.push({d,h,v:data[d][h]});
    scores.sort((a,b)=>b.v-a.v);
    heatSelected.clear();
    scores.slice(0,6).forEach(x=>heatSelected.add(`${x.d}-${pad(x.h)}:00`));
    renderHeat(p, txt.value, sliders());
  });

  applySchedule.addEventListener("click", ()=>{
    const text = (txt.value||"").trim();
    if(!text){ alert("Write something first."); return; }
    if(!heatSelected.size){ alert("Pick at least one time slot in the heatmap."); return; }
    const plats = [...selectedPlatforms];
    for (const k of heatSelected){
      const [d, hm] = k.split("-");
      const { date, time } = slotToDateTime(+d, hm);
      for (const p of plats) {
        queue.push({ platform: label(p), date, time, text });
      }
    }
    renderQueue();
    // jump to schedule tab
    root.querySelector('.demo-tabs .tab[data-tab="schedule"]').click();
  });

  function renderQueue(){
    queueTable.innerHTML = queue.map((r,i)=>`
      <tr>
        <td>${r.platform}</td>
        <td>${r.date}</td>
        <td>${r.time}</td>
        <td title="${r.text.replace(/"/g,"&quot;")}">${r.text.slice(0,90)}${r.text.length>90?"…":""}</td>
        <td><span class="del" data-i="${i}">✕</span></td>
      </tr>
    `).join("");
  }
  queueTable.addEventListener("click",(e)=>{
    const del = e.target.closest(".del[data-i]");
    if(!del) return;
    queue.splice(+del.dataset.i,1);
    renderQueue();
  });

  downloadBtn.addEventListener("click", ()=>{
    const blob = new Blob([JSON.stringify({ plan: queue }, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "evrt-schedule.json";
    document.body.appendChild(a); a.click(); a.remove();
  });
  clearBtn.addEventListener("click", ()=>{ queue = []; renderQueue(); });

  /* Analytics */
  function drawBars(canvas, arr){ // 7 numbers 0..1
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#0e121b"; ctx.fillRect(0,0,W,H);
    const pad = 24, bw = (W - pad*2)/arr.length - 12;
    ctx.font = "12px Inter"; ctx.fillStyle = "rgba(255,255,255,.7)";
    const days="Mon Tue Wed Thu Fri Sat Sun".split(" ");
    arr.forEach((v,i)=>{
      const x = pad + i*(bw+12);
      const h = (H - pad*2) * v;
      ctx.fillStyle = `hsla(var(--accent), ${.35 + .45*v})`.replace("hsla","rgba"); // fallback; still colors fine
      ctx.fillRect(x, H-pad-h, bw, h);
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.fillText(days[i], x, H-8);
    });
  }
  pickWinner.addEventListener("click", ()=>{
    const p = [...selectedPlatforms][0] || currentPlatform;
    const a = scoreText(txt.value || "Variant A", p, sliders());
    const b = scoreText(spinVariant(txt.value || "Variant A", currentTone()), p, sliders());
    abA.textContent = (a*100|0)+"%";
    abB.textContent = (b*100|0)+"%";
    root.querySelectorAll(".ab-bar span")[0].style.width = `${clamp(a*100,8,98)}%`;
    root.querySelectorAll(".ab-bar span")[1].style.width = `${clamp(b*100,8,98)}%`;
  });

  /* Initial draw */
  predictNow();
  drawBars(bars, [0.45,0.62,0.78,0.56,0.71,0.38,0.42]);

  /* ---------------- Model-ish helpers (seeded, deterministic) ---------------- */
  function currentTone(){
    const b = tone.querySelector(".chip.selected");
    return (b && b.dataset.tone) || "professional";
  }
  function sliders(){ return {
    clarity: +sClarity.value||65,
    energy:  +sEnergy.value ||70,
    depth:   +sDepth.value  ||55
  };}

  function spinVariant(s, t="professional"){
    const openers = {
      professional:["Announcing","Introducing","We’re excited to share","New"],
      playful:["Guess what?","Hot drop:","Tiny flex:","We made a thing:"],
      bold:["Stop scrolling:","Big news:","🚨 Launch:","Unveiling:"]
    }[t] || ["Announcing"];

    const closers = {
      professional:["Learn more →","Details inside →","Explore the update →"],
      playful:["Peep this →","Tap for details →","Come see →"],
      bold:["Don’t miss this →","Get in here →","Go deeper →"]
    }[t] || ["Learn more →"];

    const emojis = t==="professional" ? [""] : ["✨","🚀","🔥","⚡"];
    const opener = openers[(hash(s+t)%openers.length)];
    const closer = closers[(hash(t+s)%closers.length)];
    const emoji = emojis[(hash(s).toString(16).length)%emojis.length] || "";
    return `${opener} ${s.replace(/^[A-Z].*?:\s*/,'')}. ${closer} ${emoji}`.trim();
  }

  function scoreText(text, plat, w){
    const len = (text||"").trim().length || 40;
    const seed = hash(`${plat}|${len}|${w.clarity}|${w.energy}|${w.depth}`);
    const r = rng(seed);
    let s = 0.55 + r()*0.4;
    if (/http/i.test(text)) s += 0.03;
    if (/[!?]$/.test(text)) s += 0.02;
    if (/#\w+/.test(text)) s += 0.02;
    if (len>220) s -= 0.05;
    return clamp(s, 0.4, 0.98);
  }

  function predict(text, plat, w){
    const score = scoreText(text, plat, w);
    const r = rng(hash(plat + ":" + (text||"").length + ":" + w.energy));
    const hours = {x:[11,13,17,20],linkedin:[8,9,12,18],instagram:[9,12,18,20],tiktok:[19,21,22,23]}[plat]||[12,18,21,9];
    const minutes = [5,12,18,25,35,45,55];
    const h = hours[Math.floor(r()*hours.length)];
    const m = minutes[Math.floor((r()*100+score*100)%minutes.length)];
    const weekly = Array.from({length:7},(_,i)=> clamp(0.35 + 0.5*Math.abs(Math.sin((i+1)*1.25)) + (r()-0.5)*0.15, 0.1, 0.95));
    const reach = Math.round( (score*100) + r()*60 );
    const ctr = ( (0.9 + score*1.2) + (r()*0.3) ).toFixed(1);
    const conf = Math.round( 60 + score*35 );
    return { time:{h,m}, score, weekly, kpis:{ reach, ctr, conf } };
  }

  function buildHeat(plat, text, w){
    const s = scoreText(text, plat, w);
    const base = 0.25 + s*0.55;
    const r = rng(hash("HEAT|" + plat + "|" + (text||"").length + "|" + w.clarity));
    const mat = [];
    for(let d=0; d<7; d++){
      const row = [];
      for(let h=0; h<24; h++){
        // weekday bump mid-week + evening boost
        const mid = Math.exp(-Math.pow((d-3)/2.2,2))*0.2;
        const eve = Math.exp(-Math.pow((h-19)/4,2))*0.25;
        const noise = (r()-0.5)*0.12;
        row.push( clamp(base + mid + eve + noise, 0.05, 0.98) );
      }
      mat.push(row);
    }
    return mat;
  }

  /* Drawing */
  function drawSparkline(canvas, arr){
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#0e121b"; ctx.fillRect(0,0,W,H);
    const pad = 14;
    ctx.strokeStyle = "#223"; ctx.lineWidth = 1;
    for(let y=pad; y<H-pad; y+=20){ ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-pad,y); ctx.stroke(); }
    ctx.strokeStyle = "#7aa5ff"; ctx.lineWidth = 2;
    ctx.beginPath();
    const step = (W - pad*2) / (arr.length - 1);
    arr.forEach((v,i)=>{
      const x = pad + i*step;
      const y = H - pad - v*(H - pad*2);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
  }

  /* Helpers */
  function pad(n){ return String(n).padStart(2,"0"); }
  function slotToDateTime(d, hm){ // d: 0..6
    const now = new Date(); const diff = (d - (now.getDay()+6)%7 + 7)%7; // align to Mon..Sun
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate()+diff);
    return { date: date.toISOString().slice(0,10), time: hm };
  }
}

/* ---------------- Boot ---------------- */
window.addEventListener("DOMContentLoaded", async ()=>{
  await includePartials();
  setupNav(); setupTheme(); setupReveal(); markActiveLink();
  setupDemoPro();

  // Footer year + reduced motion
  const y = document.getElementById("y"); if (y) y.textContent = new Date().getFullYear();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    document.querySelector(".bg-orbs")?.style.setProperty("animation","none");
  }
});
/* ==== EVRT Demo 2.0 script ============================================ */
(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const preview = $("#preview");
  const meters = { reach: $("#m-reach"), ctr: $("#m-ctr"), conf: $("#m-conf") };

  // Chip toggles
  $$("#chips-platforms .chip").forEach(chip=>{
    chip.addEventListener("click", ()=>{
      chip.classList.toggle("is-on");
      paint(); // platforms influence pattern
    });
  });
  $$("#chips-tone .chip").forEach(chip=>{
    chip.addEventListener("click", ()=>{
      $$("#chips-tone .chip").forEach(c=>c.classList.remove("is-on"));
      chip.classList.add("is-on");
      paint();
    });
  });

  // Text + sliders
  const pt = $("#post-text");
  ["input","change"].forEach(ev=> pt.addEventListener(ev, ()=> {
    preview.textContent = pt.value || "Your post preview will appear here…";
  }));
  ["#s-clarity","#s-energy","#s-depth"].forEach(sel=>{
    $(sel).addEventListener("input", ()=> paint());
  });

  // Buttons
  $("#btn-variant").addEventListener("click", ()=>{
    // ultra-simplified “variant”
    const base = pt.value.trim() || "Announcing EVRT Social AI — create, predict, and scale content.";
    const tones = { pro:["Here’s the plan:","Key takeaways:","In short:"],
                    playful:["Fun fact:","Hot take:","BTW:"],
                    bold:["Heads up:","Look —","Real talk:"] };
    const tone = document.querySelector("#chips-tone .chip.is-on")?.dataset.tone || "pro";
    pt.value = `${tones[tone][Math.floor(Math.random()*3)]} ${base}`;
    pt.dispatchEvent(new Event("input"));
  });

  $("#btn-predict").addEventListener("click", ()=>{
    // fake metrics tied to sliders + platforms
    const clarity = +$("#s-clarity").value;
    const energy  = +$("#s-energy").value;
    const depth   = +$("#s-depth").value;
    const plats = $$("#chips-platforms .chip.is-on").length || 1;

    const reach = Math.round( (clarity*0.6 + energy*0.4 + depth*0.2) * plats * 3 );
    const ctr = ( (energy*0.015 + clarity*0.01) / 10 + 1.2 ).toFixed(1);
    const conf = Math.min(99, Math.round( 40 + depth*0.4 + plats*6 ));

    meters.reach.textContent = Intl.NumberFormat().format(reach);
    meters.ctr.textContent   = `${ctr}%`;
    meters.conf.textContent  = `${conf}%`;

    pulse(meters.reach.parentElement);
    pulse(meters.ctr.parentElement);
    pulse(meters.conf.parentElement);

    paint();
  });

  $("#btn-schedule").addEventListener("click", ()=>{
    flash(".stage-toolbar");
  });
  $("#btn-clear").addEventListener("click", ()=>{
    meters.reach.textContent = meters.ctr.textContent = meters.conf.textContent = "—";
    paint(true);
  });

  // Canvas heatmap
  const cvs = document.getElementById("heatmap");
  const ctx = cvs.getContext("2d");

  function sizeCanvas(){
    const r = cvs.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    cvs.width = Math.floor(r.width * dpr);
    cvs.height = Math.floor(Math.max(r.height, 360) * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener("resize", sizeCanvas, { passive:true });

  function paint(clear=false){
    sizeCanvas();
    const w = cvs.width / (window.devicePixelRatio||1);
    const h = cvs.height / (window.devicePixelRatio||1);
    ctx.clearRect(0,0,w,h);

    // grid 7 days x 24 hours (condensed)
    const cols = 24, rows = 7;
    const cellW = w/cols, cellH = h/rows;

    // parameters from UI
    const clarity = +$("#s-clarity").value;
    const energy  = +$("#s-energy").value;
    const depth   = +$("#s-depth").value;
    const toneKey = document.querySelector("#chips-tone .chip.is-on")?.dataset.tone || "pro";
    const plats = $$("#chips-platforms .chip.is-on").map(c=>c.dataset.pl);

    // seed pattern
    const seed = (clarity*3 + energy*5 + depth*7 + toneKey.length*11 + plats.join("").length*13) % 997;
    function rnd(i,j){ // cheap deterministic-ish noise
      const x = Math.sin((i*37 + j*57 + seed)*0.01)*43758.5453;
      return x - Math.floor(x);
    }

    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const base = rnd(r,c);
        // weight hours: evenings hotter
        const hourBias = Math.sin((c/24)*Math.PI) * 0.6 + 0.2;
        // platforms add spikes
        const platBoost = plats.length>0 ? 0.1*plats.length : 0.05;
        const val = clear ? 0.08 : Math.min(1, base*0.35 + hourBias + platBoost + energy*0.003);

        const hueA = 275, hueB = 195;
        const hue = hueA + (hueB-hueA)*val;
        const alpha = 0.12 + val*0.38;

        ctx.fillStyle = `hsla(${hue} 90% 55% / ${alpha})`;
        const pad = 2;
        ctx.fillRect(c*cellW+pad, r*cellH+pad, cellW-2*pad, cellH-2*pad);
      }
    }

    // overlay axes
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for(let c=1;c<cols;c++){ ctx.beginPath(); ctx.moveTo(c*cellW,0); ctx.lineTo(c*cellW,h); ctx.stroke(); }
    for(let r=1;r<rows;r++){ ctx.beginPath(); ctx.moveTo(0,r*cellH); ctx.lineTo(w,r*cellH); ctx.stroke(); }
  }

  function pulse(el){
    el.animate([{transform:"scale(1)"},{transform:"scale(1.03)"},{transform:"scale(1)"}],
               {duration:400, easing:"ease-out"});
  }
  function flash(sel){
    const el = document.querySelector(sel);
    if(!el) return;
    el.animate([{boxShadow:"0 0 0 rgba(0,0,0,0)"},
                {boxShadow:"0 0 0 6px rgba(80,160,255,.25)"},
                {boxShadow:"0 0 0 rgba(0,0,0,0)"}],
                {duration:700, easing:"ease-out"});
  }

  // init
  sizeCanvas(); paint();
})();

