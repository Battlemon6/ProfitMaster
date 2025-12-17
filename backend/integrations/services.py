import pandas as pd
from django.db import transaction
from .models import ColumnMapping
from finance.models import Transaction
from products.models import Product

class ExcelProcessor:
    def __init__(self, marketplace, file_type):
        self.marketplace = marketplace
        self.file_type = file_type

    def get_column_mapping(self):
        """
        Bu pazaryeri ve dosya türü için tanımlı sütun eşleşmelerini getirir.
        """
        mappings = ColumnMapping.objects.filter(
            marketplace=self.marketplace,
            file_type=self.file_type
        )
        return {m.excel_column_name: m.db_field_name for m in mappings}

    def process_sales_file(self, file_obj):
        """
        Satış / Hakediş raporlarını işler.
        """
        try:
            df = pd.read_excel(file_obj)
        except Exception as e:
            return {"success": False, "error": f"Excel okunamadı: {str(e)}"}

        # Sütun isimlerini değiştir
        mapping_dict = self.get_column_mapping()
        df.rename(columns=mapping_dict, inplace=True)

        # Zorunlu alan kontrolü
        required_fields = ['order_number', 'sale_price', 'sku']
        missing_fields = [field for field in required_fields if field not in df.columns]
        
        if missing_fields:
             return {
                 "success": False, 
                 "error": f"Şu sütunlar eşleştirilmedi veya Excel'de yok: {', '.join(missing_fields)}. Lütfen Admin panelden Mapping ayarlarını yapın."
             }

        created_count = 0
        errors = []

        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    self._create_transaction_from_row(row)
                    created_count += 1
                except Exception as e:
                    errors.append(f"Satır {index+1} hatası: {str(e)}")

        return {
            "success": True,
            "created_count": created_count,
            "errors": errors[:10]
        }

    def process_stock_file(self, file_obj):
        """
        Stok Envanter raporlarını işler.
        """
        try:
            df = pd.read_excel(file_obj)
        except Exception as e:
            return {"success": False, "error": f"Excel okunamadı: {str(e)}"}

        mapping_dict = self.get_column_mapping()
        df.rename(columns=mapping_dict, inplace=True)

        # Zorunlu alan kontrolü (SKU ve Adet şart)
        required = ['sku', 'stock_quantity']
        missing = [f for f in required if f not in df.columns]
        
        if missing:
             return {"success": False, "error": f"Eksik sütunlar: {', '.join(missing)}"}

        updated_count = 0
        created_count = 0
        errors = []

        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    sku = str(row.get('sku')).strip()
                    qty = int(row.get('stock_quantity', 0))
                    price = row.get('buying_price', 0)
                    name = row.get('name', None)

                    defaults = {
                        'stock_quantity': qty,
                        'buying_price': price,
                    }
                    
                    # Eğer isim Excel'de varsa güncelle, yoksa eskisini koru
                    if name:
                        defaults['name'] = name

                    # update_or_create: Ürün varsa güncelle, yoksa oluştur
                    product, created = Product.objects.update_or_create(
                        sku=sku,
                        defaults=defaults
                    )
                    
                    # Eğer yeni ürünse ve fiyat varsa, weighted_cost'u da başlat
                    if created and price:
                        product.weighted_cost = price
                        product.save()
                    
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                        
                except Exception as e:
                    errors.append(f"Satır {index+1}: {str(e)}")

        return {
            "success": True,
            "created_count": created_count,
            "updated_count": updated_count,
            "errors": errors[:5]
        }

    def _create_transaction_from_row(self, row):
        """
        Tek bir satış satırını veritabanına kaydeder.
        """
        product_sku = row.get('sku')
        product_instance = None
        
        if product_sku:
            product_sku = str(product_sku).strip()
            product_instance = Product.objects.filter(sku=product_sku).first()

        Transaction.objects.create(
            marketplace=self.marketplace,
            product=product_instance,
            transaction_type='SALE',
            order_number=str(row.get('order_number')),
            quantity=int(row.get('quantity', 1)),
            sale_price=row.get('sale_price', 0),
            commission_amount=row.get('commission_amount', 0),
            shipping_cost=row.get('shipping_cost', 0),
            cost_at_transaction=product_instance.weighted_cost if product_instance else 0,
            transaction_date=row.get('transaction_date', pd.Timestamp.now())
        )