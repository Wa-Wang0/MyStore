import { Link } from "react-router-dom";
import { EmptyState } from "../../components/Feedback.jsx";

export default function NotFound() {
  return (
    <EmptyState title="Page not found">
      <p>We could not find the page you were looking for.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </EmptyState>
  );
}
