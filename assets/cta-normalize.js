// assets/cta-normalize.js
(function(){
  const ROOT = location.pathname.includes('/evrt.ai/') ? '/evrt.ai/' : '/';
  const PORTAL = ROOT + 'portal.html';

  function normalizeCTAs(){
    const labels = [
      'start trial','start your trial','launch demo','try now',
      'get started','start','client portal','sign in','sign-in','sign in →'
    ];
    const anchors = Array.from(document.querySelectorAll('a, button'));
    for(const el of anchors){
      const text = (el.textContent || '').trim().toLowerCase();
      const hasData = el.hasAttribute('data-cta');
      const looksLikeCTA = hasData || labels.some(l => text.includes(l));
      if(!looksLikeCTA) continue;

      // Point to portal, but don't change classes/styles
      if(el.tagName === 'A'){ el.setAttribute('href', PORTAL); }
      else { el.addEventListener('click', ()=> location.href = PORTAL); }
    }
  }

  function sanitizeLinks(){
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    for(const a of anchors){
      const href = a.getAttribute('href');
      if(!href) continue;
      // Fix absolute root to repo-aware root
      if (/^\/(?!evrt\.ai\/)/.test(href)) {
        a.setAttribute('href', ROOT + href.replace(/^\//,''));
      }
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ sanitizeLinks(); normalizeCTAs(); });
  } else { sanitizeLinks(); normalizeCTAs(); }
})();
