/* Shared includes + utilities */
async function includePartials(){
  for (const n of document.querySelectorAll("[data-include]")) {
    const path = n.getAttribute("data-include");
    try { const res = await fetch(path); n.innerHTML = await res.text(); } catch {}
  }
}
function setupNav(){
  const btn = document.getElementById("menuBtn");
  const links = document.getElementById("navLinks");
  btn?.addEventListener("click", ()=>{
    const open = links.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  const cur = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("header nav a").forEach(a=>{
    const href = a.getAttribute("href"); if (!href) return;
    const name = href.split("/").pop();
    if (name === cur) a.classList.add("active");
  });
}
function setupReveal(){
  const els = document.querySelectorAll("[data-reveal]");
  const io = new IntersectionObserver((entries)=>{
    for (const e of entries) if (e.isIntersecting) e.target.classList.add("in");
  }, {threshold:.08});
  els.forEach(el=>io.observe(el));
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

/* ====== LIVE DEMO ====== */
const EVRT = (()=>{

  // DOM refs set on open
  let portal, heat, slots, postInput, phone, postPreview, reachVal, ctrVal, confVal;
  let clarity, energy, depth;
  let savedScrollY = 0;

  // Simple PRNG
  function seedFrom(s){ let h=0; for (let i=0;i<s.length;i++) h = Math.imul(31,h) + s.charCodeAt(i) | 0; return h>>>0; }
  function rng(seed){ return ()=> (seed = Math.imul(1664525,seed) + 1013904223) >>> 0 / 2**32; }

  function lockBody(){
    savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.top = `-${savedScrollY}px`;
    document.body.classList.add('modal-open');
  }
  function unlockBody(){
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
  }

  function openPortal(){
    portal = document.getElementById('demoPortal');
    lockBody();                 // <— critical for iOS & Android
    portal.classList.add('open');
    portal.setAttribute('aria-hidden','false');

    // refs
    heat = document.getElementById('heat');
    slots = document.getElementById('slots');
    postInput = document.getElementById('postInput');
    phone = document.getElementById('phone');
    postPreview = document.getElementById('postPreview');
    reachVal = document.getElementById('reachVal');
    ctrVal = document.getElementById('ctrVal');
    confVal = document.getElementById('confVal');
    clarity = document.getElementById('clarity');
    energy  = document.getElementById('energy');
    depth   = document.getElementById('depth');

    wireControls();
    renderHeat(); // initial
    renderSlots([]);
    drawChart([6,7,6,8,9,7,10,12,11,13,12,15,14,16]);
  }
  function closePortal(){
    portal?.classList.remove('open');
    portal?.setAttribute('aria-hidden','true');
    unlockBody();
  }

  function wireControls(){
    document.getElementById('closeDemo').onclick = closePortal;

    // tabs (analytics shows canvas)
    document.querySelectorAll('.portal-tabs .tab').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('.portal-tabs .tab').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        const grid = document.querySelector('.portal-grid');
        const aw = document.getElementById('analyticsWrap');
        if (tab === 'analytics'){ grid.style.display='none'; aw.hidden=false; }
        else { grid.style.display='grid'; aw.hidden=true; }
      });
    });

    // platforms
    document.querySelectorAll('#platforms .chip').forEach(ch=>{
      ch.addEventListener('click', ()=>{
        document.querySelectorAll('#platforms .chip').forEach(c=>c.classList.remove('active'));
        ch.classList.add('active');
        setPlatform(ch.dataset.platform);
      });
    });

    // tone
    document.querySelectorAll('.tonebtn').forEach(b=>{
      b.addEventListener('click', ()=>{
        document.querySelectorAll('.tonebtn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        updateMetrics();
      });
    });

    // inputs
    postInput.addEventListener('input', ()=>{
      document.getElementById('charCount').textContent = `${postInput.value.length} chars`;
      postPreview.textContent = postInput.value.trim() || 'Your post preview will appear here…';
      updateMetrics();
    });
    [clarity,energy,depth].forEach(sl=> sl.addEventListener('input', updateMetrics));

    document.getElementById('btnPredict').onclick = predict;
    document.getElementById('btnVariant').onclick = variant;
    document.getElementById('btnSave').onclick = ()=> toast('Draft saved');
    document.getElementById('btnSchedule').onclick = schedule;
    document.getElementById('btnStartTrial').onclick = ()=> toast('Redirecting to sign up… (demo)');

    // prevent wheel/touch from bubbling to page (extra safety on Android)
    portal.addEventListener('wheel', e=>e.stopPropagation(), {passive:true});
    portal.addEventListener('touchmove', e=>e.stopPropagation(), {passive:true});
  }

  function setPlatform(p){
    phone.classList.remove('facebook','instagram','tiktok','linkedin','x');
    phone.classList.add(p);
  }

  function updateMetrics(){
    const text = postInput.value.trim();
    const seed = seedFrom(text + clarity.value + energy.value + depth.value + (document.querySelector('.tonebtn.active')?.dataset?.tone || ''));
    const rand = rng(seed);
    const base = 400 + Math.round(rand()*600);
    const tone = (document.querySelector('.tonebtn.active')?.dataset.tone||'pro');
    const toneAdj = tone==='playful'?1.05:tone==='bold'?1.08:1;
    const reach = Math.round(base * toneAdj * (0.7 + clarity.value/200));
    const ctr = (1.2 + (energy.value/100)*1.6 + rand()*0.6).toFixed(1);
    const conf = Math.min(99, Math.round(60 + depth.value/2 + rand()*20));
    reachVal.textContent = Intl.NumberFormat().format(reach);
    ctrVal.textContent = `${ctr}%`;
    confVal.textContent = `${conf}%`;
  }

  function renderHeat(hotCells=[]){
    heat.innerHTML='';
    for (let d=0; d<7; d++){
      for (let h=0; h<24; h++){
        const idx = d*24 + h;
        const cell = document.createElement('div');
        cell.className = 'cell';
        const lvl = (h%24);
        if (lvl>19) cell.classList.add('l5');
        else if (lvl>16) cell.classList.add('l4');
        else if (lvl>13) cell.classList.add('l3');
        else if (lvl>10) cell.classList.add('l2');
        else cell.classList.add('l1');
        if (hotCells.includes(idx)) cell.classList.add('hot');
        heat.appendChild(cell);
      }
    }
  }

  function renderSlots(items){
    slots.innerHTML='';
    if (!items.length){
      const shim = ['Today 2:10 PM','Tomorrow 9:04 AM','Fri 6:32 PM'];
      const channels = ['Facebook','Instagram','TikTok'];
      const subs = ['Reach +18%','CTR +11%','Saves +9%'];
      for (let i=0;i<3;i++){
        const d = document.createElement('div');
        d.className = 'slot';
        d.innerHTML = `<strong>${shim[i]}</strong><small>${channels[i]} — ${subs[i]}</small>`;
        slots.appendChild(d);
      }
      return;
    }
    for (const s of items){
      const d = document.createElement('div');
      d.className = 'slot';
      d.innerHTML = `<strong>${s.when}</strong><small>${s.chan} — ${s.note}</small>`;
      slots.appendChild(d);
    }
  }

  function predict(){
    const text = postInput.value.trim();
    const rand = rng(seedFrom(text || 'evrt'));
    // choose 3 “hot” windows
    const hot = [];
    while (hot.length<6){
      const i = Math.floor(rand()*7*24);
      if (!hot.includes(i)) hot.push(i);
    }
    renderHeat(hot);

    const ch = ['Facebook','Instagram','TikTok','LinkedIn','X'];
    const notes = ['Reach +'+(10+Math.round(rand()*25))+'%','CTR +'+(8+Math.round(rand()*18))+'%','Saves +'+(6+Math.round(rand()*14))+'%'];
    const recs = [];
    for (let i=0;i<3;i++){
      const t = new Date(Date.now() + (i+1)*86400000*rand());
      const label = t.toLocaleDateString(undefined,{weekday:'short'}) + ' ' + t.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
      recs.push({when:label, chan: ch[Math.floor(rand()*ch.length)], note: notes[i]});
    }
    renderSlots(recs);
    toast('Predicted best minutes updated');
  }

  function variant(){
    const base = postInput.value.trim();
    if (!base){ toast('Write something first'); return; }
    const v = [
      'What would this unlock for your team?',
      'Shortcut the “blank page” with an AI draft.',
      'Ship → learn → scale. Repeat.',
      'Make it clear, concise, and scroll-stopping.'
    ];
    postInput.value = base + (base.endsWith('.')?'':' —') + ' ' + v[Math.floor(Math.random()*v.length)];
    postPreview.textContent = postInput.value;
    updateMetrics();
  }

  function schedule(){
    document.getElementById('statusPill').textContent = 'Queued';
    confetti();
    toast('Scheduled! (demo)');
  }

  function toast(msg){
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style,{
      position:'fixed',left:'50%',bottom:'18px',transform:'translateX(-50%)',
      background:'#0e121b',border:'1px solid #1e2230',padding:'10px 14px',borderRadius:'12px',
      zIndex:70,boxShadow:'0 10px 30px rgba(0,0,0,.4)'
    });
    document.body.appendChild(t);
    setTimeout(()=>{ t.style.transition='opacity .4s'; t.style.opacity='0'; }, 1400);
    setTimeout(()=> t.remove(), 2000);
  }

  // Tiny confetti
  function confetti(){
    const root = document.getElementById('demoPortal');
    for (let i=0;i<80;i++){
      const s = document.createElement('div');
      const c = i%3===0? '#50e3ff' : i%3===1? '#8b5cf6' : '#22d3ee';
      Object.assign(s.style,{
        position:'fixed',left: (Math.random()*100)+'vw',top:'-8px',width:'6px',height:'10px',
        background:c,borderRadius:'2px',zIndex:80,transform:`rotate(${Math.random()*180}deg)`
      });
      root.appendChild(s);
      const dur = 1200 + Math.random()*1200;
      s.animate([{transform:`translateY(0) rotate(0deg)`},{transform:`translateY(100vh) rotate(720deg)`}],{duration:dur,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>s.remove();
    }
  }

  // Simple canvas sparkline
  function drawChart(points){
    const canvas = document.getElementById('chart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const w=canvas.width, h=canvas.height, pad=30;
    ctx.strokeStyle='#263147'; ctx.lineWidth=1;
    for (let i=0;i<5;i++){ const y=pad+i*(h-2*pad)/4; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-pad,y); ctx.stroke(); }
    const max = Math.max(...points), min = Math.min(...points);
    const xstep = (w-2*pad)/(points.length-1);
    ctx.beginPath(); ctx.lineWidth=3; const grd = ctx.createLinearGradient(pad,0,w-pad,0);
    grd.addColorStop(0,'#50e3ff'); grd.addColorStop(1,'#8b5cf6'); ctx.strokeStyle=grd;
    points.forEach((v,i)=>{
      const x = pad + i*xstep;
      const y = pad + (1-(v-min)/(max-min||1))*(h-2*pad);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
  }

  return { openPortal, closePortal };
})();
window.EVRT = EVRT;

/* Boot */
window.addEventListener("DOMContentLoaded", async ()=>{
  await includePartials();
  setupNav(); setupReveal(); setupTheme();
  const y = document.getElementById("y"); if (y) y.textContent = new Date().getFullYear();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    document.querySelector(".bg-orbs")?.style.setProperty("animation","none");
  }
});
