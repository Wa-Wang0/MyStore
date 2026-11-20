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