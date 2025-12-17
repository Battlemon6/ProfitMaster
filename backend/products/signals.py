from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from decimal import Decimal
# Transaction modelini finance app'inden, Product modelini buradan çağırıyoruz
from finance.models import Transaction
from .models import Product

@receiver(post_save, sender=Transaction)
def update_stock_and_cost(sender, instance, created, **kwargs):
    """
    Her yeni Transaction (İşlem) kaydedildiğinde çalışır.
    Eğer bu bir 'Alış' (Purchase) işlemiyse stok ve maliyeti günceller.
    """
    if not created:
        return  # Sadece yeni kayıtlarda çalışsın, güncellemelerde değil.

    # Eğer işlem tipi 'PURCHASE' (Stok Girişi) ise
    # Not: Transaction modelinde types kısmına 'PURCHASE' eklememiz gerekecek,
    # şimdilik mantığı kuralım.
    if instance.transaction_type == 'PURCHASE' and instance.product:
        product = instance.product
        
        # Matematiksel Hesaplama (Ağırlıklı Ortalama)
        current_total_value = product.stock_quantity * product.weighted_cost
        incoming_total_value = instance.quantity * instance.cost_at_transaction # Alış Fiyatı
        
        new_total_quantity = product.stock_quantity + instance.quantity
        
        if new_total_quantity > 0:
            new_weighted_cost = (current_total_value + incoming_total_value) / new_total_quantity
        else:
            new_weighted_cost = instance.cost_at_transaction

        # Ürünü Güncelle
        product.weighted_cost = new_weighted_cost
        product.buying_price = instance.cost_at_transaction # Son alış fiyatını da güncelleyelim
        product.stock_quantity = new_total_quantity
        product.save()