from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExcelUploadView, MarketplaceViewSet

router = DefaultRouter()
router.register(r'list', MarketplaceViewSet) # /api/integrations/list/ adresinden ulaşacağız

urlpatterns = [
    path('', include(router.urls)),
    path('upload/', ExcelUploadView.as_view(), name='excel-upload'),
]