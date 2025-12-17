from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet

router = DefaultRouter()
router.register(r'', ProductViewSet) # Boş string, ana yol demek

urlpatterns = [
    path('', include(router.urls)),
]