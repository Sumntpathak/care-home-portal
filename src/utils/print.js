/**
 * Unified Print Utility v3
 * ------------------------
 * Strategy: Temporarily move the target element to a dedicated print container
 * at the top of <body>, hide everything else with a class, then restore after print.
 * This guarantees proper multi-page pagination with zero CSS hacks.
 */

import { useEffect } from "react";

const PRINT_STYLE_ID = "unified-print-style";
const PRINT_CONTAINER_ID = "print-container";
const PRINT_HIDE_CLASS = "print-hidden-by-util";

/* Force light theme for print */
const THEME_RESET = `
  :root, [data-theme="dark"] {
    --bg: #fff !important; --surface: #fff !important; --card: #fff !important;
    --card-hover: #f9fafb !important; --border: #d1d5db !important;
    --border-light: #e5e7eb !important; --subtle: #f9fafb !important;
    --primary: #2563eb !important; --primary-light: #eff6ff !important;
    --primary-dark: #1d4ed8 !important; --accent: #059669 !important;
    --accent-light: #ecfdf5 !important; --danger: #dc2626 !important;
    --danger-light: #fef2f2 !important; --warning: #d97706 !important;
    --warning-light: #fffbeb !important; --success: #059669 !important;
    --success-light: #ecfdf5 !important; --text: #111827 !important;
    --text-secondary: #374151 !important; --text-muted: #6b7280 !important;
    --text-light: #9ca3af !important;
    --shadow: none !important; --shadow-xs: none !important;
    --shadow-md: none !important; --shadow-lg: none !important;
    --shadow-xl: none !important;
  }
`;

function buildPrintCSS(pageSize = "A4", margin = "8mm 10mm", extraCSS = "") {
  const sizeMap = { A4: "A4 portrait", A5: "A5 portrait", "A4-landscape": "A4 landscape" };
  const pageSizeRule = sizeMap[pageSize] || pageSize;
  const fontSize = pageSize === "A5" ? "10px" : "11px";

  return `
@media print {
  @page { size: ${pageSizeRule}; margin: ${margin}; }
  ${THEME_RESET}

  body {
    background: #fff !important; color: #000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    margin: 0 !important; padding: 0 !important;
  }

  /* Hide everything that's not the print container */
  .${PRINT_HIDE_CLASS} { display: none !important; }
  .no-print { display: none !important; }
  .print-only { display: block !important; }

  /* Print container — normal flow, no constraints */
  #${PRINT_CONTAINER_ID} {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #000 !important;
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: ${fontSize} !important;
    line-height: 1.45 !important;
    position: static !important;
    overflow: visible !important;
  }

  #${PRINT_CONTAINER_ID} * {
    max-height: none !important;
    overflow: visible !important;
    box-shadow: none !important;
  }

  /* Table print fixes */
  thead { display: table-header-group !important; }
  tfoot { display: table-footer-group !important; }
  tr { break-inside: avoid !important; page-break-inside: avoid !important; }
  table { break-inside: auto !important; border-collapse: collapse !important; width: 100% !important; }
  th, td { white-space: normal !important; word-wrap: break-word !important; }

  /* Expand tables to use full page width */
  #${PRINT_CONTAINER_ID} table { width: 100% !important; table-layout: auto !important; }
  #${PRINT_CONTAINER_ID} td, #${PRINT_CONTAINER_ID} th { padding: 4px 8px !important; font-size: 10px !important; }

  /* Hide pagination in print */
  .pagination { display: none !important; }

  /* Page break helpers */
  .page-break { break-before: page !important; page-break-before: always !important; }
  .no-break { break-inside: avoid !important; page-break-inside: avoid !important; }
  h1,h2,h3,h4 { break-after: avoid !important; page-break-after: avoid !important; }

  ${extraCSS}
}

/* Hide print container on screen */
@media screen {
  #${PRINT_CONTAINER_ID} { display: none !important; }
}
`;
}

function ensurePrintStyle(pageSize, margin, extraCSS) {
  let style = document.getElementById(PRINT_STYLE_ID);
  if (style) style.remove();
  style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.textContent = buildPrintCSS(pageSize, margin, extraCSS);
  document.head.appendChild(style);
}

function cleanupPrintStyle() {
  const style = document.getElementById(PRINT_STYLE_ID);
  if (style) style.remove();
  // Legacy cleanup
  ["rx-print-style","disp-print-style","a4-print-style",
   "invoice-print-style","unified-receipt-print-style","homecare-print-style"
  ].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
}

/**
 * Print a specific element by ID.
 *
 * How it works:
 * 1. Clone the target element into a top-level print container
 * 2. Hide all other body children
 * 3. Print (content flows naturally across pages)
 * 4. Restore everything after print
 */
export function printElement(targetId, opts = {}) {
  const { pageSize = "A4", margin = "8mm 10mm", extraCSS = "" } = opts;
  const source = document.getElementById(targetId);
  if (!source) { console.warn(`printElement: #${targetId} not found`); return; }

  // 1. Inject print CSS
  ensurePrintStyle(pageSize, margin, extraCSS);

  // 2. Create print container with cloned content
  let container = document.getElementById(PRINT_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = PRINT_CONTAINER_ID;
    document.body.prepend(container);
  }
  container.innerHTML = "";
  const clone = source.cloneNode(true);
  clone.removeAttribute("id");
  // Remove no-print elements from clone
  clone.querySelectorAll(".no-print").forEach(el => el.remove());
  // Force the clone and ALL ancestors to be visible (fixes display:none wrappers)
  clone.style.display = "block";
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
  clone.style.position = "static";
  clone.style.borderRadius = "0";
  clone.style.boxShadow = "none";
  clone.style.border = "none";
  clone.style.opacity = "1";
  clone.style.visibility = "visible";
  clone.style.width = "100%";
  // Also force visibility on any child that might be hidden
  clone.querySelectorAll("[style]").forEach(el => {
    if (el.style.display === "none") el.style.display = "";
    if (el.style.visibility === "hidden") el.style.visibility = "";
  });
  container.appendChild(clone);

  // 3. Hide all other body children
  Array.from(document.body.children).forEach(child => {
    if (child.id !== PRINT_CONTAINER_ID) {
      child.classList.add(PRINT_HIDE_CLASS);
    }
  });

  // 4. Print
  requestAnimationFrame(() => {
    window.print();

    // 5. Restore after print
    const restore = () => {
      // Remove hide class from all elements
      document.querySelectorAll(`.${PRINT_HIDE_CLASS}`).forEach(el => {
        el.classList.remove(PRINT_HIDE_CLASS);
      });
      // Remove print container
      const c = document.getElementById(PRINT_CONTAINER_ID);
      if (c) c.remove();
      cleanupPrintStyle();
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    // Fallback
    setTimeout(restore, 60000);
  });
}

/**
 * Print the full page (hides sidebar/topbar only).
 */
export function printFullPage(opts = {}) {
  const { pageSize = "A4", margin = "8mm 10mm", extraCSS = "" } = opts;
  ensurePrintStyle(pageSize, margin, `
    .topbar, .sidebar, .sb, .toast-container, .offline-indicator, .ai-guide-fab {
      display: none !important;
    }
    .app-body, .app-body-collapsed { margin-left: 0 !important; }
    .main { padding: 8px !important; }
    .card {
      box-shadow: none !important; border: 1px solid #d1d5db !important;
      background: #fff !important; break-inside: avoid !important;
    }
    ${extraCSS}
  `);

  requestAnimationFrame(() => {
    window.print();
    const cleanup = () => {
      cleanupPrintStyle();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    setTimeout(cleanup, 60000);
  });
}

/**
 * React hook — kept for backward compat but now a no-op.
 * printElement handles everything on click — no need to pre-inject styles.
 */
export function usePrintStyle(_targetId, _opts = {}) {
  // Intentionally empty — printElement now self-contained
}
