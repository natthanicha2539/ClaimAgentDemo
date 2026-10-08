/* Local file preview only. Real deployments must provide claimAgentCwiRuntime. */
(function () {
  'use strict';
  if (window.location.protocol !== 'file:' || window.claimAgentCwiRuntime) return;

  const script = document.createElement('script');
  script.src = 'js/mock-data/correct-wrong-insured.mock.js?v=2';
  script.onload = function () {
    if (window.claimAgentCwiRuntime || typeof window.claimAgentCwiCreateMockRuntime !== 'function') return;
    window.claimAgentCwiRuntime = window.claimAgentCwiCreateMockRuntime({
      name: 'เจ้าหน้าที่สาธิต',
      position: 'DO'
    });
    window.dispatchEvent(new Event('claimagent:cwi-runtime-ready'));
  };
  script.onerror = function () {
    console.error('[ClaimAgent] Unable to load local claim correction demo data.');
  };
  document.head.appendChild(script);
})();
