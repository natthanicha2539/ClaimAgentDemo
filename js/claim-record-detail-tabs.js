/* ============================================================
   แจ้งเคลม > ค้นหาการแจ้งเคลม > ดูรายละเอียด
   Accessibility adapter for the existing Claim Record tabs.
   ============================================================ */
(function () {
  'use strict';

  const tabKeys = ['claim', 'history', 'transfer', 'deduct'];

  function syncState(activeKey) {
    document.querySelectorAll('#claimRecordPhDetailPage .crd-tab[data-crd-tab]').forEach(button => {
      const active = button.dataset.crdTab === activeKey;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    tabKeys.forEach(key => {
      const panel = document.getElementById(`crdTab${key.charAt(0).toUpperCase()}${key.slice(1)}`);
      if (panel) panel.hidden = key !== activeKey;
    });
  }

  function activate(key, focus) {
    if (!tabKeys.includes(key) || typeof window.switchClaimRecordDetailTab !== 'function') return;
    window.switchClaimRecordDetailTab(key);
    syncState(key);
    if (focus) document.querySelector(`#claimRecordPhDetailPage .crd-tab[data-crd-tab="${key}"]`)?.focus();
  }

  function bind() {
    const tabList = document.querySelector('#claimRecordPhDetailPage .crd-tabs');
    if (!tabList || tabList.dataset.crdAccessibleBound === 'true') return;
    tabList.dataset.crdAccessibleBound = 'true';
    tabList.addEventListener('click', event => {
      const button = event.target.closest('.crd-tab[data-crd-tab]');
      if (button) syncState(button.dataset.crdTab);
    });
    tabList.addEventListener('keydown', event => {
      const button = event.target.closest('.crd-tab[data-crd-tab]');
      if (!button) return;
      const index = tabKeys.indexOf(button.dataset.crdTab);
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabKeys.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabKeys.length) % tabKeys.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabKeys.length - 1;
      else return;
      event.preventDefault();
      activate(tabKeys[next], true);
    });
    syncState('claim');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
