import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatPHP } from "../utils/money.js";
import { useCart } from "./CartProvider.jsx";
import ProductImage from "./ProductImage.jsx";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [message, setMessage] = useState(null);
  const timer = useRef(null);
  const outOfStock = product.is_out_of_stock;

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleAdd() {
    const error = addItem(product.id, 1, product.stock);
    setMessage(error ? { type: "error", text: error } : { type: "ok", text: "Added to cart." });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 3500);
  }

  return (
    <article className="card">
      <Link to={`/products/${product.id}`} className="card-image" tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.image_url} alt="" />
      </Link>
      <div className="card-body">
        <p className="card-category">{product.category.name}</p>
        <h3 className="card-title">{product.name}</h3>
        <p className="card-price">{formatPHP(product.price_cents)}</p>
        <p className="card-stock">
          {outOfStock ? (
            <span className="badge badge-out">Out of Stock</span>
          ) : (
            <span>{product.stock} in stock</span>
          )}
        </p>
        <div className="card-actions">
          <Link to={`/products/${product.id}`} className="btn btn-secondary">
            View Details
          </Link>
          <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={outOfStock}>
            Add to Cart
          </button>
        </div>
        <p className={`card-message ${message?.type === "error" ? "is-error" : "is-ok"}`}
          role="status" aria-live="polite">
          {message?.text}
        </p>
      </div>
    </article>
  );
}
