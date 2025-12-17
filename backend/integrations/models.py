from django.db import models

class Marketplace(models.Model):
    """
    Hangi pazaryerleri var? (Trendyol, Hepsiburada vs.)
    """
    name = models.CharField(max_length=50, unique=True)
    logo = models.ImageField(upload_to='marketplaces/', null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class ColumnMapping(models.Model):
    """
    Dinamik Excel Eşleştirme Yapısı.
    Örn: Trendyol için 'Sipariş No' sütunu veritabanında 'order_number' alanına denk gelir.
    """
    FILE_TYPES = (
        ('SALES', 'Satış Raporu/Hakediş'),
        ('STOCK', 'Stok Envanter Raporu'),
    )

    marketplace = models.ForeignKey(Marketplace, on_delete=models.CASCADE, related_name='mappings')
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    
    # Excel'deki Sütun Başlığı (Örn: "Müşteri Adı Soyadı")
    excel_column_name = models.CharField(max_length=255)
    
    # Bizim Veritabanındaki Karşılığı (Örn: "customer_name")
    # Bunu Frontend'de bir dropdown'dan seçtireceğiz.
    db_field_name = models.CharField(max_length=255)

    class Meta:
        unique_together = ('marketplace', 'file_type', 'db_field_name')
        verbose_name = "Sütun Eşleştirmesi"

    def __str__(self):
        return f"{self.marketplace} - {self.excel_column_name} -> {self.db_field_name}"