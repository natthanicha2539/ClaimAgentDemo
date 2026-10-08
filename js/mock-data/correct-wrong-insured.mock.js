/* Isolated session data for the wrong-insured workflow. Never used as a production data source. */
(function () {
  'use strict';
  const clone = value => structuredClone(value);
  const base = {
    nextSequence: 100,
    claims: [
      {
        cl: 'CL690900001', cases: [{ number: 'CC69090000101', status: 'Open' }], status: 'Open', billed: false,
        claimType: 'MEDICAL', product: 'PH', insuredId: 'I-PH-1', insuredName: 'นายธนกฤต วัฒนชัย', nationalId: '1100100123456',
        appId: 'PH900001', policyRef: 'POL-PH-001', appStatus: 'มีผลคุ้มครอง', plan: 'PH Gold',
        amount: 2100, cause: 'เจ็บป่วย', treatment: 'IPD', benefitType: 'ค่ารักษา', benefitCode: 'MED_IPD',
        eventDate: '05/09/2569', admitDate: '05/09/2569', dischargeDate: '08/09/2569',
        claimInformation: 'รักษาอาการเจ็บป่วยแบบผู้ป่วยใน', notifiedAt: '09/09/2569 10:15', branch: 'สำนักงานใหญ่',
        notifier: '08135 - นายณัฐภูมิ กองเพ็ง', createdBy: '08135 - นายณัฐภูมิ กองเพ็ง',
        bank: 'กรุงไทย', accountNo: '123-4-56789-0', accountName: 'นายธนกฤต วัฒนชัย',
        transactionCodes: ['CPG690900001', 'NPL690900001'], documentCodes: ['DOC690900001'],
        history: [{ kind: 'CLAIM_CREATED', reference: 'CL690900001', at: '2026-09-09T03:15:00.000Z', actor: '08135 - นายณัฐภูมิ กองเพ็ง' }]
      },
      {
        cl: 'CLPA690900002', cases: [{ number: 'CC69090000201', status: 'Open' }], status: 'Open', billed: false,
        claimType: 'MEDICAL', product: 'PA', insuredId: 'I-PA-1', insuredName: 'เด็กหญิงปวริศา ศรีบุญ', nationalId: '1100100222222',
        appId: 'PA900001', policyRef: 'POL-PA-001', appStatus: 'มีผลคุ้มครอง', plan: 'PA Student',
        amount: 1000, cause: 'อุบัติเหตุ', treatment: 'OPD', benefitType: 'ค่ารักษา', benefitCode: 'MED_OPD',
        eventDate: '12/09/2569', admitDate: '12/09/2569', dischargeDate: '12/09/2569',
        claimInformation: 'รักษาอุบัติเหตุแบบผู้ป่วยนอก', notifiedAt: '13/09/2569 09:20', branch: 'เชียงใหม่',
        notifier: '08142 - นางสาววราภรณ์ วัฒนะ', createdBy: '08142 - นางสาววราภรณ์ วัฒนะ',
        bank: 'กสิกรไทย', accountNo: '555-2-00123-0', accountName: 'นายวิชัย ศรีบุญ',
        school: { name: 'โรงเรียนสาธิตเชียงใหม่', address: 'อำเภอเมือง จังหวัดเชียงใหม่', contact: 'นางสาวนลินี', position: 'ครูประจำชั้น', reference: 'SCH69090002', phone: '053-000-002' },
        transactionCodes: [], documentCodes: [], history: []
      },
      { cl: 'CL690900003', cases: [{ number: 'CC69090000301', status: 'Re-Open' }], status: 'Re-Open', claimType: 'MEDICAL', product: 'PH', billed: false },
      { cl: 'CL690900004', cases: [{ number: 'CC69090000401', status: 'Open' }], status: 'Open', claimType: 'DEATH', product: 'PH', billed: false },
      { cl: 'CL690900005', cases: [{ number: 'CC69090000501', status: 'Open' }], status: 'Open', claimType: 'MEDICAL', product: 'PH', billed: true },
      { cl: 'CL690900006', cases: [{ number: 'CC69090000601', status: 'Open' }, { number: 'CC69090000602', status: 'Open' }], status: 'Open', claimType: 'MEDICAL', product: 'PH', billed: false, continuous: true },
      { cl: 'CL690900007', cases: [{ number: 'CC69090000701', status: 'Open' }], status: 'Open', claimType: 'DISABILITY', product: 'PA', billed: false },
      { cl: 'CL690900008', cases: [{ number: 'CC69090000801', status: 'Open' }], status: 'Open', claimType: 'HOSPITAL', product: 'PH', billed: false }
    ],
    insured: [
      { insuredId: 'I-PH-2', appId: 'PH900002', passport: 'GPH900002', policyRef: 'POL-PH-002', name: 'นางสาวพิมพ์นภา ศรีสุข', nationalId: '1100100333333', product: 'PH', plan: 'PH Gold', appStatus: 'มีผลคุ้มครอง', coverageStart: '2026-01-01', coverageEnd: '2026-12-31', benefits: [{ code: 'MED_IPD', type: 'ค่ารักษา', perClaimLimit: 5000, usedLimit: 2000, remainingLimit: 3000 }] },
      { insuredId: 'I-PH-3', appId: 'PH900003', passport: 'GPH900003', policyRef: 'POL-PH-003', name: 'นายจิรายุ ทองดี', nationalId: '1100100444444', product: 'PH', plan: 'PH Silver', appStatus: 'มีผลคุ้มครอง', coverageStart: '2026-01-01', coverageEnd: '2026-08-31', benefits: [{ code: 'MED_IPD', type: 'ค่ารักษา', perClaimLimit: 5000, usedLimit: 0, remainingLimit: 5000 }] },
      { insuredId: 'I-PH-4', appId: 'PH900004', passport: 'GPH900004', policyRef: 'POL-PH-004', name: 'นางสาวสุภาวดี บัวแก้ว', nationalId: '1100100555555', product: 'PH', plan: 'PH Basic', appStatus: 'มีผลคุ้มครอง', coverageStart: '2026-01-01', coverageEnd: '2026-12-31', benefits: [{ code: 'MED_IPD', type: 'ค่ารักษา', perClaimLimit: 2000, usedLimit: 0, remainingLimit: 2000 }] },
      { insuredId: 'I-PA-2', appId: 'PA900002', passport: 'GPA900002', policyRef: 'POL-PA-002', name: 'เด็กหญิงรินรดา แสงทอง', nationalId: '1100100666666', product: 'PA', plan: 'PA Student', planType: 'แผนสถานศึกษา', insuredType: 'นักเรียน', appStatus: 'มีผลคุ้มครอง', coverageStart: '2026-01-01', effectiveDate: '2026-01-01', coverageEnd: '2026-12-31', benefits: [{ code: 'MED_OPD', type: 'ค่ารักษา', perClaimLimit: 1500, usedLimit: 300, remainingLimit: 1200, remainingVisits: 3 }] },
      { insuredId: 'I-PA-3', appId: 'PA900003', passport: 'GPA900003', policyRef: 'POL-PA-003', name: 'เด็กหญิงปภาวี นาคทอง', nationalId: '1100100777777', product: 'PA', plan: 'PA Student', planType: 'แผนสถานศึกษา', insuredType: 'นักเรียน', appStatus: 'มีผลคุ้มครอง', coverageStart: '2026-01-01', effectiveDate: '2026-01-01', coverageEnd: '2026-12-31', benefits: [{ code: 'ACC_OPD', type: 'ค่าชดเชย', perClaimLimit: 3000, usedLimit: 0, remainingLimit: 3000 }] }
    ],
    transactions: [
      { code: 'CPG690900001', at: '2026-09-10T07:53:51.000Z', type: 'โอนเงินครั้งแรก', amount: 2100, actor: 'ระบบโอนเงิน', documentCodes: ['DOC-TX-690900001'] },
      { code: 'NPL690900001', at: '2026-09-09T08:00:00.000Z', type: 'NPL', amount: 500, actor: 'ระบบตั้งหนี้', documentCodes: ['DOC-NPL-690900001'] }
    ],
    documents: [
      { code: 'DOC690900001', name: 'เอกสารประกอบเคลม' },
      { code: 'DOC-TX-690900001', name: 'เอกสารธุรกรรม' },
      { code: 'DOC-NPL-690900001', name: 'ใบตั้งหนี้ NPL' }
    ],
    transactionLinks: [{ code: 'CPG690900001', cl: 'CL690900001' }, { code: 'NPL690900001', cl: 'CL690900001' }],
    documentLinks: [{ code: 'DOC690900001', cl: 'CL690900001' }],
    corrections: []
  };

  function createMockRuntime(actor) {
    let data = clone(base);
    let queue = Promise.resolve();
    const repository = {
      now: () => new Date().toISOString(),
      allocate(draft, claim) {
        const n = String(draft.nextSequence++).padStart(5, '0');
        return { cl: `${claim.product === 'PA' ? 'CLPA' : 'CL'}6909${n}`, cc: `CC6909${n}01`, reference: `CORR6909${n}` };
      },
      transaction(callback) {
        const task = queue.then(async () => {
          const draft = clone(data);
          const result = await callback(draft);
          data = draft;
          return result;
        });
        queue = task.catch(() => {});
        return task;
      }
    };
    return {
      isMock: true,
      getActor: () => actor ? clone(actor) : null,
      getSnapshot: () => clone(data),
      searchInsured(product, field, query) {
        const q = String(query || '').trim().toLocaleLowerCase('th-TH');
        const key = { name: 'name', nationalId: 'nationalId', passport: 'passport', appId: 'appId' }[field] || 'name';
        return clone(data.insured.filter(person => person.product === product && String(person[key] || '').toLocaleLowerCase('th-TH').includes(q)));
      },
      commit: (request, currentActor) => window.claimAgentWrongInsuredDomain.commitCorrection(repository, request, currentActor)
    };
  }

  window.claimAgentCwiCreateMockRuntime = createMockRuntime;
  if (!window.claimAgentCwiRuntime && window.claimAgentCwiDemoActor) window.claimAgentCwiRuntime = createMockRuntime(window.claimAgentCwiDemoActor);
})();
