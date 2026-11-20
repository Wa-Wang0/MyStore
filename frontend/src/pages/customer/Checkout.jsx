import { Link } from "react-router-dom";
import { EmptyState } from "../../components/Feedback.jsx";

// TEMPORARY placeholder. The real checkout form, validation and order saving are Step 3.
export default function Checkout() {
  return (
    <EmptyState title="Checkout is coming in Step 3">
      <p>The checkout form and order saving have not been built yet.</p>
      <Link to="/cart" className="btn btn-secondary">Back to cart</Link>
    </EmptyState>
  );
}
