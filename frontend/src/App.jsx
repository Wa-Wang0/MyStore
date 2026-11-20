import { BrowserRouter, Route, Routes } from "react-router-dom";
import CartProvider from "./components/CartProvider.jsx";
import CustomerLayout from "./components/CustomerLayout.jsx";
import Home from "./pages/customer/Home.jsx";
import Products from "./pages/customer/Products.jsx";
import ProductDetail from "./pages/customer/ProductDetail.jsx";
import Cart from "./pages/customer/Cart.jsx";
import Checkout from "./pages/customer/Checkout.jsx";
import NotFound from "./pages/customer/NotFound.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          {/* Admin routes are added in Step 4. */}
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
