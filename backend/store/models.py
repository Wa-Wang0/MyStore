"""Data models. All money is stored as integer centavos (PHP 85.50 -> 8550)."""
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models.functions import Lower


class Category(models.Model):
    name = models.CharField(max_length=80)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]
        constraints = [
            # No duplicate names ignoring case ("Coffee" vs "coffee").
            models.UniqueConstraint(Lower("name"), name="uniq_category_name_ci"),
        ]

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    image_url = models.CharField(max_length=500, blank=True)
    # PROTECT: a category that still has products cannot be deleted.
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )
    price_cents = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    @property
    def is_out_of_stock(self):
        """Derived, never stored: an active product with 0 stock."""
        return self.is_active and self.stock == 0

    def __str__(self):
        return self.name


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending"
        CONFIRMED = "Confirmed"
        PREPARING = "Preparing"
        SHIPPED = "Shipped"
        COMPLETED = "Completed"
        CANCELLED = "Cancelled"

    class Payment(models.TextChoices):
        COD = "Cash on Delivery"
        EWALLET = "E-Wallet"
        BANK = "Bank Transfer"

    order_number = models.CharField(max_length=30, unique=True)
    customer_name = models.CharField(max_length=150)
    email = models.EmailField()  # always saved trimmed + lowercase
    contact_number = models.CharField(max_length=30)
    delivery_address = models.TextField()
    notes = models.TextField(blank=True)
    payment_method = models.CharField(max_length=30, choices=Payment.choices)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    total_cents = models.PositiveIntegerField()
    # Guards "restore stock exactly once" when an order is cancelled.
    stock_restored = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    # PROTECT: a product that appears in any order cannot be hard-deleted.
    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="order_items"
    )
    # Snapshots: later product edits must never change a past order.
    product_name = models.CharField(max_length=150)
    unit_price_cents = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    line_total_cents = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"