/**
 * epaService.js
 *
 * Public service API for the EPA PPLS (Pesticide Product Label System) ORDS JSON API.
 * Orchestrates HTTP calls and normalization; delegates low-level concerns to sibling modules.
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

import { fetchJson, getItems } from './epaHttpClient.js';
import {
  pick,
  normalizeSearchItem,
  extractLabelDocs,
  extractActiveIngredients,
  toEpaLookupKey,
  toEpaDistributorLookupKey,
} from './epaNormalizer.js';

// Base URLs for each endpoint family
const EPA_SEARCH_BASE  = 'https://ordspub.epa.gov/ords/pesticides/cswu/ProductSearch/partialprodsearch/v2';
const EPA_ING_BASE     = 'https://ordspub.epa.gov/ords/pesticides/ProductSearch/searchWithIngName/v1';
const EPA_PRODUCT_BASE = 'https://ordspub.epa.gov/ords/pesticides/ppls';
// Distributor products use a separate PPLS endpoint (/ppldist/ vs /ppls/).
const EPA_DIST_PRODUCT_BASE = 'https://ordspub.epa.gov/ords/pesticides/ppldist';

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

async function searchByProductName(term) {
  const url = `${EPA_SEARCH_BASE}/riname/${encodeURIComponent(term)}`;
  const data = await fetchJson(url);
  return getItems(data);
}

async function searchByRegNo(term) {
  const url = `${EPA_SEARCH_BASE}/regnum/${encodeURIComponent(term)}`;
  const data = await fetchJson(url);
  return getItems(data);
}

async function searchByIngredient(term) {
  const url = `${EPA_ING_BASE}/${encodeURIComponent(term)}`;
  const data = await fetchJson(url);
  return getItems(data);
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
 * Supports both standard 2-part numbers (e.g. "524-688") and distributor
 * 3-part numbers (e.g. "524-475-72207").
 *
 * @param {string} regNo - EPA registration number
 * @returns {Promise<object|null>} Normalized product record, or null if not found
 */
export async function getProductByRegNo(regNo) {
  console.log(`EPA product lookup — incoming reg number: "${regNo}"`);

  // Detect whether this is a standard (2-part) or distributor (3-part) reg number.
  const partCount = String(regNo).split('-').length;

  let url;
  if (partCount === 3) {
    // Distributor registration numbers use a separate PPLS endpoint (/ppldist/).
    console.log(`EPA product lookup — detected type: distributor`);
    const lookupKey = toEpaDistributorLookupKey(regNo);
    url = `${EPA_DIST_PRODUCT_BASE}/${encodeURIComponent(lookupKey)}`;
  } else {
    // Standard registration numbers use the main PPLS product endpoint (/ppls/).
    console.log(`EPA product lookup — detected type: standard`);
    const lookupKey = toEpaLookupKey(regNo);
    url = `${EPA_PRODUCT_BASE}/${encodeURIComponent(lookupKey)}`;
  }

  console.log(`EPA product lookup — final URL: ${url}`);

  const data = await fetchJson(url);
  if (!data) return null;

  const items = getItems(data);
  const product = items.length > 0 ? items[0] : (typeof data === 'object' ? data : null);
  if (!product) return null;

  // Normalize into the same frontend-friendly shape regardless of lookup type.
  return {
    epaRegNo:          pick(product, ['eparegnumber', 'eparegno', 'epa_reg_no'], regNo),
    productName:       pick(product, ['productname', 'product_name']),
    companyName:       pick(product, ['companyname', 'company_name']),
    productStatus:     pick(product, ['product_status', 'registrationstatus']),
    activeIngredients: extractActiveIngredients(product),
    pdfFiles:          extractLabelDocs(product),
  };
}
