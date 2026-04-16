import { useState } from 'react';
import './App.css';
import SearchPanel from './components/SearchPanel';
import ResultsList from './components/ResultsList';
import PdfViewer from './components/PdfViewer';
import { searchPesticides } from './api/epaApi';
import { useProductSelection } from './hooks/useProductSelection';

/**
 * App — top-level shell and search state manager.
 * When integrating into another project, lift this component's JSX into
 * the host app's layout and pass the required props down to each component.
 */
export default function App() {
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError]     = useState(null);
  const [results, setResults]             = useState(null);

  // Product selection state is isolated in a reusable hook
  const {
    selectedRegNo,
    product,
    productLoading,
    productError,
    selectProduct,
    clearProduct,
  } = useProductSelection();

  async function handleSearch({ query, mode }) {
    setSearchLoading(true);
    setSearchError(null);
    setResults(null);
    clearProduct();
    try {
      const data = await searchPesticides(query, mode);
      // Backend returns { query, mode, results: [...] }
      const items = Array.isArray(data?.results) ? data.results : [];
      setResults(items);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>EPA Pesticide Label Viewer</h1>
        <span>Powered by EPA PPLS</span>
      </header>

      <div className="body">
        <aside className="sidebar">
          <SearchPanel onSearch={handleSearch} loading={searchLoading} />
          <div className="results">
            <ResultsList
              results={results}
              selectedRegNo={selectedRegNo}
              onSelect={selectProduct}
              error={searchError}
            />
          </div>
        </aside>

        <main className="viewer">
          <PdfViewer
            product={product}
            loading={productLoading}
            error={productError}
          />
        </main>
      </div>
    </div>
  );
}
