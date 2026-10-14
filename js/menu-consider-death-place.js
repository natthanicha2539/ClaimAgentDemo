/* พิจารณาเคลม > Death & Disability > รายละเอียด Death Claim */
(function () {
  'use strict';

  // ตัวอย่างของหน้าพิจารณาเก็บแยกจากข้อมูลแจ้งเคลม และไม่มีบริการกลางในเดโมนี้
  const exampleByClaim = {
    CL6906000104: {
      deathPlace: 'สถานพยาบาล',
      deathHospital: 'โรงพยาบาลพระรามเก้า',
      note: 'ผู้แจ้งระบุว่าเสียชีวิตระหว่างเข้ารับการรักษาที่โรงพยาบาล'
    }
  };

  function makeField(label, value, wide) {
    const field = document.createElement('div');
    if (wide) field.className = 'dd-field-span';
    const name = document.createElement('div');
    name.className = 'dd-field-label';
    name.textContent = label + ' :';
    const content = document.createElement('div');
    content.className = 'dd-field-value';
    content.textContent = value || '—';
    field.append(name, content);
    return field;
  }

  function applyPlace(claimCode) {
    const page = document.getElementById('considerDeathDetailPage');
    const grid = page?.querySelector('#ddClaimDetailGrid');
    if (!grid || !String(page.querySelector('#ddCoverageTypeValue')?.textContent || '').includes('เสียชีวิต')) return;
    const record = (window.considerDeathPlaceByClaim || {})[claimCode] || exampleByClaim[claimCode] || {};
    const rows = Array.from(grid.children);
    const labelOf = row => row.querySelector('.dd-field-label')?.textContent?.replace(/[\s:：]/g,'') || '';
    const insertBefore = rows.find(row => labelOf(row) === 'วันที่เกิดเหตุ') || null;
    rows.filter(row => ['สาเหตุการเสียชีวิต','สถานพยาบาล','หมายเหตุ','สถานที่เสียชีวิต','โรงพยาบาล','ระบุสถานที่เสียชีวิต'].includes(labelOf(row))).forEach(row => row.remove());
    const placeFields = window.claimRecordDeathMock?.placeFields?.(record) || [['สถานที่เสียชีวิต','—']];
    placeFields.concat([['หมายเหตุ', record.note || '—']]).forEach(([label, value]) => {
      grid.insertBefore(makeField(label, value, label === 'หมายเหตุ'), insertBefore);
    });
    page.querySelectorAll('#ddExpenseGrid .dd-benefit-row').forEach(row => {
      if (row.querySelector('span')?.textContent?.trim() === 'สาเหตุการเสียชีวิต') row.remove();
    });
  }

  const original = window.showConsiderDeathDetail;
  if (typeof original === 'function') window.showConsiderDeathDetail = function (claimCode) {
    const result = original.apply(this, arguments);
    applyPlace(String(claimCode || 'CL6906000104'));
    return result;
  };
})();
