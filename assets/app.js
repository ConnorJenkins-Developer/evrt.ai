
/*! EVRT app.js */
async function includePartials(){
  for (const n of document.querySelectorAll("[data-include]")) {
    const path = n.getAttribute("data-include");
    try { const res = await fetch(path, {cache:'no-cache'}); n.innerHTML = await res.text(); } catch {}
  }
}
function setupNav(){
  const menuBtn   = document.getElementById("menuBtn");
  const navLinks  = document.getElementById("navLinks");
  const overlay   = document.getElementById("navOverlay");
  if (!menuBtn || !navLinks || !overlay) return;

  const open = () => {
    document.body.classList.add("nav-open");
    menuBtn.setAttribute("aria-expanded","true");
    overlay.hidden = false;
    // Close any desktop dropdown to avoid overlap
    const more = navLinks.querySelector('details.more');
    if (more) more.setAttribute('open','');
  };
  const close = () => {
    document.body.classList.remove("nav-open");
    menuBtn.setAttribute("aria-expanded","false");
    overlay.hidden = true;
  };

  menuBtn.addEventListener("click", () => {
    document.body.classList.contains("nav-open") ? close() : open();
  });
  overlay.addEventListener("click", close);
  window.addEventListener("keydown", (e)=>{ if(e.key==="Escape") close(); });

  // Close panel when resizing up to desktop
  let lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    const now = window.innerWidth;
    if (lastW <= 960 && now > 960) close();
    lastW = now;
  });

  // Active link highlight (unchanged)
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
window.addEventListener("DOMContentLoaded", async ()=>{
  await includePartials();
  setupNav(); setupTheme(); setupReveal();
  const y = document.getElementById("y"); if (y) y.textContent = new Date().getFullYear();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    document.querySelector(".bg-orbs")?.style.setProperty("animation","none");
  }
});
