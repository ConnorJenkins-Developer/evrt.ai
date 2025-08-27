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
    const b = tone.querySelector("
