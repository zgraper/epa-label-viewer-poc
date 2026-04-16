/**
 * epaService.js
 *
 * Wraps calls to the EPA PPLS (Pesticide Product Label System) ORDS JSON API.
 *
 * Documented API reference:
 *   https://www.epa.gov/pesticide-labels/pesticide-product-label-system-ppls-application-program-interface-api
 *
 * Endpoints used:
 *   Partial product-name search:
 *     GET https://ordspub.epa.gov/ords/pesticides/cswu/ProductSearch/partialprodsearch/v2/riname/{name}
 *   Partial reg-number search:
 *     GET https://ordspub.epa.gov/ords/pesticides/cswu/ProductSearch/partialprodsearch/v2/regnum/{regNo}
 *   Active ingredient search:
 *     GET https://ordspub.epa.gov/ords/pesticides/ProductSearch/searchWithIngName/v1/{ingredient}
 *   Full product detail (includes label documents):
 *     GET https://ordspub.epa.gov/ords/pesticides/ppls/{regNo}
 */

// Base URLs for each endpoint family
const EPA_SEARCH_BASE  = 'https://ordspub.epa.gov/ords/pesticides/cswu/ProductSearch/partialprodsearch/v2';
const EPA_ING_BASE     = 'https://ordspub.epa.gov/ords/pesticides/ProductSearch/searchWithIngName/v1';
const EPA_PRODUCT_BASE = 'https://ordspub.epa.gov/ords/pesticides/ppls';

/** Default request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a URL with a timeout.  Throws on non-2xx or network errors.
 *
 * @param {string} url
 * @returns {Promise<unknown>} Parsed JSON body
 */
async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`EPA API returned HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

/**
 * Extract the items array from an ORDS response.
 * ORDS typically returns { items: [...], hasMore: bool, ... }.
 *
 * @param {unknown} data
 * @returns {Array}
 */
function getItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

/**
 * Safely read a string field from an object, trying multiple candidate keys.
 * Returns the first non-empty value found, or a fallback string.
 *
 * @param {object} obj
 * @param {string[]} keys  - Candidate field names in priority order
 * @param {string}   fallback
 * @returns {string}
 */
function pick(obj, keys, fallback = '') {
  if (!obj || typeof obj !== 'object') return fallback;
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== '') return String(val);
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Search pesticide products by partial product name.
 *
 * @param {string} term
 * @returns {Promise<Array>}
 */
async function searchByProductName(term) {
  const url = `${EPA_SEARCH_BASE}/riname/${encodeURIComponent(term)}`;
  const data = await fetchJson(url);
  return getItems(data);
}

/**
 * Search by EPA registration number (supports partial matches).
 *
 * @param {string} term
 * @returns {Promise<Array>}
 */
async function searchByRegNo(term) {
  const url = `${EPA_SEARCH_BASE}/regnum/${encodeURIComponent(term)}`;
  const data = await fetchJson(url);
  return getItems(data);
}

/**
 * Search by active ingredient name.
 *
 * @param {string} term
 * @returns {Promise<Array>}
 */
async function searchByIngredient(term) {
  const url = `${EPA_ING_BASE}/${encodeURIComponent(term)}`;
  const data = await fetchJson(url);
  return getItems(data);
}

/**
 * Normalize a raw search-result item into the standard shape.
 *
 * EPA endpoints return slightly different field names; we handle both.
 *
 * @param {object} item
 * @returns {{ epaRegNo: string, productName: string, productStatus: string, companyName: string }}
 */
function normalizeSearchItem(item) {
  return {
    epaRegNo:      pick(item, ['eparegnumber', 'eparegno', 'epa_reg_no']),
    productName:   pick(item, ['productname', 'product_name']),
    productStatus: pick(item, ['product_status', 'registrationstatus', 'product_name_status']),
    companyName:   pick(item, ['companyname', 'company_name']),
  };
}

// ---------------------------------------------------------------------------
// Product detail
// ---------------------------------------------------------------------------

/**
 * Normalize a label-document entry.
 *
 * @param {object} doc
 * @returns {{ acceptedDate: string, pdfUrl: string, sourceName: string }}
 */
function normalizeLabelDoc(doc) {
  return {
    acceptedDate: pick(doc, ['accepted_date', 'accepteddate', 'accept_date', 'date_accepted']),
    pdfUrl:       pick(doc, ['pdf_url', 'document_url', 'url', 'pdfurl']),
    sourceName:   pick(doc, ['source_name', 'sourcename']),
  };
}

/**
 * Extract and normalize label documents from a product record.
 * Sorts newest first when an acceptedDate is present.
 *
 * @param {object} product
 * @returns {Array}
 */
function extractLabelDocs(product) {
  const raw = product.label_documents ?? product.labels ?? product.label_res ?? [];
  const docs = Array.isArray(raw) ? raw : [];
  const normalized = docs.map(normalizeLabelDoc);

  // Sort descending by date; entries without a parseable date sink to the bottom
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
function extractActiveIngredients(product) {
  const raw = product.active_ingredients ?? product.activeingredients ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map(ai => pick(ai, ['active_ing', 'activeingredient', 'ingredient_name', 'active_ingredient'])).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search pesticide products.
 *
 * @param {string} query   - The search term
 * @param {'product'|'ingredient'|'regno'} mode
 * @returns {Promise<{ query: string, mode: string, results: Array }>}
 */
export async function searchPesticides(query, mode = 'product') {
  let rawItems;
  switch (mode) {
    case 'ingredient':
      rawItems = await searchByIngredient(query);
      break;
    case 'regno':
      rawItems = await searchByRegNo(query);
      break;
    case 'product':
    default:
      rawItems = await searchByProductName(query);
  }

  return {
    query,
    mode,
    results: rawItems.map(normalizeSearchItem),
  };
}

/**
 * Fetch full product details and label PDF history for a registration number.
 *
 * @param {string} regNo - EPA registration number (e.g. "1234-567")
 * @returns {Promise<object|null>} Normalized product record, or null if not found
 */
export async function getProductByRegNo(regNo) {
  const url = `${EPA_PRODUCT_BASE}/${encodeURIComponent(regNo)}`;
  const data = await fetchJson(url);
  if (!data) return null;

  const items = getItems(data);
  const product = items.length > 0 ? items[0] : (typeof data === 'object' ? data : null);
  if (!product) return null;

  return {
    epaRegNo:          pick(product, ['eparegnumber', 'eparegno', 'epa_reg_no'], regNo),
    productName:       pick(product, ['productname', 'product_name']),
    companyName:       pick(product, ['companyname', 'company_name']),
    productStatus:     pick(product, ['product_status', 'registrationstatus']),
    activeIngredients: extractActiveIngredients(product),
    pdfFiles:          extractLabelDocs(product),
  };
}
