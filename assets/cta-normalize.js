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

      // Make it a link to the portal
      if(el.tagName === 'A'){
        el.setAttribute('href', PORTAL);
      } else {
        el.addEventListener('click', ()=> location.href = PORTAL);
      }

      // Styling hint (optional)
      if(hasData && el.dataset.cta === 'primary'){
        el.classList.add('btn','neon');
      }
    }
  }

  // Also fix any hrefs that mistakenly point to site root variations
  function sanitizeLinks(){
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    for(const a of anchors){
      const href = a.getAttribute('href');
      if(!href) continue;
      // Ensure relative links don't accidentally become absolute to /
      if (/^\/(?!evrt\.ai\/)/.test(href)) {
        // Convert to repo-aware root
        a.setAttribute('href', ROOT + href.replace(/^\//,''));
      }
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ sanitizeLinks(); normalizeCTAs(); });
  } else {
    sanitizeLinks(); normalizeCTAs();
  }
})();
