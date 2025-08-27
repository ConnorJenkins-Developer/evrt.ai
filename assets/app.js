
// ---------- Partials include ----------
async function includePartials(){
  for (const n of document.querySelectorAll("[data-include]")) {
    const path = n.getAttribute("data-include");
    try { const res = await fetch(path); n.innerHTML = await res.text(); } catch {}
  }
}

// ---------- Active link ----------
function markActiveLink(){
  const cur = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("header nav a").forEach(a=>{
    const href = a.getAttribute("href"); if (!href) return;
    const name = href.split("/").pop();
    if (name === cur) a.classList.add("active");
  });
}

// ---------- Theme ----------
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

// ---------- Reveal on scroll ----------
function setupReveal(){
  const els = document.querySelectorAll("[data-reveal]");
  const io = new IntersectionObserver((entries)=>{
    for (const e of entries) if (e.isIntersecting) e.target.classList.add("in");
  }, {threshold:.08});
  els.forEach(el=>io.observe(el));
}

// ---------- Header / Nav (mobile overlay pattern) ----------
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

  window.addEventListener("keydown", (e)=>{
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) close();
  });

  const mq = window.matchMedia("(min-width: 961px)");
  mq.addEventListener?.("change", e => { if (e.matches) close(); });

  document.querySelectorAll("header details.menu.more > summary").forEach(sum=>{
    sum.addEventListener("click", ()=>{
      const d = sum.parentElement;
      const isOpen = d.hasAttribute("open");
      sum.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });
}

// ---------- Live Demo logic ----------
function setupDemo(){
  const root = document.getElementById("live-demo");
  if (!root) return; // not on this page

  const platforms = document.getElementById("demoPlatforms");
  const pill = document.getElementById("demoPlatformPill");
  const txt = document.getElementById("demoText");
  const btnPredict = document.getElementById("btnPredict");
  const btnVariant = document.getElementById("btnVariant");
  const rec = document.getElementById("demoRec");
  const copy = document.getElementById("demoCopy");
  const hints = document.getElementById("demoHints");
  const spark = document.getElementById("demoSpark");
  const kpiReach = document.getElementById("kpiReach");
  const kpiCtr = document.getElementById("kpiCtr");
  const kpiConf = document.getElementById("kpiConf");

  let platform = "x";

  // Tabs
  platforms?.addEventListener("click", (e)=>{
    const btn = e.target.closest("button[data-platform]");
    if (!btn) return;
    platform = btn.getAttribute("data-platform");
    platforms.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    pill.textContent = label(platform);
    // refresh rec if we already predicted
    if (rec.dataset.ts) {
      const { time, score } = predict(txt.value, platform);
      applyPrediction(time, score);
    }
  });

  // Keyboard shortcut
  txt?.addEventListener("keydown",(e)=>{
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      btnPredict?.click();
    }
  });

  // Generate variant
  btnVariant?.addEventListener("click", ()=>{
    const base = (txt.value || "Announcing our latest drop 🚀");
    txt.value = spinVariant(base);
    copy.textContent = txt.value;
    makeHints(txt.value);
  });

  // Predict best minute
  btnPredict?.addEventListener("click", ()=>{
    btnPredict.disabled = true;
    btnPredict.textContent = "Predicting…";
    setTimeout(()=>{
      const { time, score } = predict(txt.value, platform);
      applyPrediction(time, score);
      btnPredict.disabled = false;
      btnPredict.textContent = "Predict best minute";
    }, 420); // lil' flourish 😉
  });

  // Initial state
  copy.textContent = txt.value || "Your post preview will appear here…";
  makeHints(copy.textContent);

  function label(p){
    return {x:"X", linkedin:"LinkedIn", instagram:"Instagram", tiktok:"TikTok"}[p] || "X";
  }

  // Simple seeded randomness
  function hash(s){
    let h = 2166136261 >>> 0;
    for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed){
    let t = seed >>> 0;
    return ()=>{ t ^= t<<13; t ^= t>>>17; t ^= t<<5; return (t>>>0) / 2**32; };
  }

  // Predict: choose a good hour/minute + build weekly sparkline + KPIs
  function predict(text, plat){
    const len = (text||"").trim().length || 32;
    const seed = hash(plat + ":" + len);
    const r = rng(seed);

    const hours = {
      x:         [11,13,17,20],
      linkedin:  [8,9,12,18],
      instagram: [9,12,18,20],
      tiktok:    [19,21,22,23]
    }[plat] || [12,18,21,9];

    const minutes = [5, 12, 18, 25, 35, 45, 55];
    const h = hours[Math.floor(r()*hours.length)];
    const m = minutes[Math.floor((len + r()*100)%minutes.length)];

    // score ~0.55–0.92
    const score = 0.55 + (r()*0.37);

    // sparkline: 7 pts for Mon–Sun
    const base = 12 + Math.floor(r()*4);
    const pts = [];
    for (let i=0;i<7;i++){
      const bump = Math.sin((i/6)*Math.PI) * (4 + r()*3); // mid-week bump
      const noise = (r()-0.5)*2;
      pts.push(Math.max(2, Math.min(28, base + bump + noise)));
    }
    drawSpark(pts);

    // KPIs
    const reach = Math.round( (score*100) + r()*50 );
    const ctr = ( (0.8 + score*1.2) + (r()*0.4) ).toFixed(1);
    const conf = Math.round( 60 + (score*35) );

    kpiReach.textContent = `${reach}k`;
    kpiCtr.textContent = `${ctr}%`;
    kpiConf.textContent = `${conf}%`;

    return { time: { h, m }, score };
  }

  function applyPrediction(time, score){
    const {h,m} = time;
    const mm = String(m).padStart(2,"0");
    rec.textContent = `Best minute: ${h}:${mm}`;
    rec.dataset.ts = `${h}:${mm}`;
    copy.textContent = txt.value || copy.textContent;

    // update hints too
    makeHints(copy.textContent, score);
  }

  // Variant generator (very light touch)
  function spinVariant(s){
    const alts = [
      ["Announcing","Introducing","Unveiling","Launching"],
      ["drop","release","update","feature"],
      ["🚀","✨","⚡","🔥"]
    ];
    const r = Math.random;
    return s
      .replace(/Announcing|Introducing|Unveiling|Launching/i, alts[0][Math.floor(r()*alts[0].length)])
      .replace(/drop|release|update|feature/i, alts[1][Math.floor(r()*alts[1].length)])
      .replace(/[🚀✨⚡🔥]?$/, " " + alts[2][Math.floor(r()*alts[2].length)]);
  }

  function makeHints(text, score=0.7){
    const hintsArr = [];
    if ((text||"").length > 140) hintsArr.push("Try a tighter hook");
    if (!/[!?]$/.test(text||"")) hintsArr.push("End with a nudge");
    if (!/(http|www\.)/i.test(text||"")) hintsArr.push("Add a contextual link");
    if (!/[#@]/.test(text||"")) hintsArr.push("Consider 1–2 hashtags/mentions");
    if (!hintsArr.length) hintsArr.push(score > 0.75 ? "Looks strong—ship it" : "Solid—A/B another hook");
    hints.innerHTML = hintsArr.map(t=>`<span class="pill">${t}</span>`).join("");
  }

  function drawSpark(vals){
    // vals of length 7, y 2..28 → map to 0..30 SVG
    const step = 100/(vals.length-1);
    const pts = vals.map((v,i)=>`${(i*step).toFixed(2)},${(30 - v).toFixed(2)}`).join(" ");
    spark.querySelector("polyline").setAttribute("points", pts);
  }
}

// ---------- Boot ----------
window.addEventListener("DOMContentLoaded", async ()=>{
  await includePartials();        // inject header/footer/demo
  setupNav();
  setupTheme();
  setupReveal();
  markActiveLink();
  setupDemo();                    // ← the new piece

  const y = document.getElementById("y");
  if (y) y.textContent = new Date().getFullYear();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    document.querySelector(".bg-orbs")?.style.setProperty("animation","none");
  }
});

