import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  CART_KEY, addToItems, countUnits, loadCart, removeFromItems, saveCart, setItemQuantity,
} from "../utils/cart.js";

const CartContext = createContext(null);

export default function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const itemsRef = useRef(items); // always the latest cart, so add() can answer synchronously
  itemsRef.current = items;

  useEffect(() => saveCart(items), [items]);

  // Keep several browser tabs in sync.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === CART_KEY) setItems(loadCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const apply = useCallback((result) => {
    if (!result.error) {
      itemsRef.current = result.items;
      setItems(result.items);
    }
    return result.error; // null on success, a message on failure
  }, []);

  const value = useMemo(
    () => ({
      items,
      unitCount: countUnits(items),
      addItem: (productId, quantity, stock) =>
        apply(addToItems(itemsRef.current, productId, quantity, stock)),
      setQuantity: (productId, quantity, stock) =>
        apply(setItemQuantity(itemsRef.current, productId, quantity, stock)),
      removeItem: (productId) => apply({ items: removeFromItems(itemsRef.current, productId), error: null }),
      clearCart: () => apply({ items: [], error: null }),
    }),
    [items, apply]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
