
async function includePartials(){
  for (const n of document.querySelectorAll("[data-include]")) {
    const path = n.getAttribute("data-include");
    try { const res = await fetch(path); n.innerHTML = await res.text(); } catch {}
  }
}

function markActiveLink(){
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

function setupNav(){
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");
  const overlay = document.getElementById("navOverlay");
  if (!menuBtn || !navLinks || !overlay) return;

  const open = () => {
    document.body.classList.add("nav-open");
    menuBtn.setAttribute("aria-expanded","true");
    overlay.hidden = false;
    // prevent page scroll behind
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

  // Close on ESC
  window.addEventListener("keydown", (e)=>{
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) close();
  });

  // Close on resize back to desktop
  const mq = window.matchMedia("(min-width: 961px)");
  mq.addEventListener?.("change", e => { if (e.matches) close(); });

  // Desktop <details> accessibility: reflect open state
  document.querySelectorAll("header details.menu.more > summary").forEach(sum=>{
    sum.addEventListener("click", ()=>{
      const d = sum.parentElement;
      const open = d.hasAttribute("open");
      sum.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
}

window.addEventListener("DOMContentLoaded", async ()=>{
  await includePartials();   // inject header/footer first
  setupNav();                // now elements exist
  setupTheme();
  setupReveal();
  markActiveLink();

  const y = document.getElementById("y");
  if (y) y.textContent = new Date().getFullYear();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    document.querySelector(".bg-orbs")?.style.setProperty("animation","none");
  }
});

