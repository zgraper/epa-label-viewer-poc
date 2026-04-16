/**
 * epaHttpClient.js
 *
 * Low-level HTTP helpers for the EPA PPLS ORDS JSON API.
 * Isolated here so this file can be dropped into any Node.js project that needs
 * to talk to the EPA API without pulling in the full service layer.
 *
 * Documented API reference:
 *   https://www.epa.gov/pesticide-labels/pesticide-product-label-system-ppls-application-program-interface-api
 */

/** Default request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Fetch a URL with a timeout.  Throws on non-2xx or network errors.
 * Returns null for 404 responses so callers can distinguish "not found" from errors.
 *
 * @param {string} url
 * @returns {Promise<unknown>} Parsed JSON body, or null on 404
 */
export async function fetchJson(url) {
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
 * ORDS typically wraps results as { items: [...], hasMore: bool, ... }.
 * Falls back gracefully for bare arrays or unexpected shapes.
 *
 * @param {unknown} data
 * @returns {Array}
 */
export function getItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}
