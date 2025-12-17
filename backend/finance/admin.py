from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'transaction_type', 'marketplace', 'product', 'sale_price', 'quantity', 'transaction_date')
    search_fields = ('order_number',)
    list_filter = ('transaction_type', 'marketplace', 'transaction_date')