from django.db import models

class TimeStampedModel(models.Model):
    """
    Tüm modellerde ortak kullanılacak 'oluşturulma' ve 'güncellenme' zamanları.
    DRY (Don't Repeat Yourself) prensibi.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Product(TimeStampedModel):
    sku = models.CharField(max_length=100, unique=True, help_text="Stok Kodu (Örn: KZK-MAVI-L)")
    name = models.CharField(max_length=255, help_text="Ürün Adı")
    
    # Finansal Veriler (DecimalField kullanmak zorunludur, Float para hesabında hata yapar)
    buying_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Son Alış Fiyatı")
    
    # Ağırlıklı Ortalama Maliyet (Sizin istediğiniz kritik özellik)
    weighted_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Ortalama Maliyet")
    
    stock_quantity = models.IntegerField(default=0, verbose_name="Mevcut Stok")
    vat_rate = models.DecimalField(max_digits=4, decimal_places=2, default=20.00, help_text="KDV Oranı (%)")

    def __str__(self):
        return f"{self.sku} - {self.name}"

    class Meta:
        verbose_name = "Ürün"
        verbose_name_plural = "Ürünler"