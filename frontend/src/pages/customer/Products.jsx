import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAsync } from "../../api/useAsync.js";
import { EmptyState, ErrorBox, Loading } from "../../components/Feedback.jsx";
import ProductCard from "../../components/ProductCard.jsx";

const SORTS = ["price_asc", "price_desc"];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const rawSort = params.get("sort") ?? "";
  const sort = SORTS.includes(rawSort) ? rawSort : "";

  // The text box updates instantly; the URL (and the request) follow 300 ms later.
  const [searchText, setSearchText] = useState(search);

  function updateParams(changes) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true }
    );
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim() !== search) updateParams({ search: searchText.trim() });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const categories = useAsync(() => api.categories(), []);
  const products = useAsync(() => api.products({ search, category, sort }), [search, category, sort]);

  const hasFilters = Boolean(search || category || sort);
  function clearFilters() {
    setSearchText("");
    setParams({}, { replace: true });
  }

  return (
    <section aria-labelledby="shop-title">
      <h1 id="shop-title">Shop</h1>

      <div className="filters">
        <div className="field">
          <label htmlFor="search">Search by name</label>
          <input id="search" type="search" placeholder="e.g. coffee" value={searchText}
            onChange={(e) => setSearchText(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => updateParams({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sort">Sort by price</label>
          <select id="sort" value={sort} onChange={(e) => updateParams({ sort: e.target.value })}>
            <option value="">Default</option>
            <option value="price_asc">Low to High</option>
            <option value="price_desc">High to Low</option>
          </select>
        </div>
      </div>

      {products.loading && !products.data && <Loading label="Loading products..." />}

      {products.error && (
        <ErrorBox error={products.error} onRetry={products.error.status === 400 ? undefined : products.reload}>
          {hasFilters && (
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>
          )}
        </ErrorBox>
      )}

      {products.data && products.data.length === 0 && (
        <EmptyState title="No products match your search">
          <p>Try a different name or category.</p>
          {hasFilters && <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>}
        </EmptyState>
      )}

      {products.data && products.data.length > 0 && (
        <>
          <p className="result-count" aria-live="polite">
            {products.data.length} {products.data.length === 1 ? "product" : "products"}
          </p>
          <div className="product-grid" aria-busy={products.loading}>
            {products.data.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </>
      )}
    </section>
  );
}
