/* Mock data for จัดการเงินกองทุน hospital-payment pages. No persistence or network I/O. */
(function () {
  "use strict";

  const claims = [
    { id: "CC6909000101", hospitalRef: "HC6909000211", sent: "07/09/2569", insured: "นาย ธนกร ใจดี", hospital: "โรงพยาบาลกรุงเทพ", plan: "PA", insurer: "BUI", amount: 48200 },
    { id: "CC6909000102", hospitalRef: "HC6909000212", sent: "07/09/2569", insured: "นางสาว พิมพ์ชนก สุขใจ", hospital: "โรงพยาบาลกรุงเทพ", plan: "PH", insurer: "AIA", amount: 76500 },
    { id: "CC6909000103", hospitalRef: "HC6909000213", sent: "07/09/2569", insured: "นาย กิตติพงษ์ รุ่งเรือง", hospital: "โรงพยาบาลพญาไท 3", plan: "PA", insurer: "BUI", amount: 32900 },
    { id: "CC6909000104", hospitalRef: "HC6909000214", sent: "08/09/2569", insured: "นางสาว อรพรรณ วัฒนชัย", hospital: "โรงพยาบาลพญาไท 3", plan: "PH", insurer: "AIA", amount: 61400 },
    { id: "CC6909000105", hospitalRef: "HC6909000215", sent: "08/09/2569", insured: "นาย ณัฐพล แสงทอง", hospital: "โรงพยาบาลพระราม 9", plan: "PA", insurer: "BUI", amount: 28750 }
  ];

  function claim(id, hospital, insured, amount, ref) {
    return { id, hospital, insured, amount, hospitalRef: ref, plan: "PH", insurer: "AIA" };
  }

  const groups = [
    { id: "HCG690900021", created: "08/09/2569 09:15", estimate: "10/09/2569", hospital: "โรงพยาบาลพระราม 9", bank: "ธนาคารกสิกรไทย", account: "xxx-x-1542-x", accountName: "บจก. โรงพยาบาลพระราม 9", status: "รอโอน", email: "—", claims: [claim("CC6909000081", "โรงพยาบาลพระราม 9", "นาย ปกรณ์ วัฒนา", 85000, "HC6909000181"), claim("CC6909000082", "โรงพยาบาลพระราม 9", "นาง วรรณา พรชัย", 42000, "HC6909000182")] },
    { id: "HCG690900022", created: "08/09/2569 09:30", estimate: "09/09/2569", hospital: "โรงพยาบาลศิริเวช สายไหม", bank: "ธนาคารกรุงเทพ", account: "xxx-x-4821-x", accountName: "บจก. ศิริเวช สายไหม", status: "รอโอน", email: "—", claims: [claim("CC6909000083", "โรงพยาบาลศิริเวช สายไหม", "นาย สมภพ พูนผล", 63900, "HC6909000183")] },
    { id: "HCG690900023", created: "08/09/2569 10:05", estimate: "09/09/2569", hospital: "โรงพยาบาลกรุงเทพ", bank: "ธนาคารไทยพาณิชย์", account: "xxx-x-9890-x", accountName: "บมจ. กรุงเทพดุสิตเวชการ", status: "รอจ่ายอัตโนมัติ", email: "—", claims: [claim("CC6909000084", "โรงพยาบาลกรุงเทพ", "นางสาว ชนิดา สุขสันต์", 118000, "HC6909000184"), claim("CC6909000085", "โรงพยาบาลกรุงเทพ", "นาย อนุชา แก้วดี", 74500, "HC6909000185")] },
    { id: "HCG690900019", created: "07/09/2569 14:20", estimate: "08/09/2569", transferred: "08/09/2569 10:30", hospital: "โรงพยาบาลพญาไท 3", bank: "ธนาคารกรุงไทย", account: "xxx-x-7210-x", accountName: "บจก. โรงพยาบาลพญาไท 3", status: "โอนสำเร็จ", email: "ส่งสำเร็จ", claims: [claim("CC6909000078", "โรงพยาบาลพญาไท 3", "นางสาว นภา ใจมั่น", 53500, "HC6909000178")] },
    { id: "HCG690900020", created: "07/09/2569 15:10", estimate: "08/09/2569", transferred: "—", hospital: "โรงพยาบาลศิริเวช สายไหม", bank: "ธนาคารกรุงเทพ", account: "xxx-x-4821-x", accountName: "บจก. ศิริเวช สายไหม", status: "โอนไม่สำเร็จ", email: "—", failureReason: "เลขบัญชีไม่ถูกต้อง", claims: [claim("CC6909000079", "โรงพยาบาลศิริเวช สายไหม", "นาย จิรายุ ทองดี", 44700, "HC6909000179")] }
  ];

  const hospitals = [
    { id: "HSP001", name: "โรงพยาบาลกรุงเทพ", auto: true, delay: 2, hold: false, updatedAt: "01/08/2569 10:30", dirty: false },
    { id: "HSP002", name: "โรงพยาบาลพญาไท 3", auto: true, delay: 1, hold: false, updatedAt: "30/07/2569 14:05", dirty: false },
    { id: "HSP003", name: "โรงพยาบาลศิริเวช สายไหม", auto: false, delay: 0, hold: true, updatedAt: "29/07/2569 11:10", dirty: false },
    { id: "HSP004", name: "โรงพยาบาลพระราม 9", auto: false, delay: 0, hold: false, updatedAt: "29/07/2569 11:10", dirty: false }
  ];

  const history = [
    { hospitalId: "HSP001", time: "01/08/2569 10:30", action: "ปิด Hold", user: "09104 ฉัตรชนก ปักษาทอง" },
    { hospitalId: "HSP001", time: "01/08/2569 10:30", action: "เปิดจ่ายเงินอัตโนมัติ", user: "09104 ฉัตรชนก ปักษาทอง" },
    { hospitalId: "HSP001", time: "31/07/2569 09:20", action: "เปลี่ยน Delay จาก 1 เป็น 2 วัน", user: "09104 ฉัตรชนก ปักษาทอง" },
    { hospitalId: "HSP002", time: "30/07/2569 14:05", action: "เปลี่ยน Delay จาก 2 เป็น 1 วัน", user: "09104 ฉัตรชนก ปักษาทอง" },
    { hospitalId: "HSP004", time: "29/07/2569 11:10", action: "ปิดจ่ายอัตโนมัติ", user: "09104 ฉัตรชนก ปักษาทอง" }
  ];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  window.ClaimAgentFundMockData = Object.freeze({
    createTransferState: function () { return { status: "", appliedStatus: "", selected: [], sequence: 24, claims: clone(claims), groups: clone(groups) }; },
    createPaymentSettingsState: function () { return { query: "", appliedQuery: "", openHistoryId: "", sequence: 5, hospitals: clone(hospitals), history: clone(history) }; }
  });
})();
