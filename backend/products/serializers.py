from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    # Kâr marjını hesaplayıp gönderelim (Opsiyonel ama şık durur)
    current_margin = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'buying_price', 'weighted_cost', 'stock_quantity', 'updated_at', 'current_margin']

    def get_current_margin(self, obj):
        # Eğer satış fiyatı (list price) modelde yoksa şimdilik boş dönelim
        # İleride pazaryeri fiyatlarını buraya çekeriz.
        return 0