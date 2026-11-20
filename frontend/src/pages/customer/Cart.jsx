import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAsync } from "../../api/useAsync.js";
import { useCart } from "../../components/CartProvider.jsx";
import { EmptyState, ErrorBox, Loading } from "../../components/Feedback.jsx";
import ProductImage from "../../components/ProductImage.jsx";
import QuantityInput from "../../components/QuantityInput.jsx";
import { formatPHP } from "../../utils/money.js";

const ISSUE_TEXT = {
  unavailable: () => "This product is no longer available. Please remove it.",
  out_of_stock: () => "Out of stock. Please remove it.",
  exceeds_stock: (line) => `Only ${line.stock} available. Please lower the quantity.`,
  invalid_quantity: () => "Invalid quantity. Please set a whole number of at least 1.",
};

export default function Cart() {
  const { items, setQuantity, removeItem } = useCart();
  const itemsKey = JSON.stringify(items);

  // The server returns the real price, stock and any problem for every line.
  const check = useAsync(
    () => (items.length ? api.validateCart(items) : Promise.resolve(null)),
    [itemsKey]
  );

  if (items.length === 0) {
    return (
      <EmptyState title="Your cart is empty">
        <p>Add something tasty to get started.</p>
        <Link to="/products" className="btn btn-primary">Browse products</Link>
      </EmptyState>
    );
  }
  if (check.loading && !check.data) return <Loading label="Checking your cart..." />;
  if (check.error) return <ErrorBox error={check.error} onRetry={check.reload} />;
  if (!check.data) return null;

  const { lines, total_cents: total, subtotal_cents: subtotal, can_checkout: canCheckout } = check.data;

  return (
    <section aria-labelledby="cart-title">
      <h1 id="cart-title">Your cart</h1>

      <ul className="cart-lines" aria-busy={check.loading}>
        {lines.map((line) => {
          const unavailable = line.issue === "unavailable";
          return (
            <li key={line.product_id} className={`cart-line ${line.issue ? "has-issue" : ""}`}>
              <ProductImage className="cart-image" src={line.image_url} alt="" />
              <div className="cart-info">
                <h2 className="cart-name">{line.name}</h2>
                {!unavailable && <p className="cart-unit">{formatPHP(line.unit_price_cents)} each</p>}
                {line.issue && (
                  <p className="field-error" role="alert">
                    {ISSUE_TEXT[line.issue](line)}{" "}
                    {line.issue === "exceeds_stock" && (
                      <button type="button" className="link-button"
                        onClick={() => setQuantity(line.product_id, line.stock, line.stock)}>
                        Use {line.stock}
                      </button>
                    )}
                  </p>
                )}
              </div>
              <div className="cart-controls">
                {!unavailable && line.stock > 0 && line.quantity !== null && (
                  <QuantityInput
                    value={line.quantity}
                    max={line.stock}
                    label={`Quantity for ${line.name}`}
                    onChange={(n) => n !== null && n !== line.quantity && setQuantity(line.product_id, n, line.stock)}
                  />
                )}
                {!unavailable && line.issue !== "invalid_quantity" && (
                  <p className="cart-line-total">{formatPHP(line.line_total_cents)}</p>
                )}
                <button type="button" className="btn btn-danger-outline" onClick={() => removeItem(line.product_id)}>
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="totals">
        <div><dt>Subtotal</dt><dd>{formatPHP(subtotal)}</dd></div>
        <div className="totals-grand"><dt>Total</dt><dd>{formatPHP(total)}</dd></div>
      </dl>

      {canCheckout ? (
        <Link to="/checkout" className="btn btn-primary btn-large">Proceed to checkout</Link>
      ) : (
        <>
          <button type="button" className="btn btn-primary btn-large" disabled>Proceed to checkout</button>
          <p className="field-error">Fix the items marked above to continue.</p>
        </>
      )}
    </section>
  );
}
