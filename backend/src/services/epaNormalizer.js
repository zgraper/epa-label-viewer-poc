/**
 * epaNormalizer.js
 *
 * Pure data-normalization functions for EPA PPLS API responses.
 * No HTTP calls — safe to unit-test in isolation or transplant independently.
 *
 * EPA endpoints return slightly inconsistent field names across response types;
 * all aliasing is handled here in one place.
 */

/**
 * Safely read a string field from an object, trying multiple candidate keys.
 * Returns the first non-empty value found, or a fallback string.
 *
 * @param {object} obj
 * @param {string[]} keys  - Candidate field names in priority order
 * @param {string}   fallback
 * @returns {string}
 */
export function pick(obj, keys, fallback = '') {
  if (!obj || typeof obj !== 'object') return fallback;
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== '') return String(val);
  }
  return fallback;
}

/**
 * Normalize a raw search-result item into a consistent shape.
 *
 * @param {object} item
 * @returns {{ epaRegNo: string, productName: string, productStatus: string, companyName: string }}
 */
export function normalizeSearchItem(item) {
  return {
    epaRegNo:      pick(item, ['eparegnumber', 'eparegno', 'epa_reg_no']),
    productName:   pick(item, ['productname', 'product_name']),
    productStatus: pick(item, ['product_status', 'registrationstatus', 'product_name_status']),
    companyName:   pick(item, ['companyname', 'company_name']),
  };
}

/**
 * Normalize a label-document entry from a product record.
 *
 * @param {object} doc
 * @returns {{ acceptedDate: string, pdfUrl: string, sourceName: string }}
 */
export function normalizeLabelDoc(doc) {
  return {
    acceptedDate: pick(doc, ['accepted_date', 'accepteddate', 'accept_date', 'date_accepted']),
    pdfUrl:       pick(doc, ['pdf_url', 'document_url', 'url', 'pdfurl']),
    sourceName:   pick(doc, ['source_name', 'sourcename']),
  };
}

/**
 * Extract and normalize label documents from a product record.
 * Sorts newest first when an acceptedDate is present; undated entries sink to the bottom.
 *
 * @param {object} product
 * @returns {Array<{ acceptedDate: string, pdfUrl: string, sourceName: string }>}
 */
export function extractLabelDocs(product) {
  const raw  = product.label_documents ?? product.labels ?? product.label_res ?? [];
  const docs = Array.isArray(raw) ? raw : [];
  const normalized = docs.map(normalizeLabelDoc);

  normalized.sort((a, b) => {
    const ta = a.acceptedDate ? new Date(a.acceptedDate).getTime() : NaN;
    const tb = b.acceptedDate ? new Date(b.acceptedDate).getTime() : NaN;
    if (isNaN(ta) && isNaN(tb)) return 0;
    if (isNaN(ta)) return 1;
    if (isNaN(tb)) return -1;
    return tb - ta;
  });

  return normalized;
}

/**
 * Extract and normalize active ingredients from a product record.
 *
 * @param {object} product
 * @returns {string[]}
 */
export function extractActiveIngredients(product) {
  const raw = product.active_ingredients ?? product.activeingredients ?? [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map(ai => pick(ai, ['active_ing', 'activeingredient', 'ingredient_name', 'active_ingredient']))
    .filter(Boolean);
}
