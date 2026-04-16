import { useState } from 'react';
import styles from './SearchPanel.module.css';

/**
 * SearchPanel — text input + search button.
 * Calls onSearch(query) when submitted.
 */
export default function SearchPanel({ onSearch, loading }) {
  const [query, setQuery] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        placeholder="Search by product name, active ingredient, or company…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={loading}
      />
      <button className={styles.button} type="submit" disabled={loading || !query.trim()}>
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}
