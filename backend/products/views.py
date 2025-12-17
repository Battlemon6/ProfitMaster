from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    """
    Bu ViewSet otomatik olarak şunları sağlar:
    - GET /api/products/ -> Listeleme
    - POST /api/products/ -> Yeni Ekleme
    - PUT /api/products/{id}/ -> Güncelleme
    - DELETE /api/products/{id}/ -> Silme
    """
    queryset = Product.objects.all().order_by('-updated_at')
    serializer_class = ProductSerializer