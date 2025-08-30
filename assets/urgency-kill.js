// assets/urgency-kill.js
(function () {
  // Phrases to suppress globally
  const PATTERNS = [/slots?\s*left/i, /new\s+slot\s+opens/i, /slots?\s+available/i];

  // Skip hiding if element or ancestors have .keep or data-keep
  function isKept(el) {
    return el.closest('.keep,[data-keep]') !== null;
  }

  function textMatches(el) {
    const txt = (el.textContent || '').trim();
    if (!txt) return false;
    return PATTERNS.some((re) => re.test(txt));
  }

  function findHideTarget(el) {
    // Prefer a small visual container if present
    let target = el;
    for (let i = 0; i < 3; i++) {
      const p = target.parentElement;
      if (!p) break;
      if (/(badge|pill|tag|chip|hint|status|note)/i.test(p.className || '')) {
        target = p; break;
      }
      target = p;
    }
    return target;
  }

  function hide(el) {
    const t = findHideTarget(el);
    if (!t || isKept(t)) return;
    t.style.display = 'none';
    t.setAttribute('aria-hidden', 'true');
  }

  function scanRoot(root) {
    const nodes = root.querySelectorAll
      ? root.querySelectorAll('[class*="badge"],[class*="pill"],[class*="tag"],[class*="chip"],[role="status"],.pill,.badge,.tag,.chip, .row span, .card .pill, .card .badge')
      : [];
    nodes.forEach((n) => { if (textMatches(n) && !isKept(n)) hide(n); });

    // Fallback: catch any other stray element with matching text (limited)
    const all = root.querySelectorAll ? root.querySelectorAll('span, small, div') : [];
    all.forEach((n) => {
      if (n.childElementCount === 0 && textMatches(n) && !isKept(n)) hide(n);
    });
  }

  function boot() {
    scanRoot(document.body);
    // Watch for future inserts (e.g., components rendering late)
    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          scanRoot(node);
          if (textMatches(node)) hide(node);
        });
      });
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
