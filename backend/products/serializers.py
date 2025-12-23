from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    current_margin = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'barcode', 'description', 'buying_price', 'weighted_cost', 'stock_quantity', 'updated_at', 'current_margin']

    def get_current_margin(self, obj):
        return 0