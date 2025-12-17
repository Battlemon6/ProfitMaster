from rest_framework import serializers
from .models import Transaction
from products.models import Product
from integrations.models import Marketplace
from .models import Expense

class TransactionSerializer(serializers.ModelSerializer):
    # Okuma Alanları
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    marketplace_name = serializers.CharField(source='marketplace.name', read_only=True)
    
    # --- YENİ EKLENEN SATIR (ÇÖZÜM BURADA) ---
    # ID bilgisini okumak için ekliyoruz
    marketplace_id = serializers.IntegerField(source='marketplace.id', read_only=True)
    # -----------------------------------------

    # Yazma Alanları
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), write_only=True, required=False, allow_null=True)
    marketplace = serializers.PrimaryKeyRelatedField(queryset=Marketplace.objects.all(), write_only=True)

    cost_at_transaction = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    net_profit = serializers.SerializerMethodField()
    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_date', 
            'marketplace', 'marketplace_name', 'marketplace_id', # <--- BURAYA 'marketplace_id' EKLEMEYİ UNUTMAYIN
            'order_number',
            'product', 'product_name', 'product_sku', 'quantity',
            'sale_price', 'commission_amount', 'shipping_cost',
            'cost_at_transaction', 'total_cost', 'net_profit', 'transaction_type'
        ]

    def get_total_cost(self, obj):
        if not obj.product: return 0
        product_cost = (obj.cost_at_transaction * obj.quantity)
        return product_cost + obj.commission_amount + obj.shipping_cost

    def get_net_profit(self, obj):
        revenue = obj.sale_price 
        cost = self.get_total_cost(obj)
        return revenue - cost
class ExpenseSerializer(serializers.ModelSerializer): # Burası models. değil serializers. olacak
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'category', 'category_display', 'description', 'amount', 'expense_date']