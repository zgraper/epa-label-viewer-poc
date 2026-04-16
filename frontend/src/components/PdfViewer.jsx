import styles from './PdfViewer.module.css';

/**
 * PdfViewer — displays a pesticide label PDF for the selected product.
 *
 * The backend returns pdfFiles as an array of { acceptedDate, pdfUrl, sourceName },
 * sorted newest-first.  We load pdfFiles[0] by default.
 */
export default function PdfViewer({ product, loading, error }) {
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

  // Newest label PDF is first after backend sorting
  const latestPdf = Array.isArray(product.pdfFiles) ? product.pdfFiles[0] : null;
  const pdfUrl    = latestPdf?.pdfUrl || null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{productName}</h2>
        <div className={styles.meta}>
          {regNo    && <span>Reg #{regNo}</span>}
          {company  && <span>{company}</span>}
          {latestPdf?.acceptedDate && (
            <span>Label accepted: {latestPdf.acceptedDate}</span>
          )}
        </div>
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
