import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useCart } from "./CartProvider.jsx";

export const STORE = {
  name: "Kubo Corner",
  tagline: "Coffee & Pantry",
  // Everything below is FICTIONAL and for this assessment only.
  email: "hello@kubocorner.example",
  phone: "+63 900 000 0000",
  address: "123 Sample Street, Sample City, Philippines",
};

export default function CustomerLayout() {
  const { unitCount } = useCart();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="site">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <img src="/logo.svg" alt="" width="36" height="36" />
            <span>{STORE.name}</span>
          </Link>
          <nav className="main-nav" aria-label="Main">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/products">Shop</NavLink>
            <NavLink to="/cart">
              Cart
              {unitCount > 0 && <span className="cart-count" aria-label={`${unitCount} items in cart`}>{unitCount}</span>}
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <section>
            <h2 className="footer-title">{STORE.name}</h2>
            <p>{STORE.tagline}</p>
            <p className="footer-note">
              A fictional store built for a software assessment. All details here are made up.
            </p>
          </section>
          <section>
            <h2 className="footer-title">Contact (fictional)</h2>
            <p>{STORE.address}</p>
            <p>{STORE.email}</p>
            <p>{STORE.phone}</p>
          </section>
          <section>
            <h2 className="footer-title">Follow us (sample links)</h2>
            <ul className="social">
              <li><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li><a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer">TikTok</a></li>
            </ul>
          </section>
        </div>
      </footer>
    </div>
  );
}
