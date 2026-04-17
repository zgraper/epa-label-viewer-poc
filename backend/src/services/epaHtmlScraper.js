/**
 * epaHtmlScraper.js
 *
 * Fallback HTML scraper for the EPA PPLS product detail page.
 * Used when the ORDS JSON API returns no product record for a registration number.
 *
 * Detail page URL format:
 *   https://ordspub.epa.gov/ords/pesticides/f?p=PPLS:102:::NO::P102_REG_NUM:{regNo}
 */

import { parse } from 'node-html-parser';

const PPLS_DETAIL_BASE = 'https://ordspub.epa.gov/ords/pesticides/f?p=PPLS:102:::NO::P102_REG_NUM:';

/** Default request timeout in milliseconds — matches epaHttpClient */
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Fetch the raw HTML of the PPLS detail page for a registration number.
 * Returns null on 404; throws on other HTTP errors or network timeouts.
 *
 * @param {string} url
 * @returns {Promise<string|null>}
 */
async function fetchHtml(url) {
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
    throw new Error(`PPLS HTML page returned HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

/**
 * Attempt to extract a date (MM/DD/YYYY) embedded in a PDF filename.
 * EPA filenames often end with a YYYYMMDD stamp, e.g. "000524-00518-20221028.pdf".
 *
 * @param {string} href
 * @returns {string} Formatted date string, or empty string if not found
 */
function extractDateFromFilename(href) {
  const match = href.match(/(\d{4})(\d{2})(\d{2})\.pdf(?:\?.*)?$/i);
  if (!match) return '';
  const [, year, month, day] = match;
  return `${month}/${day}/${year}`;
}

/**
 * Return the trimmed text of the first matching element for any of the given
 * CSS selectors, or an empty string if none match.
 *
 * @param {import('node-html-parser').HTMLElement} root
 * @param {string[]} selectors
 * @returns {string}
 */
function firstText(root, selectors) {
  for (const selector of selectors) {
    try {
      const el = root.querySelector(selector);
      if (el) {
        const text = el.textContent.trim();
        if (text) return text;
      }
    } catch {
      // ignore selector parse errors
    }
  }
  return '';
}

/**
 * Build a normalized list of PDF documents from all `<a href="...pdf">` anchors
 * found in the parsed HTML.  For each link the function attempts to locate an
 * accepted date by (in order of preference):
 *   1. A date-like cell in the same `<tr>` as the link.
 *   2. A YYYYMMDD stamp embedded in the PDF filename.
 *
 * Results are sorted newest-first (undated entries sink to the bottom).
 *
 * @param {import('node-html-parser').HTMLElement} root
 * @returns {Array<{ acceptedDate: string, pdfUrl: string, sourceName: string }>}
 */
function parsePdfLinks(root) {
  const anchors = root.querySelectorAll('a[href]').filter(a => {
    const href = a.getAttribute('href') || '';
    return /\.pdf(\?|$)/i.test(href);
  });

  const docs = anchors.map(anchor => {
    const href = anchor.getAttribute('href') || '';
    let acceptedDate = '';

    // Walk up to the nearest <tr> and scan its cells for a date value.
    const row = anchor.closest('tr');
    if (row) {
      for (const cell of row.querySelectorAll('td')) {
        const text = cell.textContent.trim();
        // Accept MM/DD/YYYY or YYYY-MM-DD
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text) || /^\d{4}-\d{2}-\d{2}$/.test(text)) {
          acceptedDate = text;
          break;
        }
      }
    }

    // Fall back to date encoded in the filename.
    if (!acceptedDate) {
      acceptedDate = extractDateFromFilename(href);
    }

    return { acceptedDate, pdfUrl: href, sourceName: '' };
  });

  // Sort newest-first (matching the sort order used by extractLabelDocs).
  docs.sort((a, b) => {
    const ta = a.acceptedDate ? new Date(a.acceptedDate).getTime() : NaN;
    const tb = b.acceptedDate ? new Date(b.acceptedDate).getTime() : NaN;
    if (isNaN(ta) && isNaN(tb)) return 0;
    if (isNaN(ta)) return 1;
    if (isNaN(tb)) return -1;
    return tb - ta;
  });

  return docs;
}

/**
 * Fetch and parse the PPLS HTML detail page for a registration number.
 *
 * Returns a partial product record `{ productName, companyName, pdfFiles }` when
 * at least one PDF link is found, or `null` if the page is missing or contains
 * no PDF links.
 *
 * @param {string} regNo  - EPA registration number, e.g. "524-518"
 * @returns {Promise<{ productName: string, companyName: string, pdfFiles: Array }|null>}
 */
export async function scrapeProductFromHtml(regNo) {
  const url = `${PPLS_DETAIL_BASE}${encodeURIComponent(regNo)}`;
  console.log(`EPA HTML fallback — fetching PPLS page: ${url}`);

  const html = await fetchHtml(url);
  if (!html) {
    console.log(`EPA HTML fallback — page not found for ${regNo}`);
    return null;
  }

  const root = parse(html);
  const pdfFiles = parsePdfLinks(root);

  if (!pdfFiles.length) {
    console.log(`EPA HTML fallback — no PDF links found on page for ${regNo}`);
    return null;
  }

  // Best-effort extraction of product and company names from common Oracle APEX
  // page structures. These may be empty for some products.
  const productName = firstText(root, [
    'span[id*="PRODUCT_NAME"]',
    'span[id*="P102_PRODUCT_NAME"]',
    'td[headers*="PRODUCT_NAME"]',
  ]);
  const companyName = firstText(root, [
    'span[id*="COMPANY_NAME"]',
    'span[id*="P102_COMPANY_NAME"]',
    'td[headers*="COMPANY_NAME"]',
  ]);

  console.log(`EPA HTML fallback — found ${pdfFiles.length} PDF(s) for ${regNo}`);

  return { productName, companyName, pdfFiles };
}
