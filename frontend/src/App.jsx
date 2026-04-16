import { useState } from 'react';
import './App.css';
import SearchPanel from './components/SearchPanel';
import ResultsList from './components/ResultsList';
import PdfViewer from './components/PdfViewer';
import { searchPesticides, getProduct } from './api/epaApi';

export default function App() {
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [results, setResults] = useState(null);

  const [selectedRegNo, setSelectedRegNo] = useState(null);
  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState(null);

  async function handleSearch(query) {
    setSearchLoading(true);
    setSearchError(null);
    setResults(null);
    setSelectedRegNo(null);
    setProduct(null);
    try {
      const data = await searchPesticides(query);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleSelect(regNo) {
    if (regNo === selectedRegNo) return;
    setSelectedRegNo(regNo);
    setProduct(null);
    setProductError(null);
    setProductLoading(true);
    try {
      const data = await getProduct(regNo);
      setProduct(data);
    } catch (err) {
      setProductError(err.message);
    } finally {
      setProductLoading(false);
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
              onSelect={handleSelect}
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
