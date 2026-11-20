"""Automated checks for the public API (acceptance check 01 + visibility rules).

Run with:  python manage.py test
These tests build their own data, so they do not depend on seed_store.
"""
from rest_framework.test import APITestCase

from .models import Category, Product


class PublicProductApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.coffee = Category.objects.create(name="Coffee")
        cls.pastry = Category.objects.create(name="Pastries")
        make = Product.objects.create
        cls.cold = make(name="Cold Brew", category=cls.coffee, price_cents=12000, stock=5)
        cls.beans = make(name="Barako Beans", category=cls.coffee, price_cents=28000, stock=3)
        cls.instant = make(name="Instant Coffee", category=cls.coffee, price_cents=8550, stock=9)
        cls.hidden = make(name="Old Blend", category=cls.coffee, price_cents=1000, stock=9, is_active=False)
        cls.sold_out = make(name="Mango Float", category=cls.pastry, price_cents=11000, stock=0)
        cls.roll = make(name="Ube Roll", category=cls.pastry, price_cents=9500, stock=4, is_featured=True)

    def names(self, url):
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        return [p["name"] for p in res.json()]

    def test_inactive_hidden_from_list(self):
        self.assertNotIn("Old Blend", self.names("/api/products/"))

    def test_out_of_stock_still_listed_and_flagged(self):
        res = self.client.get("/api/products/")
        item = next(p for p in res.json() if p["name"] == "Mango Float")
        self.assertTrue(item["is_out_of_stock"])

    def test_search_is_case_insensitive(self):
        self.assertEqual(self.names("/api/products/?search=COLD"), ["Cold Brew"])

    def test_blank_search_is_ignored(self):
        self.assertEqual(len(self.names("/api/products/?search=%20%20")), 5)

    def test_no_match_returns_empty_list(self):
        self.assertEqual(self.names("/api/products/?search=zzzz"), [])

    def test_search_category_and_sort_work_together(self):
        url = f"/api/products/?search=o&category={self.coffee.id}&sort=price_desc"
        # "o" matches Cold Brew, Barako Beans, Instant Coffee (Old Blend is inactive)
        self.assertEqual(self.names(url), ["Barako Beans", "Cold Brew", "Instant Coffee"])
        url = f"/api/products/?search=o&category={self.coffee.id}&sort=price_asc"
        self.assertEqual(self.names(url), ["Instant Coffee", "Cold Brew", "Barako Beans"])

    def test_invalid_category_is_rejected(self):
        self.assertEqual(self.client.get("/api/products/?category=abc").status_code, 400)

    def test_unknown_category_id_returns_empty(self):
        self.assertEqual(self.names("/api/products/?category=9999"), [])

    def test_inactive_product_detail_is_404(self):
        self.assertEqual(self.client.get(f"/api/products/{self.hidden.id}/").status_code, 404)

    def test_missing_product_detail_is_404(self):
        self.assertEqual(self.client.get("/api/products/99999/").status_code, 404)

    def test_related_products_same_category_max_3_excluding_self(self):
        data = self.client.get(f"/api/products/{self.cold.id}/").json()
        related = [p["name"] for p in data["related"]]
        self.assertEqual(related, ["Barako Beans", "Instant Coffee"])  # not itself, not inactive
        self.assertNotIn("Cold Brew", related)

    def test_category_counts_only_active_products(self):
        data = {c["name"]: c["product_count"] for c in self.client.get("/api/categories/").json()}
        self.assertEqual(data["Coffee"], 3)
        self.assertEqual(data["Pastries"], 2)


class CartValidateApiTests(APITestCase):
    URL = "/api/cart/validate/"

    @classmethod
    def setUpTestData(cls):
        coffee = Category.objects.create(name="Coffee")
        make = Product.objects.create
        cls.cold = make(name="Cold Brew", category=coffee, price_cents=12000, stock=5)
        cls.instant = make(name="Instant Coffee", category=coffee, price_cents=8550, stock=9)
        cls.hidden = make(name="Old Blend", category=coffee, price_cents=1000, stock=9, is_active=False)
        cls.sold_out = make(name="Mango Float", category=coffee, price_cents=11000, stock=0)

    def post(self, items):
        return self.client.post(self.URL, {"items": items}, format="json")

    def test_spec_example_totals_exactly_325_50(self):
        res = self.post([
            {"product_id": self.cold.id, "quantity": 2},
            {"product_id": self.instant.id, "quantity": 1},
        ])
        data = res.json()
        self.assertEqual(res.status_code, 200)
        self.assertEqual(data["total_cents"], 32550)
        self.assertEqual(data["subtotal_cents"], data["total_cents"])
        self.assertTrue(data["can_checkout"])

    def test_duplicate_products_are_merged(self):
        data = self.post([
            {"product_id": self.cold.id, "quantity": 1},
            {"product_id": self.cold.id, "quantity": 2},
        ]).json()
        self.assertEqual(len(data["lines"]), 1)
        self.assertEqual(data["lines"][0]["quantity"], 3)

    def test_inactive_product_is_unavailable_and_reveals_nothing(self):
        data = self.post([{"product_id": self.hidden.id, "quantity": 1}]).json()
        line = data["lines"][0]
        self.assertEqual(line["issue"], "unavailable")
        self.assertNotEqual(line["name"], "Old Blend")
        self.assertIsNone(line["unit_price_cents"])
        self.assertFalse(data["can_checkout"])

    def test_missing_product_is_unavailable(self):
        data = self.post([{"product_id": 99999, "quantity": 1}]).json()
        self.assertEqual(data["lines"][0]["issue"], "unavailable")

    def test_out_of_stock_blocks_checkout(self):
        data = self.post([{"product_id": self.sold_out.id, "quantity": 1}]).json()
        self.assertEqual(data["lines"][0]["issue"], "out_of_stock")
        self.assertFalse(data["can_checkout"])

    def test_quantity_above_stock_is_flagged_and_not_totalled(self):
        data = self.post([{"product_id": self.cold.id, "quantity": 6}]).json()
        self.assertEqual(data["lines"][0]["issue"], "exceeds_stock")
        self.assertEqual(data["total_cents"], 0)
        self.assertFalse(data["can_checkout"])

    def test_invalid_quantities_are_flagged(self):
        for bad in (0, -1, 1.5, "2", None, True):
            data = self.post([{"product_id": self.cold.id, "quantity": bad}]).json()
            self.assertEqual(data["lines"][0]["issue"], "invalid_quantity", msg=repr(bad))
            self.assertFalse(data["can_checkout"])

    def test_empty_cart_cannot_check_out(self):
        data = self.post([]).json()
        self.assertEqual(data["lines"], [])
        self.assertFalse(data["can_checkout"])

    def test_malformed_payloads_return_400(self):
        self.assertEqual(self.post("nope").status_code, 400)
        self.assertEqual(self.post([{"quantity": 1}]).status_code, 400)
        self.assertEqual(self.post(["x"]).status_code, 400)
        self.assertEqual(self.client.post(self.URL, {}, format="json").status_code, 400)

    def test_too_many_lines_return_400(self):
        items = [{"product_id": i, "quantity": 1} for i in range(1, 52)]
        self.assertEqual(self.post(items).status_code, 400)