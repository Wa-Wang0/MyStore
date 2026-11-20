/** Thin wrapper around fetch for the Django API. */
const BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/** Pull one readable message out of a DRF error body. */
function messageFrom(data) {
  if (!data || typeof data !== "object") return null;
  if (typeof data.detail === "string") return data.detail;
  for (const value of Object.values(data)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string") return first;
  }
  return null;
}

async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.");
  }
  let data = null;
  try {
    data = await response.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!response.ok) {
    throw new ApiError(messageFrom(data) || `Request failed (${response.status}).`, response.status, data);
  }
  return data;
}

export const api = {
  categories: () => request("/categories/"),
  products: (params = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    }
    const qs = query.toString();
    return request(`/products/${qs ? `?${qs}` : ""}`);
  },
  product: (id) => request(`/products/${id}/`),
  validateCart: (items) =>
    request("/cart/validate/", {
      method: "POST",
      body: { items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })) },
    }),
};
