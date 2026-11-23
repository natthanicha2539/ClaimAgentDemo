/* Business rules for จัดการข้อมูลแจ้งเคลม > แก้ไขเคลมผิดคน.
   Data and permissions come from an adapter; this file contains no sample records. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.claimAgentWrongInsuredDomain = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const allowedPositions = new Set(['DO', 'HO', 'AHO']);
  const reasons = new Set(['บันทึกผู้เอาประกันผิดคน', 'บันทึกผิดกรมธรรม์']);
  const supportedTypes = new Set(['MEDICAL', 'COMPENSATION']);
  const clone = value => structuredClone(value);
  const money = value => Math.round(Number(value) * 100);

  function canCorrect(actor) {
    return Boolean(actor && allowedPositions.has(String(actor.position || '').trim().toUpperCase()));
  }

  function validateSearch(type, raw) {
    const value = String(raw || '').trim().toUpperCase();
    if (!value) return { error: 'กรุณาระบุเลข CL หรือ CC ก่อนค้นหา' };
    if (!/^[A-Z0-9]+$/.test(value)) return { error: 'ระบุได้เฉพาะตัวอักษรภาษาอังกฤษ A-Z และตัวเลข 0-9' };
    return { value, type: type === 'CC' ? 'CC' : 'CL' };
  }

  function findClaim(snapshot, type, value) {
    return (snapshot.claims || []).find(claim => type === 'CC'
      ? (claim.cases || []).some(item => item.number === value)
      : claim.cl === value);
  }

  function claimEligibility(snapshot, type, raw) {
    const query = validateSearch(type, raw);
    if (query.error) return query;
    const claim = findClaim(snapshot, query.type, query.value);
    if (!claim) return { error: query.type === 'CC'
      ? 'ไม่พบเลข CC นี้ กรุณาตรวจสอบ Claim Case อีกครั้ง'
      : 'ไม่พบ ClaimNo นี้ กรุณาตรวจสอบเลข CL / CLPA อีกครั้ง' };
    if (!supportedTypes.has(String(claim.claimType || '').toUpperCase()))
      return { error: 'ไม่สามารถทำรายการได้ เนื่องจากประเภทเคลมนี้ไม่รองรับการแก้ไขเคลมผิดคน' };
    if (claim.status !== 'Open' || (claim.cases || []).some(item => item.status !== 'Open'))
      return { error: 'ไม่สามารถทำรายการได้ เนื่องจากสถานะเคลมไม่ใช่ Open' };
    if (claim.billed !== false)
      return { error: 'ไม่สามารถทำรายการได้ เนื่องจากเคลมถูกนำไปวางบิลแล้ว' };
    if (claim.continuous || !Array.isArray(claim.cases) || claim.cases.length !== 1)
      return { error: 'ไม่สามารถทำรายการได้ เนื่องจากเป็นเคลมต่อเนื่อง รองรับเฉพาะเคลมที่มี 1 CL : 1 CC เท่านั้น' };
    return { claim, query };
  }

  function dateValue(value) {
    if (typeof value !== 'string') return NaN;
    const thai = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (thai) {
      const year = Number(thai[3]) > 2400 ? Number(thai[3]) - 543 : Number(thai[3]);
      const date = Date.UTC(year, Number(thai[2]) - 1, Number(thai[1]));
      const check = new Date(date);
      return check.getUTCFullYear() === year && check.getUTCMonth() === Number(thai[2]) - 1 && check.getUTCDate() === Number(thai[1]) ? date : NaN;
    }
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return iso ? dateValue(`${iso[3]}/${iso[2]}/${iso[1]}`) : NaN;
  }

  function candidateEligibility(claim, candidate) {
    if (!candidate || candidate.product !== claim.product || candidate.appId === claim.appId)
      return { error: 'กรุณาเลือกผู้เอาประกันคนใหม่จากผลิตภัณฑ์เดียวกับเคลมเดิม' };
    const event = dateValue(claim.eventDate);
    const start = Math.max(dateValue(candidate.coverageStart), candidate.product === 'PA' && candidate.effectiveDate ? dateValue(candidate.effectiveDate) : -Infinity);
    const end = candidate.coverageEnd ? dateValue(candidate.coverageEnd) : Infinity;
    if (!Number.isFinite(event) || !Number.isFinite(start) || Number.isNaN(end) || event < start || event > end)
      return { error: 'วันที่เกิดเหตุไม่อยู่ในช่วงวันที่ได้รับความคุ้มครองของผู้เอาประกันคนใหม่' };
    const benefit = (candidate.benefits || []).find(item => item.type === claim.benefitType && (!claim.benefitCode || item.code === claim.benefitCode));
    if (!benefit) return { error: 'ไม่พบความคุ้มครอง' };
    const requested = money(claim.amount);
    if (!Number.isFinite(requested) || requested < 0 || benefit.perClaimLimit == null || benefit.remainingLimit == null || !Number.isFinite(money(benefit.perClaimLimit)) || !Number.isFinite(money(benefit.remainingLimit)))
      return { error: 'ข้อมูลวงเงิน Benefit ไม่ครบถ้วน' };
    if (requested > money(benefit.perClaimLimit) || requested > money(benefit.remainingLimit))
      return { error: 'วงเงิน Benefit ไม่เพียงพอสำหรับจำนวนเงินเคลม' };
    const needsVisit = claim.treatment === 'OPD' && claim.cause === 'เจ็บป่วย';
    if (needsVisit && (!Number.isInteger(benefit.remainingVisits) || benefit.remainingVisits < 1))
      return { error: 'จำนวนครั้ง Benefit คงเหลือต่อปีไม่เพียงพอ' };
    return {
      benefit,
      coverage: {
        plan: candidate.plan,
        benefitCode: benefit.code,
        benefitType: benefit.type,
        limitPerClaim: benefit.perClaimLimit,
        usedLimit: benefit.usedLimit,
        remainingBefore: benefit.remainingLimit,
        remainingAfter: (money(benefit.remainingLimit) - requested) / 100,
        remainingVisitsBefore: benefit.remainingVisits ?? null,
        remainingVisitsAfter: benefit.remainingVisits == null ? null : benefit.remainingVisits - (needsVisit ? 1 : 0)
      }
    };
  }

  function transferSummary(snapshot, claim) {
    const codes = new Set(claim.transactionCodes || []);
    const transactions = (snapshot.transactions || []).filter(item => codes.has(item.code)).sort((a, b) => String(b.at).localeCompare(String(a.at)));
    return {
      transfers: transactions.filter(item => item.type !== 'NPL'),
      npl: transactions.filter(item => item.type === 'NPL'),
      total: transactions.filter(item => item.type !== 'NPL').reduce((sum, item) => sum + money(item.amount), 0) / 100
    };
  }

  function correctionEligibility(snapshot, request, actor) {
    if (!canCorrect(actor)) return { error: 'คุณไม่มีสิทธิ์ใช้งานเมนูแก้ไขเคลมผิดคน' };
    const result = claimEligibility(snapshot, 'CL', request.oldCl);
    if (result.error) return result;
    if (!reasons.has(request.reason)) return { error: 'กรุณาเลือกหมายเหตุการแก้ไข' };
    const candidate = (snapshot.insured || []).find(item => item.appId === request.newAppId);
    const eligibility = candidateEligibility(result.claim, candidate);
    if (eligibility.error) return eligibility;
    return { claim: result.claim, candidate, coverage: eligibility.coverage };
  }

  function addRelationship(rows, key, record) {
    if (!rows.some(item => item[key] === record[key] && item.cl === record.cl)) rows.push(record);
  }

  async function commitCorrection(repository, request, actor) {
    if (!repository || typeof repository.transaction !== 'function' || typeof repository.allocate !== 'function')
      throw new Error('Correction repository requires atomic transaction and ID allocation');
    if (!request?.idempotencyKey || !actor?.name) throw new Error('ข้อมูลผู้ทำรายการหรือรหัสรายการไม่ครบถ้วน');
    return repository.transaction(async draft => {
      const previous = (draft.corrections || []).find(item => item.idempotencyKey === request.idempotencyKey);
      if (previous) {
        if (previous.oldCl !== request.oldCl || previous.newAppId !== request.newAppId) throw new Error('รหัสรายการนี้ถูกใช้กับเคลมอื่นแล้ว');
        return clone(previous);
      }
      const check = correctionEligibility(draft, request, actor);
      if (check.error) throw new Error(check.error);
      const { claim, candidate, coverage } = check;
      const ids = repository.allocate(draft, claim);
      if (!ids?.cl || !ids?.cc || !ids?.reference || (draft.claims || []).some(item => item.cl === ids.cl || (item.cases || []).some(c => c.number === ids.cc)))
        throw new Error('ไม่สามารถสร้างเลข CL / CC ใหม่ได้');
      const at = repository.now();
      const sourceCase = claim.cases[0];
      const oldCl = claim.cl;
      const oldCc = sourceCase.number;
      const sourceTransactions = (claim.transactionCodes || []).map(code => (draft.transactions || []).find(item => item.code === code));
      if (sourceTransactions.some(item => !item)) throw new Error('ข้อมูล Transaction ต้นทางไม่ครบถ้วน');
      const linkedDocs = [...new Set([...(claim.documentCodes || []), ...sourceTransactions.flatMap(item => item.documentCodes || [])])];
      if (linkedDocs.some(code => !(draft.documents || []).some(item => item.code === code))) throw new Error('ข้อมูล Document ต้นทางไม่ครบถ้วน');
      const newClaim = clone(claim);
      Object.assign(newClaim, {
        cl: ids.cl, cases: [{ ...clone(sourceCase), number: ids.cc, status: 'Open' }], status: 'Open', billed: false,
        insuredId: candidate.insuredId, insuredName: candidate.name, nationalId: candidate.nationalId,
        appId: candidate.appId, policyRef: candidate.policyRef, product: candidate.product,
        plan: candidate.plan, appStatus: candidate.appStatus, coverage,
        correctionReference: ids.reference, sourceCl: oldCl, sourceCc: oldCc
      });
      newClaim.history = [ ...(claim.history || []).map(clone), {
        kind: 'WRONG_INSURED_CREATED', reference: ids.reference, at, actor: actor.name,
        oldCl, oldCc, wrongRecorder: claim.createdBy, reason: request.reason, note: request.note || '',
        transactionCodes: clone(claim.transactionCodes || []), documentCodes: linkedDocs
      } ];
      claim.status = 'Close';
      sourceCase.status = 'Close';
      claim.correctionReference = ids.reference;
      claim.replacementCl = ids.cl;
      claim.replacementCc = ids.cc;
      claim.history = [ ...(claim.history || []), {
        kind: 'WRONG_INSURED_CLOSED', reference: ids.reference, at, actor: actor.name,
        newCl: ids.cl, newCc: ids.cc, reason: request.reason, note: request.note || ''
      } ];
      draft.claims.push(newClaim);
      const liveBenefit = candidate.benefits.find(item => item.code === coverage.benefitCode);
      liveBenefit.usedLimit = (money(liveBenefit.usedLimit || 0) + money(claim.amount)) / 100;
      liveBenefit.remainingLimit = coverage.remainingAfter;
      if (coverage.remainingVisitsAfter != null) liveBenefit.remainingVisits = coverage.remainingVisitsAfter;
      draft.transactionLinks ||= [];
      draft.documentLinks ||= [];
      for (const code of claim.transactionCodes || []) addRelationship(draft.transactionLinks, 'code', { code, cl: ids.cl });
      for (const code of linkedDocs) addRelationship(draft.documentLinks, 'code', { code, cl: ids.cl });
      const correction = {
        reference: ids.reference, idempotencyKey: request.idempotencyKey, at,
        oldCl, oldCc, newCl: ids.cl, newCc: ids.cc, newAppId: candidate.appId, actor: actor.name,
        wrongRecorder: claim.createdBy, reason: request.reason, note: request.note || ''
      };
      draft.corrections ||= [];
      draft.corrections.push(correction);
      return clone(correction);
    });
  }

  return { canCorrect, validateSearch, claimEligibility, candidateEligibility, correctionEligibility, transferSummary, commitCorrection, dateValue };
});
