from django.core.management.base import BaseCommand
from integrations.models import Marketplace, ColumnMapping

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        # LOGDA GÖZÜKEN İSİMLE BİREBİR AYNI OLMALI
        mp, _ = Marketplace.objects.get_or_create(name="Trendyol") 

        mappings = [
            ("sku", "sku"),
            ("isim", "name"),
            ("stok", "stock_quantity"),
            ("alış fiyatı", "buying_price"),
            ("ürün nitelikleri", "description"),
            ("barkod/gtin", "barcode"),
        ]

        ColumnMapping.objects.filter(marketplace=mp, file_type='STOCK').delete()
        for excel_col, db_field in mappings:
            ColumnMapping.objects.create(
                marketplace=mp,
                file_type='STOCK',
                excel_column_name=excel_col.lower(),
                db_field_name=db_field
            )
        self.stdout.write(self.style.SUCCESS(f'✅ Harita "{mp.name}" için başarıyla güncellendi.'))