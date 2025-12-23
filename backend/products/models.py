from django.db import models
from decimal import Decimal

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Product(TimeStampedModel):
    sku = models.CharField(max_length=100, unique=True, help_text="Stok Kodu")
    name = models.CharField(max_length=255, help_text="Ürün Adı")
    barcode = models.CharField(max_length=100, null=True, blank=True, verbose_name="Barkod")
    description = models.TextField(null=True, blank=True, verbose_name="Ürün Nitelikleri")
    buying_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Son Alış Fiyatı")
    weighted_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Ortalama Maliyet")
    stock_quantity = models.IntegerField(default=0, verbose_name="Mevcut Stok")
    vat_rate = models.DecimalField(max_digits=4, decimal_places=2, default=20.00, help_text="KDV Oranı (%)")

    def __str__(self):
        return f"{self.sku} - {self.name}"

    def save(self, *args, **kwargs):
        # Ürün zaten varsa (güncelleme yapılıyorsa)
        if self.pk:
            try:
                old_instance = Product.objects.get(pk=self.pk)
                
                # Alış fiyatı 0'dan ilk kez bir değere çıkıyorsa maliyeti direkt eşitle
                if old_instance.buying_price == 0 and self.buying_price > 0:
                    self.weighted_cost = self.buying_price
                
                # Stok artışı varsa ve yeni alış fiyatı 0 değilse Ağırlıklı Ortalama Hesapla
                elif self.stock_quantity > old_instance.stock_quantity and self.buying_price > 0:
                    added_stock = Decimal(self.stock_quantity - old_instance.stock_quantity)
                    current_stock = Decimal(old_instance.stock_quantity)
                    
                    # Mevcut maliyet 0 ise son alış fiyatını, o da 0 ise yeni fiyatı baz al
                    current_cost = old_instance.weighted_cost if old_instance.weighted_cost > 0 else self.buying_price
                    
                    # Formül: ((Eski Stok * Eski Maliyet) + (Yeni Gelen * Yeni Fiyat)) / Toplam Stok
                    total_value = (current_stock * current_cost) + (added_stock * self.buying_price)
                    self.weighted_cost = total_value / Decimal(self.stock_quantity)
                
                # Sadece fiyat değiştiyse (stok sabit) ve maliyet alanı boşsa (0 ise) doldur
                elif self.buying_price > 0 and self.weighted_cost == 0:
                    self.weighted_cost = self.buying_price

            except Product.DoesNotExist:
                pass
        
        # Ürün ilk kez oluşturulurken fiyat girilmişse maliyeti eşitle
        elif self.buying_price > 0:
            self.weighted_cost = self.buying_price

        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Ürün"
        verbose_name_plural = "Ürünler"