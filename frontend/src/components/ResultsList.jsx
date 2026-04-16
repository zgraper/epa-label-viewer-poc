import styles from './ResultsList.module.css';

/**
 * ResultsList — renders a list of pesticide product search results.
 * Calls onSelect(epaRegNo) when "View Labels" is clicked.
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

  return (
    <ul className={styles.list}>
      {results.map((item) => {
        const regNo   = item.epaRegNo;
        const name    = item.productName  || '(unnamed)';
        const company = item.companyName  || '';
        const status  = item.productStatus || '';
        const isSelected = regNo === selectedRegNo;

        return (
          <li key={regNo} className={`${styles.item} ${isSelected ? styles.selected : ''}`}>
            <span className={styles.name}>{name}</span>
            {company && <span className={styles.company}>{company}</span>}
            <div className={styles.footer}>
              <span className={styles.regNo}>Reg #{regNo}</span>
              {status && <span className={styles.status}>{status}</span>}
            </div>
            <button
              className={styles.viewBtn}
              onClick={() => onSelect(regNo)}
              disabled={isSelected}
            >
              {isSelected ? 'Viewing' : 'View Labels'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
