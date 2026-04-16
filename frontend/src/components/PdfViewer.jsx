import { useState, useEffect } from 'react';
import styles from './PdfViewer.module.css';

/**
 * PdfViewer — displays a pesticide label PDF for the selected product.
 *
 * The backend returns pdfFiles as an array of { acceptedDate, pdfUrl, sourceName },
 * sorted newest-first.  Index 0 is selected by default; a version selector is shown
 * when multiple labels exist so the user can browse the full label history.
 *
 * When integrating into another project, this component only needs:
 *   - a product object shaped like { productName, epaRegNo, companyName, pdfFiles }
 *   - loading / error booleans from the host's fetch state
 */

/**
 * Format an accepted-date string for display.
 * Returns a human-readable date when parseable, the raw string otherwise, or null if empty.
 *
 * @param {string} dateStr
 * @returns {string|null}
 */
function formatAcceptedDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PdfViewer({ product, loading, error }) {
  // Track which label version the user has selected (0 = newest)
  const [activePdfIndex, setActivePdfIndex] = useState(0);

  // Reset to the newest label whenever a different product is loaded
  useEffect(() => {
    setActivePdfIndex(0);
  }, [product]);

  if (loading) {
    return <div className={styles.placeholder}>Loading product details…</div>;
  }

  if (error) {
    return (
      <div className={styles.placeholder}>
        <span style={{ color: '#dc2626' }}>⚠ {error}</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.placeholder}>
        Select a product from the list to view its label.
      </div>
    );
  }

  const productName = product.productName || 'Product';
  const regNo       = product.epaRegNo    || '';
  const company     = product.companyName || '';

  const pdfFiles    = Array.isArray(product.pdfFiles) ? product.pdfFiles : [];
  const activePdf   = pdfFiles[activePdfIndex] ?? null;
  const pdfUrl      = activePdf?.pdfUrl || null;
  const hasMultiple = pdfFiles.length > 1;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{productName}</h2>
        <div className={styles.meta}>
          {regNo   && <span>Reg #{regNo}</span>}
          {company && <span>{company}</span>}
          {activePdf?.acceptedDate && (
            <span>Label accepted: {formatAcceptedDate(activePdf.acceptedDate)}</span>
          )}
        </div>

        {/* Version selector — only shown when the product has more than one label */}
        {hasMultiple && (
          <div className={styles.versionRow}>
            <label className={styles.versionLabel} htmlFor="pdf-version-select">
              Label version:
            </label>
            <select
              id="pdf-version-select"
              className={styles.versionSelect}
              value={activePdfIndex}
              onChange={(e) => setActivePdfIndex(Number(e.target.value))}
            >
              {pdfFiles.map((pdf, i) => {
                const date = formatAcceptedDate(pdf.acceptedDate);
                return (
                  <option key={i} value={i}>
                    {date ? date : `Version ${i + 1}`}{i === 0 ? ' (newest)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {pdfUrl && (
          <a
            className={styles.externalLink}
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open PDF in new tab ↗
          </a>
        )}
      </div>

      {pdfUrl ? (
        <iframe
          className={styles.frame}
          src={pdfUrl}
          title={`Label for ${productName}`}
        />
      ) : (
        <div className={styles.placeholder}>
          No label PDF is available for this product.
        </div>
      )}
    </div>
  );
}
