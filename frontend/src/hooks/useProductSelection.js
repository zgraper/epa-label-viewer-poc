/**
 * useProductSelection.js
 *
 * Encapsulates the "select a product and fetch its detail" flow.
 * When integrating into another project, copy this hook along with epaApi.js.
 */

import { useState } from 'react';
import { getProduct } from '../api/epaApi';

/**
 * @returns {{
 *   selectedRegNo: string|null,
 *   product: object|null,
 *   productLoading: boolean,
 *   productError: string|null,
 *   selectProduct: (regNo: string) => void,
 *   clearProduct: () => void,
 * }}
 */
export function useProductSelection() {
  const [selectedRegNo, setSelectedRegNo]   = useState(null);
  const [product, setProduct]               = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError]     = useState(null);

  async function selectProduct(regNo) {
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

  function clearProduct() {
    setSelectedRegNo(null);
    setProduct(null);
    setProductError(null);
  }

  return { selectedRegNo, product, productLoading, productError, selectProduct, clearProduct };
}
