/* =========================================================
   EVRT site JS: partial includes, nav, theme, reveal, demo
   =======================================================*/
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
  // active link
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

/* =========================================================
   Interactive demo overlay
   =======================================================*/
function seedHeatmap(container){
  if (!container) return;
  container.innerHTML = "";
  const cells = matchMedia("(min-width: 860px)").matches ? 24 : 12;
  for (let i=0;i<cells;i++){
    const div = document.createElement("div");
    div.className = "hm-cell";
    // simple bell-ish curve distribution
    const r = Math.random();
    if (r > 0.82) div.classList.add("hot");
    if (r > 0.9) {
      const dot = document.createElement("div");
      dot.className = "hm-dot"; div.appendChild(dot);
    }
    container.appendChild(div);
  }
}
function platformBadge(el, platform){
  el.classList.remove("fb","ig","tk","x","li");
  if (platform==="facebook") el.classList.add("fb");
  if (platform==="instagram") el.classList.add("ig");
  if (platform==="tiktok") el.classList.add("tk");
  if (platform==="x") el.classList.add("x");
  if (platform==="linkedin") el.classList.add("li");
}

function initDemo(){
  const layer = document.getElementById("demoLayer");
  if (!layer) return;

  // open/close
  const launch = document.getElementById("launchDemo");
  const close = document.getElementById("closeDemo");
  const backdrop = layer.querySelector(".demo-backdrop");
  function open(){ layer.classList.add("open"); document.body.classList.add("no-scroll"); layer.setAttribute("aria-hidden","false"); }
  function hide(){ layer.classList.remove("open"); document.body.classList.remove("no-scroll"); layer.setAttribute("aria-hidden","true"); }
  launch?.addEventListener("click", open);
  close?.addEventListener("click", hide);
  backdrop?.addEventListener("click", hide);

  // preview interactions
  const textarea = document.getElementById("postText");
  const previewText = document.getElementById("previewText");
  const media = document.getElementById("previewMedia");
  textarea?.addEventListener("input", ()=>{ previewText.textContent = textarea.value || "Your post preview will appear here…"; });

  document.getElementById("btnAddMedia")?.addEventListener("click", ()=>{
    media.style.background = "linear-gradient(135deg, rgba(146,86,255,.35), rgba(0,191,255,.30))";
  });

  // platforms
  const feed = document.getElementById("feedCard");
  function setPlat(p){ platformBadge(feed, p); }
  document.getElementById("pFacebook")?.addEventListener("click",()=>setPlat("facebook"));
  document.getElementById("pInstagram")?.addEventListener("click",()=>setPlat("instagram"));
  document.getElementById("pTikTok")?.addEventListener("click",()=>setPlat("tiktok"));
  document.getElementById("pX")?.addEventListener("click",()=>setPlat("x"));
  document.getElementById("pLinkedIn")?.addEventListener("click",()=>setPlat("linkedin"));

  // generate variants (mock)
  const tray = document.getElementById("variantTray");
  document.getElementById("btnVariant")?.addEventListener("click", ()=>{
    const seed = (textarea?.value || "Write with momentum. Lead with value.").slice(0,80);
    const v = document.createElement("div");
    v.className = "mini"; v.textContent = seed + " • Variant " + (tray.children.length + 1);
    tray.prepend(v);
  });

  // seed heatmap
  seedHeatmap(document.getElementById("hm"));
  window.addEventListener("resize", ()=>seedHeatmap(document.getElementById("hm")));
}

window.addEventListener("DOMContentLoaded", async ()=>{
  await includePartials();
  setupNav(); setupTheme(); setupReveal();
  const y = document.getElementById("y"); if (y) y.textContent = new Date().getFullYear();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    document.querySelector(".bg-orbs")?.style.setProperty("animation","none");
  }
  initDemo();
});
