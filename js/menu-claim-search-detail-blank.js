/* ============================================================
   งานเคลม > ค้นหาเคลม > ดูรายละเอียด
   Compatibility wrapper: preserve the established patch position while
   forwarding to the native read-only detail renderer loaded before it.
   ============================================================ */
(function () {
  "use strict";

  const originalRecordDetail = window.openClaimRecordDetail;
  const originalHistoryDetail = window.openClaimSearchHistoryModal;

  window.openClaimRecordDetail = function () {
    return typeof originalRecordDetail === "function" ? originalRecordDetail.apply(this, arguments) : false;
  };

  window.openClaimSearchHistoryModal = function () {
    return typeof originalHistoryDetail === "function" ? originalHistoryDetail.apply(this, arguments) : false;
  };
})();
