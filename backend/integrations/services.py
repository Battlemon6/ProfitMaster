import pandas as pd
from django.db import transaction
from decimal import Decimal
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
            df = pd.read_excel(file_obj) if file_obj.name.endswith('.xlsx') else pd.read_csv(file_obj)
        except Exception as e:
            return {"success": False, "error": f"Excel okunamadı: {str(e)}"}

        mapping_dict = self.get_column_mapping()
        df.rename(columns=mapping_dict, inplace=True)

        required_fields = ['order_number', 'sale_price', 'sku']
        missing_fields = [field for field in required_fields if field not in df.columns]
        
        if missing_fields:
             return {
                 "success": False, 
                 "error": f"Eksik sütunlar: {', '.join(missing_fields)}. Admin panelden Mapping yapın."
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
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            else:
                df = pd.read_excel(file_obj)
            
            df.columns = [str(c).strip().lower() for c in df.columns]
        except Exception as e:
            return {"success": False, "error": f"Dosya okunamadı: {str(e)}"}

        mapping_dict = self.get_column_mapping()
        clean_mapping = {str(k).strip().lower(): v for k, v in mapping_dict.items()}
        df.rename(columns=clean_mapping, inplace=True)

        if 'sku' not in df.columns:
             return {"success": False, "error": "Excel'de 'sku' sütunu bulunamadı!"}

        updated_count = 0
        created_count = 0
        errors = []

        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    sku = str(row.get('sku', '')).strip()
                    if not sku or sku.lower() == 'nan': continue
                    
                    # Sayısal veri temizliği
                    raw_qty = row.get('stock_quantity', 0)
                    excel_qty = int(float(raw_qty)) if pd.notna(raw_qty) and str(raw_qty).lower() != 'nan' else 0
                    
                    raw_price = row.get('buying_price', 0)
                    excel_price = Decimal(str(raw_price)) if pd.notna(raw_price) and str(raw_price).lower() != 'nan' else Decimal('0')
                    
                    product = Product.objects.filter(sku=sku).first()
                    
                    if product:
                        # Eğer ürün varsa: Fiyat 0 değilse güncelle ve stoğu mevcutun üzerine EKLE
                        if excel_price > 0:
                            product.buying_price = excel_price
                        
                        product.stock_quantity += excel_qty
                        product.save() # Bu çağrı Product modelindeki hesaplamayı tetikler
                        updated_count += 1
                    else:
                        # Ürün yoksa yeni oluştur
                        Product.objects.create(
                            sku=sku,
                            name=str(row.get('name', sku)) if pd.notna(row.get('name')) else sku,
                            stock_quantity=excel_qty,
                            buying_price=excel_price,
                            barcode=str(row.get('barcode', '')) if pd.notna(row.get('barcode')) else '',
                            description=str(row.get('description', '')) if pd.notna(row.get('description')) else ''
                        )
                        created_count += 1
                        
                except Exception as e:
                    errors.append(f"Satır {index+1}: {str(e)}")

        return {
            "success": True,
            "created_count": created_count,
            "updated_count": updated_count,
            "errors": errors[:5]
        }

    def _create_transaction_from_row(self, row):
        product_sku = str(row.get('sku', '')).strip()
        product_instance = Product.objects.filter(sku=product_sku).first()

        cost = Decimal('0')
        if product_instance:
            cost = product_instance.weighted_cost if product_instance.weighted_cost > 0 else product_instance.buying_price

        Transaction.objects.create(
            marketplace=self.marketplace,
            product=product_instance,
            transaction_type='SALE',
            order_number=str(row.get('order_number')),
            quantity=int(row.get('quantity', 1)),
            sale_price=row.get('sale_price', 0),
            commission_amount=row.get('commission_amount', 0),
            shipping_cost=row.get('shipping_cost', 0),
            cost_at_transaction=cost,
            transaction_date=row.get('transaction_date', pd.Timestamp.now())
        )