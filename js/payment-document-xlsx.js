/* Read the first worksheet of an .xlsx file for the payment document demo. */
(function () {
  "use strict";
  const decoder = new TextDecoder();
  const xml = source => {
    const document = new DOMParser().parseFromString(source, "application/xml");
    if (document.querySelector("parsererror")) throw new Error("ไฟล์ Excel ไม่ถูกต้อง");
    return document;
  };
  const children = (node, name) => Array.from(node.getElementsByTagName("*" )).filter(item => item.localName === name);
  function zipEntries(buffer) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let end = -1;
    for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
      if (view.getUint32(offset, true) === 0x06054b50) { end = offset; break; }
    }
    if (end < 0) throw new Error("ไฟล์ไม่ใช่ Excel (.xlsx)");
    const count = view.getUint16(end + 10, true);
    let offset = view.getUint32(end + 16, true);
    const entries = new Map();
    for (let index = 0; index < count; index++) {
      if (view.getUint32(offset, true) !== 0x02014b50) throw new Error("ไฟล์ Excel ไม่ถูกต้อง");
      const method = view.getUint16(offset + 10, true);
      const size = view.getUint32(offset + 20, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));
      if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error("ไฟล์ Excel ไม่ถูกต้อง");
      const dataOffset = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
      entries.set(name, { method, data: bytes.slice(dataOffset, dataOffset + size) });
      offset += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
  }
  async function entryText(entries, name) {
    const entry = entries.get(name);
    if (!entry) throw new Error("ไฟล์ Excel ไม่มีข้อมูลตาราง");
    if (entry.method === 0) return decoder.decode(entry.data);
    if (entry.method !== 8 || typeof DecompressionStream === "undefined") throw new Error("เบราว์เซอร์ไม่รองรับการอ่านไฟล์ Excel นี้");
    const stream = new Blob([entry.data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return decoder.decode(await new Response(stream).arrayBuffer());
  }
  function cellValue(cell, shared) {
    const type = cell.getAttribute("t");
    if (type === "inlineStr") return children(cell, "t").map(item => item.textContent).join("").trim();
    const value = children(cell, "v")[0]?.textContent || "";
    return (type === "s" ? shared[Number(value)] || "" : value).trim();
  }
  async function read(file) {
    if (!/\.xlsx$/i.test(file.name)) throw new Error("กรุณาเลือกไฟล์ Excel (.xlsx)");
    const entries = zipEntries(await file.arrayBuffer());
    let sheetName = Array.from(entries.keys()).filter(name => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort((a, b) => Number(a.match(/\d+/g).at(-1)) - Number(b.match(/\d+/g).at(-1)))[0];
    if (!sheetName) throw new Error("ไฟล์ Excel ไม่มีแผ่นงาน");
    let shared = [];
    if (entries.has("xl/sharedStrings.xml")) {
      const strings = xml(await entryText(entries, "xl/sharedStrings.xml"));
      shared = children(strings, "si").map(item => children(item, "t").map(text => text.textContent).join(""));
    }
    const sheet = xml(await entryText(entries, sheetName));
    const rows = children(sheet, "row").map(row => {
      const cells = {};
      children(row, "c").forEach(cell => {
        const column = (cell.getAttribute("r") || "").match(/^[A-Z]+/)?.[0];
        if (column) cells[column] = cellValue(cell, shared);
      });
      return { number: Number(row.getAttribute("r")) || 0, cells };
    }).filter(row => Object.values(row.cells).some(Boolean));
    if (!rows.length) throw new Error("ไฟล์ Excel ไม่มีรายการ");
    const header = Object.fromEntries(Object.entries(rows[0].cells).map(([column, value]) => [value.trim().toUpperCase(), column]));
    const columns = Object.keys(header).sort().join(",");
    if (columns !== "CL" && columns !== "CC,CL") throw new Error("ไฟล์ Excel ต้องตรงตาม Template: คอลัมน์ CL หรือ CL และ CC");
    if (rows.length === 1) throw new Error("ไฟล์ Excel ไม่มีรายการใต้หัวคอลัมน์");
    return rows.slice(1).map(row => ({ number: row.number, cl: (row.cells[header.CL] || "").trim().toUpperCase(), cc: (row.cells[header.CC] || "").trim().toUpperCase() }));
  }
  window.ClaimAgentPaymentDocumentXlsx = Object.freeze({ read });
})();
