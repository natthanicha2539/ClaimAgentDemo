/* Death & Disability: additional session-only payment examples, one CPG per beneficiary. */
(function () {
  'use strict';

  const examples = [
    {
      claimNo: 'CL690800230', caseNo: 'CC690800230', created: '25/08/2569 14:25:10',
      insured: 'นายธีรภัทร นาคเจริญ', product: 'PH', branch: 'กรุงเทพมหานคร',
      beneficiaries: [
        { relation: 'คู่สมรส', name: 'นางสาวชลธิชา นาคเจริญ', bank: 'ไทยพาณิชย์', account: '429-2-773401', amount: 30000 },
        { relation: 'บุตร', name: 'นายปณิธาน นาคเจริญ', bank: 'กรุงไทย', account: '612-0-481205', amount: 30000 }
      ]
    },
    {
      claimNo: 'CLPA690800231', caseNo: 'CCPA690800231', created: '25/08/2569 10:18:42',
      insured: 'เด็กหญิงนลินี วงศ์ประเสริฐ', product: 'PA', branch: 'เชียงใหม่',
      beneficiaries: [
        { relation: 'มารดา', name: 'นางสาวจิราพร วงศ์ประเสริฐ', bank: 'กสิกรไทย', account: '054-1-882713', amount: 80000 }
      ]
    },
    {
      claimNo: 'CL690800232', caseNo: 'CC690800232', created: '24/08/2569 16:52:09',
      insured: 'นางสาวเบญจมาศ ศรีสมบูรณ์', product: 'PH', branch: 'ขอนแก่น',
      beneficiaries: [
        { relation: 'บิดา', name: 'นายสมเกียรติ ศรีสมบูรณ์', bank: 'กรุงเทพ', account: '198-0-552613', amount: 45000 },
        { relation: 'มารดา', name: 'นางประไพ ศรีสมบูรณ์', bank: 'ออมสิน', account: '020-4-749865', amount: 15000 }
      ]
    }
  ];

  const rows = window.deathTransferPendingRows = Array.isArray(window.deathTransferPendingRows)
    ? window.deathTransferPendingRows : [];
  let sequence = 201;
  examples.forEach(claim => claim.beneficiaries.forEach((beneficiary, beneficiaryIndex) => {
    const sourceKey = `demo:${claim.claimNo}:${beneficiaryIndex + 1}`;
    const refNo = `CPG690800${String(sequence++).padStart(3, '0')}`;
    if (rows.some(row => row.sourceKey === sourceKey)) return;
    rows.push({
      sourceKey, refNo, claimNo: claim.claimNo, caseNo: claim.caseNo,
      created: claim.created, notifyDate: '-', transferDate: '-',
      insured: claim.insured, school: '', product: claim.product, claimType: 'Death&Disability',
      amount: beneficiary.amount, status: 'รอโอนเงิน', statusKey: 'wait', statusFilter: 'pending',
      bank: beneficiary.bank, account: beneficiary.account, payee: beneficiary.name,
      payeeRelation: beneficiary.relation, recipient: beneficiary.name,
      recipientCaption: `${beneficiary.relation} · ผู้รับผลประโยชน์ลำดับที่ ${beneficiaryIndex + 1}`,
      branch: claim.branch, canEdit: false, canPay: true, transferKind: 'Death&Disability',
      beneficiaries: [{
        relation: beneficiary.relation, name: beneficiary.name,
        bank: `${beneficiary.bank} ${beneficiary.account} ${beneficiary.name}`,
        amount: beneficiary.amount,
        note: `ผู้รับผลประโยชน์ลำดับที่ ${beneficiaryIndex + 1} · ${beneficiary.relation}`
      }],
      claims: [{
        claimNo: claim.claimNo, caseNo: claim.caseNo, insured: claim.insured,
        amount: beneficiary.amount, product: claim.product
      }]
    });
  }));
})();
