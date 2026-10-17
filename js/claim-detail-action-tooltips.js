/* Presentation-only tooltip portal, shared by both claim detail routes. */
(function () {
  'use strict';
  const tooltip = document.createElement('div');
  tooltip.id = 'claimDetailActionTooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.appendChild(tooltip);
  let anchor = null;
  const target = event => {
    const button = event.target?.closest?.('.claim-detail-icon-action[data-tooltip], .tt-action-icon[data-tooltip]');
    return button?.closest('#transferClaimDetailPage, #claimRecordPhDetailPage, #transferTrackingPage') ? button : null;
  };
  function hide() {
    if (anchor) {
      const ids = (anchor.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== tooltip.id);
      if (ids.length) anchor.setAttribute('aria-describedby', ids.join(' '));
      else anchor.removeAttribute('aria-describedby');
    }
    anchor = null;
    tooltip.hidden = true;
  }
  function show(button) {
    if (!button || button.disabled) return;
    hide();
    anchor = button;
    tooltip.textContent = button.dataset.tooltip;
    tooltip.hidden = false;
    const ids = (button.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    button.setAttribute('aria-describedby', [...new Set([...ids, tooltip.id])].join(' '));
    const rect = button.getBoundingClientRect();
    const tip = tooltip.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left + (rect.width - tip.width) / 2, window.innerWidth - tip.width - 8));
    const top = rect.top >= tip.height + 12 ? rect.top - tip.height - 8 : rect.bottom + 8;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${Math.max(8, Math.min(top, window.innerHeight - tip.height - 8))}px`;
  }
  document.addEventListener('pointerover', event => { const button = target(event); if (button && button !== anchor) show(button); });
  document.addEventListener('pointerout', event => { const button = target(event); if (button === anchor && !button?.contains(event.relatedTarget)) hide(); });
  document.addEventListener('focusin', event => { const button = target(event); if (button) show(button); });
  document.addEventListener('focusout', event => { if (target(event) === anchor) hide(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  document.addEventListener('click', hide);
  document.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
})();
