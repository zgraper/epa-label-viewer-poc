import { useState } from 'react';
import styles from './SearchPanel.module.css';

const MODES = [
  { value: 'product',    label: 'Product name' },
  { value: 'ingredient', label: 'Active ingredient' },
  { value: 'regno',      label: 'EPA reg. no.' },
];

/**
 * SearchPanel — text input, mode dropdown, and search button.
 * Calls onSearch({ query, mode }) when submitted.
 *
 * When integrating into another project, this component is self-contained —
 * just wire up the onSearch callback and pass a loading boolean.
 */
export default function SearchPanel({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const [mode, setMode]   = useState('product');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) onSearch({ query: trimmed, mode });
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <p className={styles.subtitle}>
        Search the EPA Pesticide Product Label System to find and view registered product labels.
      </p>
      <input
        className={styles.input}
        type="text"
        placeholder="e.g. Roundup, glyphosate, 524-475…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={loading}
      />
      <div className={styles.row}>
        <select
          className={styles.select}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          disabled={loading}
        >
          {MODES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button className={styles.button} type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
    </form>
  );
}
