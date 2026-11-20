import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAsync } from "../../api/useAsync.js";
import { useCart } from "../../components/CartProvider.jsx";
import { EmptyState, ErrorBox, Loading } from "../../components/Feedback.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import ProductImage from "../../components/ProductImage.jsx";
import QuantityInput from "../../components/QuantityInput.jsx";
import { formatPHP } from "../../utils/money.js";

function NotAvailable() {
  return (
    <EmptyState title="This product is not available">
      <p>It may have been removed or is no longer sold.</p>
      <Link to="/products" className="btn btn-primary">Back to shop</Link>
    </EmptyState>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const validId = /^\d+$/.test(id);
  const { data: product, error, loading, reload } = useAsync(
    () => (validId ? api.product(id) : Promise.reject(Object.assign(new Error("Invalid id"), { status: 404 }))),
    [id]
  );

  const { addItem } = useCart();
  const [qty, setQty] = useState(1); // last valid quantity
  const [qtyValid, setQtyValid] = useState(true); // false while the typed text is invalid
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setQty(1);
    setQtyValid(true);
    setMessage(null);
  }, [id]);

  if (loading && !product) return <Loading label="Loading product..." />;
  if (error?.status === 404) return <NotAvailable />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!product) return null;

  const outOfStock = product.is_out_of_stock;

  function handleAdd() {
    const problem = addItem(product.id, qty, product.stock);
    setMessage(problem ? { type: "error", text: problem } : { type: "ok", text: `Added ${qty} to your cart.` });
  }

  return (
    <>
      <p className="breadcrumb"><Link to="/products">&larr; Back to shop</Link></p>
      <article className="detail">
        <ProductImage className="detail-image" src={product.image_url} alt={product.name} />
        <div className="detail-info">
          <p className="card-category">{product.category.name}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPHP(product.price_cents)}</p>
          <p className="detail-description">{product.description}</p>
          <p className="detail-stock">
            {outOfStock ? <span className="badge badge-out">Out of Stock</span> : <>Available stock: <strong>{product.stock}</strong></>}
          </p>

          {!outOfStock && (
            <div className="field">
              <span className="label">Quantity</span>
              <QuantityInput
                value={qty}
                max={product.stock}
                onChange={(n) => {
                  setQtyValid(n !== null);
                  if (n !== null) setQty(n);
                }}
              />
            </div>
          )}

          <button type="button" className="btn btn-primary btn-large" onClick={handleAdd}
            disabled={outOfStock || !qtyValid}>
            Add to Cart
          </button>

          <p className={`card-message ${message?.type === "error" ? "is-error" : "is-ok"}`} role="status" aria-live="polite">
            {message?.text}{" "}
            {message?.type === "ok" && <Link to="/cart">View cart</Link>}
          </p>
        </div>
      </article>

      {product.related.length > 0 && (
        <section className="section" aria-labelledby="related-title">
          <h2 id="related-title">Related products</h2>
          <div className="product-grid">
            {product.related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </>
  );
}
