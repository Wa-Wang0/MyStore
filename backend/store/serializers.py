"""Serializers for the public (customer-facing) API.

Prices are exposed as integer centavos (price_cents). The frontend formats them
with one helper, so no float money ever crosses the API.
"""
from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    # Filled by the view's annotate(): number of ACTIVE products in the category.
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ["id", "name", "product_count"]


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ProductSerializer(serializers.ModelSerializer):
    category = ProductCategorySerializer(read_only=True)
    # Derived in the model (active and stock == 0), never stored.
    is_out_of_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "image_url",
            "category",
            "price_cents",
            "stock",
            "is_out_of_stock",
            "is_featured",
        ]