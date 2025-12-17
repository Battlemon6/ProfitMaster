from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    # Listede hangi sütunlar görünsün?
    list_display = ('sku', 'name', 'buying_price', 'weighted_cost', 'stock_quantity', 'updated_at')
    # Hangi alanlarda arama yapılabilsin?
    search_fields = ('sku', 'name')
    # Hangi alanlara göre filtreleme yapılsın?
    list_filter = ('created_at',)