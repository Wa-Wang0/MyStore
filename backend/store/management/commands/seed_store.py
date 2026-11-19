"""Seed / reset demo data.

    python manage.py seed_store            # add demo data if the store is empty
    python manage.py seed_store --reset    # wipe orders, products, categories, then reseed

Money is in integer centavos: 12000 = PHP 120.00.
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from store.models import Category, Order, OrderItem, Product

DEMO_ADMIN_USERNAME = "admin"
DEMO_ADMIN_PASSWORD = "Admin@12345"  # DEMO ONLY - public, not for production

CATEGORIES = ["Coffee", "Pastries", "Merchandise"]

# (name, category, price_cents, stock, is_active, is_featured, description)
PRODUCTS = [
    ("Barako Coffee Beans 250g", "Coffee", 28000, 25, True, True,
     "Strong, bold whole beans with a rich earthy finish."),
    ("Cold Brew Bottle 250ml", "Coffee", 12000, 40, True, True,
     "Smooth cold brew, ready to drink. Keep refrigerated."),
    ("Spanish Latte Bottle 250ml", "Coffee", 13500, 30, True, False,
     "Sweet and creamy latte in a grab-and-go bottle."),
    ("Instant Coffee 3-in-1 (10 sachets)", "Coffee", 8550, 60, True, False,
     "Quick everyday coffee mix. Just add hot water."),
    ("Seasonal Holiday Blend 200g", "Coffee", 32000, 10, False, False,
     "INACTIVE sample: hidden from the customer site and cannot be ordered."),
    ("Ensaymada", "Pastries", 4500, 50, True, True,
     "Soft buttery bun topped with sugar and cheese."),
    ("Pandesal (dozen)", "Pastries", 6000, 35, True, False,
     "Fresh, warm Filipino bread rolls."),
    ("Ube Cheese Roll", "Pastries", 9500, 20, True, True,
     "Purple yam filling with a salty cheese finish."),
    ("Mango Float Cup", "Pastries", 11000, 0, True, False,
     "OUT OF STOCK sample: visible, but cannot be added to the cart."),
    ("Butter Croissant", "Pastries", 7500, 15, True, False,
     "Flaky layers, baked fresh daily."),
    ("Insulated Tumbler 500ml", "Merchandise", 45000, 12, True, False,
     "Keeps drinks hot or cold for hours."),
    ("Canvas Tote Bag", "Merchandise", 19950, 18, True, False,
     "Sturdy everyday tote with the store logo."),
    ("Ceramic Mug", "Merchandise", 25000, 22, True, False,
     "Classic 350ml mug, dishwasher safe."),
]


def slugify_name(name):
    keep = "".join(c.lower() if c.isalnum() else "-" for c in name)
    return "-".join(part for part in keep.split("-") if part)


class Command(BaseCommand):
    help = "Seed demo categories, products, and a demo admin account."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all orders, products and categories first.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            # Order matters: OrderItem protects Product, Product protects Category.
            OrderItem.objects.all().delete()
            Order.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write("Existing store data cleared.")
        elif Product.objects.exists():
            self.stdout.write(
                self.style.WARNING("Store already has data. Use --reset to start over.")
            )
            self._ensure_admin()
            return

        categories = {name: Category.objects.create(name=name) for name in CATEGORIES}
        for name, cat, price, stock, active, featured, desc in PRODUCTS:
            Product.objects.create(
                name=name,
                category=categories[cat],
                price_cents=price,
                stock=stock,
                is_active=active,
                is_featured=featured,
                description=desc,
                image_url=f"/images/products/{slugify_name(name)}.svg",
            )

        self._ensure_admin()
        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {Category.objects.count()} categories and "
                f"{Product.objects.count()} products."
            )
        )

    def _ensure_admin(self):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=DEMO_ADMIN_USERNAME,
            defaults={"is_staff": True, "is_superuser": True},
        )
        # Always reset to the documented demo password so README stays truthful.
        user.is_staff = True
        user.is_superuser = True
        user.set_password(DEMO_ADMIN_PASSWORD)
        user.save()
        self.stdout.write(
            f"Demo admin ready -> username: {DEMO_ADMIN_USERNAME} "
            f"/ password: {DEMO_ADMIN_PASSWORD} (demo only)"
        )