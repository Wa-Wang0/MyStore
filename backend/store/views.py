"""Public (customer) API views.

DRF is configured secure-by-default (IsAdminUser), so every public view must
explicitly opt in with AllowAny. Inactive products are filtered out at the
queryset level, so they disappear from lists AND return 404 on a direct URL.
"""
from django.db.models import Count, Q
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer
from .services import validate_cart


def active_products():
    """The ONLY queryset customers are allowed to see."""
    return Product.objects.filter(is_active=True).select_related("category")


class CategoryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return Category.objects.annotate(
            product_count=Count("products", filter=Q(products__is_active=True))
        )


class ProductListView(generics.ListAPIView):
    """GET /api/products/?search=&category=&sort=price_asc|price_desc&featured=true

    search, category and sort are combined (AND) in one query, so they always
    work together.
    """

    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    pagination_class = None

    def get_queryset(self):
        params = self.request.query_params
        qs = active_products()

        search = params.get("search", "").strip()
        if search:
            qs = qs.filter(name__icontains=search)  # case-insensitive

        category = params.get("category", "").strip()
        if category:
            if not category.isdigit():
                raise ValidationError({"category": "Invalid category."})
            qs = qs.filter(category_id=int(category))

        if params.get("featured", "").lower() == "true":
            qs = qs.filter(is_featured=True)

        sort = params.get("sort", "")
        if sort == "price_asc":
            qs = qs.order_by("price_cents", "id")
        elif sort == "price_desc":
            qs = qs.order_by("-price_cents", "id")
        else:
            qs = qs.order_by("id")
        return qs


class ProductDetailView(generics.RetrieveAPIView):
    """GET /api/products/<id>/ -> product + up to 3 related active products."""

    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    queryset = active_products()  # inactive or missing id -> 404

    def retrieve(self, request, *args, **kwargs):
        product = self.get_object()
        data = self.get_serializer(product).data
        related = (
            active_products()
            .filter(category=product.category)
            .exclude(pk=product.pk)
            .order_by("id")[:3]
        )
        data["related"] = ProductSerializer(related, many=True).data
        return Response(data)


class CartValidateView(APIView):
    """POST /api/cart/validate/  body: {"items": [{"product_id": 1, "quantity": 2}]}

    The cart itself lives in the browser (guest checkout). This endpoint returns
    the authoritative price, stock and problems for each line.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        items = request.data.get("items") if hasattr(request.data, "get") else None
        return Response(validate_cart(items))