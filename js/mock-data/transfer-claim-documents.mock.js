/* Demo assets for แจ้งเคลม > รายละเอียดการแจ้งเคลม. Never used in auto mode. */
(function () {
  'use strict';

  function svgDocument(title, subtitle, number, accent) {
    const safe = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
      <rect width="800" height="1100" fill="#fff"/><rect x="0" y="0" width="800" height="14" fill="${accent}"/>
      <rect x="55" y="62" width="690" height="970" rx="14" fill="#fff" stroke="#d8e3ef" stroke-width="2"/>
      <circle cx="116" cy="124" r="33" fill="#eaf2ff"/><path d="M116 103v42M95 124h42" stroke="${accent}" stroke-width="9" stroke-linecap="round"/>
      <text x="168" y="116" font-family="Arial,sans-serif" font-size="31" font-weight="bold" fill="#10243e">${safe(title)}</text>
      <text x="168" y="151" font-family="Arial,sans-serif" font-size="18" fill="#6d7d90">${safe(subtitle)}</text>
      <path d="M90 190h620" stroke="#dfe8f2" stroke-width="2"/>
      <text x="94" y="248" font-family="Arial,sans-serif" font-size="18" fill="#6d7d90">DOCUMENT REF</text>
      <text x="94" y="290" font-family="Arial,sans-serif" font-size="26" font-weight="bold" fill="#10243e">${safe(number)}</text>
      <path d="M94 348h520M94 398h610M94 448h575M94 498h608M94 548h470" stroke="#c8d7e8" stroke-width="13" stroke-linecap="round"/>
      <rect x="94" y="653" width="612" height="180" rx="12" fill="#f6f8fc" stroke="#dfe8f2"/>
      <path d="M116 700h275M116 747h540M116 794h396" stroke="#c8d7e8" stroke-width="11" stroke-linecap="round"/>
      <path d="M480 953h205" stroke="${accent}" stroke-width="3"/><text x="520" y="984" font-family="Arial,sans-serif" font-size="15" fill="#6d7d90">DEMO DOCUMENT</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function pdfDocument() {
    const lines = [
      'BT /F1 24 Tf 70 740 Td (CLAIM RECEIPT) Tj ET',
      'BT /F1 13 Tf 70 703 Td (ClaimAgent demo document) Tj ET',
      'BT /F1 12 Tf 70 655 Td (Document ref: DEMO-REC-001) Tj ET',
      'BT /F1 12 Tf 70 630 Td (Medical expenses receipt) Tj ET',
      'BT /F1 12 Tf 70 605 Td (Amount: THB 420.00) Tj ET',
      '70 580 m 525 580 l S'
    ];
    const stream = lines.join('\n') + '\n';
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      `<< /Length ${stream.length} >>\nstream\n${stream}endstream`
    ];
    let content = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(content.length);
      content += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const start = content.length;
    content += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach(offset => { content += `${String(offset).padStart(10, '0')} 00000 n \n`; });
    content += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
    return URL.createObjectURL(new Blob([content], { type: 'application/pdf' }));
  }

  let receiptUrl;
  window.ClaimAgentTransferDocumentMocks = Object.freeze({
    getCategories(scenario) {
      const certificateFiles = [1, 2, 3].map(number => ({
        name: `ใบรับรองแพทย์ ${number}.svg`,
        mimeType: 'image/svg+xml',
        url: svgDocument('ใบรับรองแพทย์', `เอกสารตัวอย่าง ${number} จาก 3`, `DEMO-MED-00${number}`, '#1458d6')
      }));
      if (scenario === 'single') return [{ name: 'ใบรับรองแพทย์', icon: 'medical_information', files: certificateFiles }];
      if (scenario !== 'multiple') return [];
      receiptUrl ||= pdfDocument();
      return [
        { name: 'ใบรับรองแพทย์', icon: 'medical_information', files: [certificateFiles[0]] },
        { name: 'ใบเสร็จรับเงิน', icon: 'receipt_long', files: [{ name: 'ใบเสร็จรับเงิน.pdf', mimeType: 'application/pdf', url: receiptUrl }] },
        { name: 'บัตรประชาชน', icon: 'badge', files: [{ name: 'บัตรประชาชน.svg', mimeType: 'image/svg+xml', url: svgDocument('บัตรประชาชน', 'ตัวอย่างสำหรับทดสอบ', 'DEMO-ID-001', '#2f7df3') }] }
      ];
    }
  });
})();
