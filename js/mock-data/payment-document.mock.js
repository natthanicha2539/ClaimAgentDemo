/* Synthetic transfer records for ตั้งค่าระบบ > จัดการเอกสารโอนเงิน. */
(function () {
  "use strict";
  const monitorRows = [
    ["CC6911001781", "CLPA6911000251", "PMG691132567", "PMT691132891", "69330702", 26800],
    ["CC6911001782", "CL6911022939", "PMG691132566", "PMT691132890", "25508991", 15000],
    ["CC6911001783", "CLPA6911000252", "PMG691132565", "PMT691132889", "69180114", 37400],
    ["CC6911001784", "CLPA6911000253", "PMG691132564", "PMT691132888", "69340324", 12350],
    ["CC6911001785", "CLPA6911000254", "PMG691132563", "PMT691132887", "99841290", 54000],
    ["CC6911001786", "CL6911022940", "PMG691132562", "PMT691132886", "69540182", 9200],
    ["CC6911001787", "CLPA6911000255", "PMG691132561", "PMT691132885", "69480193", 31750],
    ["CC6911001788", "CLPA6911000256", "PMG691132560", "PMT691132884", "69520152", 18400],
    ["CC6911001789", "CLPA6911000257", "PMG691132559", "PMT691132883", "69340725", 44600],
    ["CC6911001790", "CL6911022941", "PMG691132558", "PMT691132882", "23027510", 7900]
  ];
  const names = ["นางสาว มาลี ตัวอย่าง", "นาย ภูมิ ตัวอย่าง", "นางสาว ดาว ตัวอย่าง", "นาย นที ตัวอย่าง", "นางสาว ฟ้า ตัวอย่าง"];
  const currentMonitorRecords = monitorRows.map(function (row, index) {
    return {
      cc: row[0], claim: row[1], pmg: row[2], pmt: row[3],
      documentNo: index === 2 ? "DOC6911000403" : "",
      applicationId: row[4], debitDate: "2026-11-19", debitTime: `${String(9 + Math.floor(index / 3)).padStart(2, "0")}:${String(8 + index * 3).padStart(2, "0")}:00`,
      accountNo: `xxx-x-${String(3102 + index * 73).slice(-4)}-x`, accountName: names[index % names.length],
      bank: ["กรุงไทย", "กสิกรไทย", "กรุงเทพ", "ไทยพาณิชย์"][index % 4],
      transRef: `TXN69110003${String(101 + index)}`, failFirstUpload: index === 3,
      details: [{ claimNo: row[1], customerName: names[index % names.length], amount: row[5], narrative: "ค่าสินไหม" }]
    };
  });
  const records = currentMonitorRecords.concat([
    { cc: "CC6906000101", claim: "CLPA6906000101", pmg: "PMG6906000201", pmt: "PMT6906000301", documentNo: "DOC6906000401", applicationId: "APP6906000101", debitDate: "2026-06-24", debitTime: "11:27:27", accountNo: "xxx-x-3102-x", accountName: "นางสาว มาลี ตัวอย่าง", bank: "กรุงไทย", transRef: "TXN69060003101", details: [{ claimNo: "CLPA6906000101", customerName: "นางสาว มาลี ตัวอย่าง", amount: 25000, narrative: "ค่าสินไหม" }] },
    { cc: "CC6906000101", claim: "CLPA6906000101", pmg: "PMG6907000202", pmt: "PMT6907000302", documentNo: "", applicationId: "APP6906000101", debitDate: "2026-07-03", debitTime: "09:42:15", accountNo: "xxx-x-3102-x", accountName: "นางสาว มาลี ตัวอย่าง", bank: "กรุงไทย", transRef: "TXN69070003102", details: [{ claimNo: "CLPA6906000101", customerName: "นางสาว มาลี ตัวอย่าง", amount: 12500, narrative: "โอนเพิ่มเติม" }] },
    { cc: "CC6906000102", claim: "CLPH6906000102", pmg: "PMG6906000203", pmt: "PMT6906000303", documentNo: "DOC6906000403", applicationId: "APP6906000102", debitDate: "2026-06-25", debitTime: "14:08:05", accountNo: "xxx-x-6127-x", accountName: "นาย ภูมิ ตัวอย่าง", bank: "กสิกรไทย", transRef: "TXN69060003103", details: [{ claimNo: "CLPH6906000102", customerName: "นาย ภูมิ ตัวอย่าง", amount: 18000, narrative: "ค่ารักษาพยาบาล" }, { claimNo: "CLPH6906000102", customerName: "นาย ภูมิ ตัวอย่าง", amount: 3200, narrative: "ค่าชดเชย" }] },
    { cc: "CC6907000103", claim: "CLPA6907000103", pmg: "PMG6907000204", pmt: "PMT6907000304", documentNo: "DOC6907000404", applicationId: "APP6907000103", debitDate: "2026-07-12", debitTime: "10:16:48", accountNo: "xxx-x-8420-x", accountName: "นางสาว ดาว ตัวอย่าง", bank: "กรุงเทพ", transRef: "TXN69070003104", details: [{ claimNo: "CLPA6907000103", customerName: "นางสาว ดาว ตัวอย่าง", amount: 44500, narrative: "ค่าสินไหม" }] },
    { cc: "CC6908000104", claim: "CLPH6908000104", pmg: "PMG6908000205", pmt: "PMT6908000305", documentNo: "", applicationId: "APP6908000104", debitDate: "2026-08-05", debitTime: "15:30:00", accountNo: "xxx-x-9941-x", accountName: "นาย นที ตัวอย่าง", bank: "ไทยพาณิชย์", transRef: "TXN69080003105", failFirstUpload: true, details: [{ claimNo: "CLPH6908000104", customerName: "นาย นที ตัวอย่าง", amount: 8000, narrative: "ค่ารักษาพยาบาล" }] },
    { cc: "CC6908000105", claim: "CLPA6908000105", pmg: "PMG6908000206", pmt: "PMT6908000306", documentNo: "DOC6908000406", applicationId: "APP6908000105", debitDate: "2026-08-20", debitTime: "12:11:09", accountNo: "xxx-x-2738-x", accountName: "นางสาว ฟ้า ตัวอย่าง", bank: "กรุงศรีอยุธยา", transRef: "TXN69080003106", details: [{ claimNo: "CLPA6908000105", customerName: "นางสาว ฟ้า ตัวอย่าง", amount: 10000, narrative: "ค่าสินไหม" }] }
  ]);
  window.ClaimAgentPaymentDocumentMocks = Object.freeze(records.map(function (record) {
    return Object.freeze({ ...record, pmc: record.pmc || record.pmg.replace(/^PMG/, "PMC"), details: Object.freeze(record.details.map(Object.freeze)) });
  }));
})();
