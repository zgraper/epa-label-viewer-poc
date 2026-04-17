import styles from './ResultsList.module.css';

/**
 * ResultsList — renders a list of pesticide product search results.
 * Calls onSelect(epaRegNo) when "View Labels" is clicked.
 *
 * When integrating into another project, this component only needs
 * the results array and onSelect/selectedRegNo props from the host's state.
 */
export default function ResultsList({ results, selectedRegNo, onSelect, error }) {
  if (error) {
    return <p className={styles.message} style={{ color: '#dc2626' }}>{error}</p>;
  }

  if (results === null) {
    return <p className={styles.message}>Enter a search term above to find products.</p>;
  }

  if (results.length === 0) {
    return <p className={styles.message}>No results found.</p>;
  }

  // Deduplicate by epaRegNo so search results that share a reg number don't
  // cause duplicate entries or React key warnings.
  const seen = new Set();
  const uniqueResults = results.filter((item) => {
    if (seen.has(item.epaRegNo)) return false;
    seen.add(item.epaRegNo);
    return true;
  });

  return (
    <ul className={styles.list}>
      {uniqueResults.map((item, i) => {
        const regNo     = item.epaRegNo;
        const name      = item.productName  || '(unnamed)';
        const company   = item.companyName  || '';
        const status    = item.productStatus || '';
        const supported = item.isSupportedLookup !== false;
        const isSln     = item.regType === 'sln';
        const isSelected = supported && regNo === selectedRegNo;

        // Use regNo as key; fall back to index if regNo is empty.
        const key = regNo || String(i);

        return (
          <li key={key} className={`${styles.item} ${isSelected ? styles.selected : ''} ${!supported ? styles.unsupported : ''}`}>
            <span className={styles.name}>{name}</span>
            {company && <span className={styles.company}>{company}</span>}
            <div className={styles.footer}>
              <span className={styles.regNo}>Reg #{regNo}</span>
              {status && <span className={styles.status}>{status}</span>}
            </div>
            <button
              className={`${styles.viewBtn} ${!supported ? styles.viewBtnUnsupported : ''}`}
              onClick={() => supported && onSelect(regNo)}
              disabled={isSelected || !supported}
            >
              {isSelected ? 'Viewing' : supported ? 'View Labels' : 'Not supported'}
            </button>
            {!supported && (
              <p className={styles.unsupportedNote}>
                {isSln
                  ? 'Special Local Need number not yet supported in this POC'
                  : 'This registration number format is not yet supported in this POC'}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
