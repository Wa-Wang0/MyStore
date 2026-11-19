from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Django's built-in admin, handy for inspecting data while developing.
    path("django-admin/", admin.site.urls),
    path("api/", include("store.urls")),
]