from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Senin Importların (Lütfen views.py'da sınıf adın neyse onu bırak)
from .views import ExcelUploadView, MarketplaceViewSet

# --- DEBUG: Terminale çalıştığını kanıtlayan yazı ---
print(">>> INTEGRATIONS URLS DOSYASI OKUNDU! <<<")

router = DefaultRouter()
router.register(r'list', MarketplaceViewSet, basename='marketplace')

urlpatterns = [
    # 1. MANUEL YOLLAR (EN ÜSTTE OLMAK ZORUNDA)
    # Router'ın "upload" kelimesini ID sanıp yutmasını engellemek için bunu tepeye koyuyoruz.
    path('upload/', ExcelUploadView.as_view(), name='excel-upload'),

    # 2. OTOMATİK YOLLAR (EN ALTTA)
    path('', include(router.urls)),
]