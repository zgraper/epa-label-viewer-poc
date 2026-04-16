import styles from './PdfViewer.module.css';

/**
 * PdfViewer — displays a pesticide label PDF.
 *
 * The EPA PPLS API returns label documents with a `label_url` field pointing
 * directly to a PDF file hosted on cdms.epa.gov.  We embed that URL in an
 * <iframe> so the browser's built-in PDF renderer handles the display.
 */
export default function PdfViewer({ product, loading, error }) {
  if (loading) {
    return <div className={styles.placeholder}>Loading product details…</div>;
  }

  if (error) {
    return <div className={styles.placeholder} style={{ color: '#dc2626' }}>{error}</div>;
  }

  if (!product) {
    return <div className={styles.placeholder}>Select a product from the list to view its label.</div>;
  }

  // The label URL field name may vary — try common candidates
  const labelUrl =
    product.label_url ??
    product.pdf_url ??
    product.document_url ??
    // Some PPLS responses nest documents in an array
    product.documents?.[0]?.url ??
    null;

  const productName = product.product_name ?? product.name ?? 'Product';
  const regNo = product.reg_no ?? product.registration_number ?? product.regno;
  const company = product.company_name ?? product.company ?? '';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{productName}</h2>
        <div className={styles.meta}>
          {regNo && <span>Reg #{regNo}</span>}
          {company && <span>{company}</span>}
        </div>
      </div>

      {labelUrl ? (
        <iframe
          className={styles.frame}
          src={labelUrl}
          title={`Label for ${productName}`}
        />
      ) : (
        <div className={styles.placeholder}>
          No label PDF available for this product.
          {regNo && (
            <a
              className={styles.link}
              href={`https://www.epa.gov/pesticide-registration/pesticide-labels`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Search on EPA.gov ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
