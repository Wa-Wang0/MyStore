"""Business rules live here, not in views or React.

Step 2b: cart validation. Step 3 adds checkout; Step 4 adds status transitions.
"""
from rest_framework.exceptions import ValidationError

from .models import Product

MAX_CART_LINES = 50


def _is_whole_number(value):
    # bool is a subclass of int in Python, so reject it explicitly.
    return isinstance(value, int) and not isinstance(value, bool)


def parse_cart_items(raw_items):
    """Turn the request payload into {product_id: quantity | None}.

    Duplicate product ids are merged (quantities added). A quantity that is not a
    whole number >= 1 becomes None and is reported as an issue, not a crash.
    Malformed structure raises a 400.
    """
    if not isinstance(raw_items, list):
        raise ValidationError({"items": "items must be a list."})
    if len(raw_items) > MAX_CART_LINES:
        raise ValidationError({"items": f"A cart can hold at most {MAX_CART_LINES} lines."})

    merged = {}
    for entry in raw_items:
        if not isinstance(entry, dict) or not _is_whole_number(entry.get("product_id")):
            raise ValidationError({"items": "Each item needs a whole-number product_id."})
        product_id = entry["product_id"]
        quantity = entry.get("quantity")
        if not _is_whole_number(quantity) or quantity < 1 or merged.get(product_id, 0) is None:
            merged[product_id] = None
        else:
            merged[product_id] = merged.get(product_id, 0) + quantity
    return merged


def validate_cart(raw_items):
    """Check a cart against the database. Prices and stock always come from here.

    Each line gets an `issue`: None, "unavailable", "out_of_stock",
    "exceeds_stock" or "invalid_quantity". Only lines with no issue count toward
    the total, because only those can actually be ordered.
    """
    wanted = parse_cart_items(raw_items)
    products = Product.objects.in_bulk(wanted.keys())

    lines = []
    total_cents = 0
    for product_id, quantity in wanted.items():
        product = products.get(product_id)

        if product is None or not product.is_active:
            # Inactive products stay hidden: no name, price or stock is revealed.
            lines.append({
                "product_id": product_id, "name": "Unavailable product",
                "image_url": "", "unit_price_cents": None, "quantity": quantity,
                "line_total_cents": None, "stock": 0, "issue": "unavailable",
            })
            continue

        if quantity is None:
            issue = "invalid_quantity"
        elif product.stock == 0:
            issue = "out_of_stock"
        elif quantity > product.stock:
            issue = "exceeds_stock"
        else:
            issue = None

        line_total = product.price_cents * quantity if quantity else 0
        if issue is None:
            total_cents += line_total
        lines.append({
            "product_id": product.id, "name": product.name,
            "image_url": product.image_url, "unit_price_cents": product.price_cents,
            "quantity": quantity, "line_total_cents": line_total,
            "stock": product.stock, "issue": issue,
        })

    return {
        "lines": lines,
        "subtotal_cents": total_cents,
        "total_cents": total_cents,  # spec: no tax, shipping or fees
        "can_checkout": bool(lines) and all(line["issue"] is None for line in lines),
    }