import styles from './ResultsList.module.css';

/**
 * ResultsList — renders a list of pesticide product search results.
 * Calls onSelect(regNo) when a row is clicked.
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
        const regNo = item.reg_no ?? item.registration_number ?? item.regno;
        const name = item.product_name ?? item.name ?? '(unnamed)';
        const company = item.company_name ?? item.company ?? '';
        const isSelected = regNo === selectedRegNo;

        return (
          <li
            key={regNo}
            className={`${styles.item} ${isSelected ? styles.selected : ''}`}
            onClick={() => onSelect(regNo)}
          >
            <span className={styles.name}>{name}</span>
            {company && <span className={styles.company}>{company}</span>}
            <span className={styles.regNo}>Reg #{regNo}</span>
          </li>
        );
      })}
    </ul>
  );
}
