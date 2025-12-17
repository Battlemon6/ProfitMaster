from django.db import models
from products.models import Product
from integrations.models import Marketplace

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('SALE', 'Satış'),
        ('RETURN', 'İade'),
        ('CANCEL', 'İptal'),
        ('PURCHASE', 'Stok Alışı/Fatura'),
    )

    marketplace = models.ForeignKey(Marketplace, on_delete=models.PROTECT)
    product = models.ForeignKey(Product, on_delete=models.PROTECT, null=True, blank=True) # Bazı satırlar ürünle eşleşmeyebilir (Örn: Ceza faturası)
    
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    order_number = models.CharField(max_length=100, db_index=True) # Hızlı arama için index
    
    quantity = models.IntegerField(default=1)
    
    # Para Birimleri (Hepsi ayrı ayrı tutulmalı)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Satış Fiyatı")
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Komisyon Tutarı")
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Kargo Maliyeti")
    
    # Bu transaction oluştuğu andaki maliyet (Tarihsel kârlılık için şart)
    cost_at_transaction = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="O anki Maliyet")
    
    transaction_date = models.DateTimeField()
    
    def get_net_profit(self):
        """
        Net Kâr = Satış - (Maliyet + Komisyon + Kargo + KDV vb.)
        Bu hesabı daha detaylı yapacağız.
        """
        total_deductions = self.commission_amount + self.shipping_cost + (self.cost_at_transaction * self.quantity)
        return self.sale_price - total_deductions

    def __str__(self):
        return f"{self.order_number} - {self.transaction_type}"
class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('RENT', 'Kira'),
        ('SALARY', 'Maaş / Personel'),
        ('ELECTRICITY', 'Elektrik Faturası'),
        ('WATER', 'Su Faturası'),
        ('INTERNET', 'İnternet / Telefon'),
        ('LOAN', 'Kredi Ödemesi'),
        ('PREMIUM', 'Prim Ödemesi'),
        ('TAX', 'Vergi Ödemesi'),
        ('MARKETING', 'Reklam / Pazarlama'),
        ('OTHER', 'Diğer Genel Giderler'),
    ]

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name="Kategori")
    description = models.CharField(max_length=255, blank=True, null=True, verbose_name="Açıklama")
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Tutar")
    expense_date = models.DateField(verbose_name="Harcama Tarihi")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_category_display()} - {self.amount}"
