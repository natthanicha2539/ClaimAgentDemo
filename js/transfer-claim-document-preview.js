/* แจ้งเคลม > ติดตามการโอนเงิน > รายละเอียดการแจ้งเคลม: scoped document viewer. */
(function () {
  'use strict';

  const page = document.getElementById('transferClaimDetailPage');
  const panel = document.getElementById('tdrPanelClaim');
  const selectorWrap = document.getElementById('tdrDocumentScenario');
  const selector = document.getElementById('tdrDocumentScenarioSelect');
  if (!page || !panel || !selectorWrap || !selector) return;

  const demoMode = window.CLAIM_AGENT_DEMO_MODE !== false && (
    window.CLAIM_AGENT_DEMO_MODE === true ||
    document.documentElement.dataset.claimAgentMode === 'demo' ||
    location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname)
  );
  let activeRow = null;
  let categories = [];
  let categoryIndex = 0;
  let fileIndex = 0;
  let zoom = 1;
  let sourceButton = null;
  let scrollPosition = 0;
  let transitioning = false;
  let pendingCategoryFocus = null;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const iconFor = name => /แพทย์|medical/i.test(name) ? 'medical_information' :
    /เสร็จ|receipt/i.test(name) ? 'receipt_long' : /บัตร|identity|id/i.test(name) ? 'badge' : 'description';
  const allowedUrl = value => {
    const url = String(value || '').trim();
    if (!url || /[\u0000-\u001f]/.test(url)) return '';
    if (/^(?:https?:|blob:|data:image\/(?:png|jpeg|gif|webp|svg\+xml);|data:application\/pdf;)/i.test(url)) return url;
    if (/^(?:\.\.?\/|\/)?[\w./%-]+(?:\?[\w=&%-]+)?$/i.test(url) && !url.startsWith('//')) return url;
    return '';
  };
  const isPdf = file => /pdf/i.test(file.mimeType || '') || /\.pdf(?:$|\?)/i.test(file.url || '');
  const normaliseFile = (source, fallbackName) => {
    if (typeof source === 'string') source = { url: source };
    if (!source || typeof source !== 'object') return null;
    const url = allowedUrl(source.url || source.fileUrl || source.src || source.documentUrl || source.path);
    if (!url) return null;
    return { url, name: String(source.name || source.fileName || fallbackName || 'เอกสาร'), mimeType: String(source.mimeType || source.contentType || '') };
  };
  const belongsToClaim = (documentItem, claimNo, caseNo) => {
    const documentClaim = documentItem.claimNo || documentItem.claimNumber || documentItem.clNo;
    const documentCase = documentItem.caseNo || documentItem.caseNumber || documentItem.ccNo;
    return (!documentClaim || String(documentClaim) === String(claimNo)) &&
      (!documentCase || String(documentCase) === String(caseNo));
  };
  function actualCategories(row, index, claimNo, caseNo) {
    const claims = Array.isArray(row?.claims) && row.claims.length ? row.claims : [row];
    const claim = claims[index] || null;
    const claimDocuments = Array.isArray(claim?.documents) && claim.documents.length ? claim.documents : claim?.attachments;
    let documents = Array.isArray(claimDocuments) ? claimDocuments : [];
    const rowDocuments = Array.isArray(row?.documents) && row.documents.length ? row.documents : row?.attachments;
    if (!documents.length && Array.isArray(rowDocuments)) {
      documents = rowDocuments.filter(item =>
        item && (claims.length === 1 || item.claimNo || item.claimNumber || item.clNo || item.caseNo || item.caseNumber || item.ccNo) &&
        belongsToClaim(item, claimNo, caseNo));
    }
    const grouped = new Map();
    documents.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const name = String(item.category || item.documentType || item.typeName || item.categoryName || item.type || '').trim() || 'เอกสารอื่น ๆ';
      const rawFiles = Array.isArray(item.files) ? item.files : [item];
      const files = rawFiles.map((file, fileNo) => normaliseFile(file, `${name} ${fileNo + 1}`)).filter(Boolean);
      if (!files.length) return;
      if (!grouped.has(name)) grouped.set(name, { name, icon: iconFor(name), files: [] });
      grouped.get(name).files.push(...files);
    });
    return Array.from(grouped.values());
  }

  const chooser = document.createElement('dialog');
  chooser.id = 'tdrDocumentChooser';
  chooser.className = 'tdr-document-dialog tdr-document-chooser';
  chooser.setAttribute('aria-labelledby', 'tdrDocumentChooserTitle');
  chooser.innerHTML = `<div class="tdr-document-dialog-head"><span class="tdr-document-head-icon material-icons-round" aria-hidden="true">folder_open</span><div><span class="tdr-document-eyebrow">เอกสารประกอบการแจ้งเคลม</span><h4 id="tdrDocumentChooserTitle">เลือกประเภทเอกสาร</h4></div><button type="button" class="tdr-document-icon-btn" data-doc-action="close" aria-label="ปิด"><span class="material-icons-round" aria-hidden="true">close</span></button></div><div id="tdrDocumentChooserBody" class="tdr-document-chooser-body"></div>`;
  const preview = document.createElement('dialog');
  preview.id = 'tdrDocumentPreview';
  preview.className = 'tdr-document-dialog tdr-document-preview';
  preview.setAttribute('aria-labelledby', 'tdrDocumentPreviewTitle');
  preview.innerHTML = `<div class="tdr-document-dialog-head"><span class="tdr-document-head-icon material-icons-round" aria-hidden="true">description</span><div class="tdr-document-title-wrap"><span class="tdr-document-eyebrow">เอกสารประกอบการแจ้งเคลม</span><h4 id="tdrDocumentPreviewTitle"></h4><span id="tdrDocumentPreviewCount" class="tdr-document-preview-count"></span></div><button type="button" class="tdr-document-icon-btn" data-doc-action="close" aria-label="ปิด"><span class="material-icons-round" aria-hidden="true">close</span></button></div><div class="tdr-document-toolbar"><button type="button" class="tdr-document-text-btn" id="tdrDocumentBack" data-doc-action="back"><span class="material-icons-round" aria-hidden="true">arrow_back</span>เลือกประเภทเอกสาร</button><div class="tdr-document-toolbar-spacer"></div><button type="button" class="tdr-document-icon-btn" data-doc-action="zoom-out" aria-label="ย่อ"><span class="material-icons-round" aria-hidden="true">zoom_out</span></button><span id="tdrDocumentZoomLabel" class="tdr-document-zoom-label">100%</span><button type="button" class="tdr-document-icon-btn" data-doc-action="zoom-in" aria-label="ขยาย"><span class="material-icons-round" aria-hidden="true">zoom_in</span></button><button type="button" class="tdr-document-text-btn tdr-document-save-btn" data-doc-action="save" aria-label="ดาวน์โหลดเอกสาร"><span class="material-icons-round" aria-hidden="true">file_download</span><span>ดาวน์โหลด</span></button></div><div class="tdr-document-preview-layout"><aside class="tdr-document-thumbnails" aria-label="รายการไฟล์เอกสาร"></aside><div class="tdr-document-stage-wrap"><div class="tdr-document-stage" id="tdrDocumentStage"></div><div class="tdr-document-pager"><button type="button" class="tdr-document-text-btn" data-doc-action="previous"><span class="material-icons-round" aria-hidden="true">chevron_left</span>ก่อนหน้า</button><span id="tdrDocumentPageCount"></span><button type="button" class="tdr-document-text-btn" data-doc-action="next">ถัดไป<span class="material-icons-round" aria-hidden="true">chevron_right</span></button></div></div></div>`;
  document.body.append(chooser, preview);

  const chooserBody = chooser.querySelector('#tdrDocumentChooserBody');
  const thumbnails = preview.querySelector('.tdr-document-thumbnails');
  const stage = preview.querySelector('#tdrDocumentStage');

  function restoreDetail() {
    if (chooser.open || preview.open || transitioning) return;
    window.scrollTo({ top: scrollPosition, behavior: 'auto' });
    if (sourceButton?.isConnected) sourceButton.focus({ preventScroll: true });
    sourceButton = null;
  }
  chooser.addEventListener('close', restoreDetail);
  preview.addEventListener('close', restoreDetail);
  [chooser, preview].forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  }));
  function closeAll() {
    transitioning = false;
    if (chooser.open) chooser.close();
    if (preview.open) preview.close();
  }
  function showChooser() {
    transitioning = true;
    if (preview.open) preview.close();
    chooserBody.innerHTML = categories.length ? `<div class="tdr-document-list">${categories.map((category, index) => `<button type="button" class="tdr-document-category" data-category-index="${index}"><span class="tdr-document-category-icon material-icons-round" aria-hidden="true">${escapeHtml(category.icon || iconFor(category.name))}</span><span class="tdr-document-category-name">${escapeHtml(category.name)}</span><span class="tdr-document-chip">${category.files.length} ไฟล์</span><span class="material-icons-round tdr-document-chevron" aria-hidden="true">chevron_right</span></button>`).join('')}</div>` : `<div class="tdr-document-empty"><span class="material-icons-round" aria-hidden="true">folder_off</span><strong>ไม่มีเอกสารประกอบการแจ้งเคลม</strong><p>ยังไม่มีเอกสารที่เปิดดูได้สำหรับรายการนี้</p></div>`;
    if (!chooser.open) chooser.showModal();
    const focusTarget = pendingCategoryFocus == null ? chooser.querySelector('.tdr-document-category, [data-doc-action="close"]') : chooser.querySelector(`[data-category-index="${pendingCategoryFocus}"]`);
    pendingCategoryFocus = null;
    focusTarget?.focus();
    transitioning = false;
  }
  function renderFile() {
    const category = categories[categoryIndex];
    const file = category?.files[fileIndex];
    if (!file) return;
    preview.querySelector('#tdrDocumentPreviewTitle').textContent = category.name;
    preview.querySelector('#tdrDocumentPreviewCount').textContent = `${category.files.length} ไฟล์ · ไฟล์ปัจจุบัน ${fileIndex + 1}`;
    preview.querySelector('#tdrDocumentPageCount').textContent = `${fileIndex + 1} / ${category.files.length}`;
    preview.querySelector('#tdrDocumentZoomLabel').textContent = `${Math.round(zoom * 100)}%`;
    preview.querySelector('#tdrDocumentBack').hidden = categories.length < 2;
    preview.querySelector('[data-doc-action="previous"]').disabled = fileIndex === 0;
    preview.querySelector('[data-doc-action="next"]').disabled = fileIndex === category.files.length - 1;
    preview.querySelector('[data-doc-action="zoom-out"]').disabled = zoom <= .5;
    preview.querySelector('[data-doc-action="zoom-in"]').disabled = zoom >= 2;
    thumbnails.innerHTML = category.files.map((item, index) => `<button type="button" class="tdr-document-thumb ${index === fileIndex ? 'active' : ''}" data-file-index="${index}" aria-label="ดูไฟล์ ${index + 1}: ${escapeHtml(item.name)}" aria-current="${index === fileIndex ? 'true' : 'false'}"><span class="tdr-document-thumb-art">${isPdf(item) ? '<span class="material-icons-round" aria-hidden="true">picture_as_pdf</span>' : `<img src="${escapeHtml(item.url)}" alt="">`}</span><span class="tdr-document-thumb-label">${escapeHtml(item.name)}</span></button>`).join('');
    stage.replaceChildren();
    const frame = document.createElement(isPdf(file) ? 'iframe' : 'img');
    frame.className = 'tdr-document-file';
    if (isPdf(file)) {
      frame.title = file.name;
      frame.src = file.url;
    } else {
      frame.alt = file.name;
      frame.src = file.url;
    }
    frame.style.transform = `scale(${zoom})`;
    stage.append(frame);
  }
  function updateZoom(nextZoom) {
    zoom = Math.max(.5, Math.min(2, nextZoom));
    preview.querySelector('#tdrDocumentZoomLabel').textContent = `${Math.round(zoom * 100)}%`;
    preview.querySelector('[data-doc-action="zoom-out"]').disabled = zoom <= .5;
    preview.querySelector('[data-doc-action="zoom-in"]').disabled = zoom >= 2;
    const file = stage.querySelector('.tdr-document-file');
    if (file) file.style.transform = `scale(${zoom})`;
  }
  function showPreview(index) {
    categoryIndex = index;
    fileIndex = 0;
    zoom = 1;
    transitioning = true;
    if (chooser.open) chooser.close();
    renderFile();
    if (!preview.open) preview.showModal();
    preview.querySelector('[data-doc-action="close"]').focus();
    transitioning = false;
  }
  function saveCurrentFile() {
    const file = categories[categoryIndex]?.files[fileIndex];
    if (!file) return;
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.rel = 'noopener';
    link.click();
  }
  chooser.addEventListener('click', event => {
    const categoryButton = event.target.closest('[data-category-index]');
    if (categoryButton) showPreview(Number(categoryButton.dataset.categoryIndex));
    else if (event.target.closest('[data-doc-action="close"]')) closeAll();
  });
  preview.addEventListener('click', event => {
    const fileButton = event.target.closest('[data-file-index]');
    if (fileButton) {
      fileIndex = Number(fileButton.dataset.fileIndex);
      zoom = 1;
      renderFile();
      return;
    }
    const action = event.target.closest('[data-doc-action]')?.dataset.docAction;
    if (action === 'close') closeAll();
    else if (action === 'back' && categories.length > 1) { pendingCategoryFocus = categoryIndex; showChooser(); }
    else if (action === 'previous' && fileIndex > 0) { fileIndex--; zoom = 1; renderFile(); }
    else if (action === 'next' && fileIndex < categories[categoryIndex].files.length - 1) { fileIndex++; zoom = 1; renderFile(); }
    else if (action === 'zoom-out' && zoom > .5) updateZoom(zoom - .25);
    else if (action === 'zoom-in' && zoom < 2) updateZoom(zoom + .25);
    else if (action === 'save') saveCurrentFile();
  });

  document.addEventListener('claimagent:transfer-detail-opened', event => {
    activeRow = event.detail?.row || null;
    sourceButton = null;
    closeAll();
    selector.value = 'auto';
    selectorWrap.hidden = !demoMode || activeRow?.transferMode === 'hospital';
  });
  panel.addEventListener('click', event => {
    const button = event.target.closest('.tdr-doc-btn');
    if (!button || !page.contains(button) || page.dataset.transferDetailMode === 'hospital') return;
    const tableRow = button.closest('tr');
    const index = Array.from(document.getElementById('tdrClaimTableBody')?.rows || []).indexOf(tableRow);
    if (!activeRow || index < 0) return;
    const claimNo = tableRow.cells[0]?.textContent.trim() || activeRow.claimNo;
    const caseNo = tableRow.cells[1]?.textContent.trim() || '';
    const scenario = demoMode ? selector.value : 'auto';
    categories = scenario === 'auto' ? actualCategories(activeRow, index, claimNo, caseNo) :
      window.ClaimAgentTransferDocumentMocks.getCategories(scenario);
    sourceButton = button;
    scrollPosition = window.scrollY;
    if (categories.length > 1 || !categories.length) showChooser();
    else showPreview(0);
  });
})();
