import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAsync } from "../../api/useAsync.js";
import { ErrorBox, Loading } from "../../components/Feedback.jsx";
import ProductCard from "../../components/ProductCard.jsx";

export default function Home() {
  const categories = useAsync(() => api.categories(), []);
  const featured = useAsync(() => api.products({ featured: "true" }), []);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">Freshly brewed. Freshly baked.</h1>
        <p>Coffee, pastries and little extras for your kitchen. Order online today.</p>
        <Link to="/products" className="btn btn-primary btn-large">Shop all products</Link>
      </section>

      <section className="section" aria-labelledby="cat-title">
        <h2 id="cat-title">Shop by category</h2>
        {categories.loading && !categories.data && <Loading />}
        {categories.error && <ErrorBox error={categories.error} onRetry={categories.reload} />}
        {categories.data && (
          <ul className="category-links">
            {categories.data.map((category) => (
              <li key={category.id}>
                <Link to={`/products?category=${category.id}`} className="category-link">
                  <span>{category.name}</span>
                  <span className="category-count">{category.product_count} items</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section" aria-labelledby="featured-title">
        <h2 id="featured-title">Featured products</h2>
        {featured.loading && !featured.data && <Loading />}
        {featured.error && <ErrorBox error={featured.error} onRetry={featured.reload} />}
        {featured.data && featured.data.length === 0 && <p>No featured products right now.</p>}
        {featured.data && featured.data.length > 0 && (
          <div className="product-grid">
            {featured.data.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </>
  );
}
