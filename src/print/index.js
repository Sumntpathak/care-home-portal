/**
 * Hospital Print System — Public API
 * ===================================
 * import { printElement, OpdReceipt, PrescriptionA4, ... } from "../print";
 */

export { printElement, printFullPage } from "../utils/print";
export { HOSPITAL, P, DOC_CONFIG } from "./hospital";
export { HospitalHeader, HospitalFooter, SectionTitle, SignatureBlock, DataTable, ReceiptBar, FeeRow } from "./PrintBlocks";
export { OpdReceipt, PrescriptionA4, DispenseSlip, VisitReceipt, DailyCareReport, DischargeFile } from "./templates";
