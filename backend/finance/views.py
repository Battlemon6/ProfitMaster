from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status, viewsets
from django.db.models import Sum
from django.utils import timezone
from django.db import transaction
from datetime import datetime
import traceback
from decimal import Decimal
from .models import Transaction, Expense
from .serializers import TransactionSerializer, ExpenseSerializer
from products.models import Product

class DashboardStatsView(APIView):
    def get(self, request):
        try:
            sales_agg = Transaction.objects.filter(transaction_type='SALE').aggregate(total=Sum('sale_price'))
            total_sales = float(sales_agg['total'] or 0)
            
            gross_profit_from_sales = 0.0
            all_sales = Transaction.objects.filter(transaction_type='SALE').select_related('product')
            
            for t in all_sales:
                s = float(t.sale_price or 0)
                m = float(t.cost_at_transaction or 0)
                c = float(t.commission_amount or 0)
                k = float(t.shipping_cost or 0)
                q = float(t.quantity or 1)
                gross_profit_from_sales += (s - (m * q + c + k))

            expense_agg = Expense.objects.aggregate(total=Sum('amount'))
            total_expenses = float(expense_agg['total'] or 0)
            real_net_profit = gross_profit_from_sales - total_expenses

            period = request.query_params.get('period', 'daily')
            chart_data = []
            today = timezone.now().date()

            if period == 'monthly':
                for i in range(11, -1, -1):
                    target_month = today.month - i
                    target_year = today.year
                    while target_month <= 0:
                        target_month += 12
                        target_year -= 1
                    monthly_txs = Transaction.objects.filter(transaction_type='SALE', transaction_date__year=target_year, transaction_date__month=target_month)
                    monthly_profit = 0
                    for t in monthly_txs:
                        s, m, c, k, q = float(t.sale_price or 0), float(t.cost_at_transaction or 0), float(t.commission_amount or 0), float(t.shipping_cost or 0), float(t.quantity or 1)
                        monthly_profit += (s - (m * q + c + k))
                    chart_data.append({"date": f"{target_month}/{target_year}", "profit": round(monthly_profit, 2)})
            else:
                for i in range(29, -1, -1):
                    target_date = today - timezone.timedelta(days=i)
                    daily_txs = Transaction.objects.filter(transaction_type='SALE', transaction_date__year=target_date.year, transaction_date__month=target_date.month, transaction_date__day=target_date.day)
                    daily_profit = 0
                    for t in daily_txs:
                        s, m, c, k, q = float(t.sale_price or 0), float(t.cost_at_transaction or 0), float(t.commission_amount or 0), float(t.shipping_cost or 0), float(t.quantity or 1)
                        daily_profit += (s - (m * q + c + k))
                    chart_data.append({"date": target_date.strftime("%d/%m"), "profit": round(daily_profit, 2)})

            recent_qs = Transaction.objects.all().order_by('-transaction_date', '-id')[:5]
            recent_transactions = []
            for tx in recent_qs:
                recent_transactions.append({
                    "id": tx.id,
                    "transaction_date": tx.transaction_date,
                    "sale_price": float(tx.sale_price or 0),
                    "product_details": {"name": tx.product.name if tx.product else "Bilinmeyen"},
                    "marketplace_details": {"name": str(tx.marketplace.name) if tx.marketplace else "-"},
                })

            return Response({"total_sales": total_sales, "gross_profit": gross_profit_from_sales, "total_expenses": total_expenses, "net_profit": real_net_profit, "chart_data": chart_data, "recent_transactions": recent_transactions})
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class TransactionViewSet(ModelViewSet):
    queryset = Transaction.objects.all().order_by('-transaction_date')
    serializer_class = TransactionSerializer
    filterset_fields = ['transaction_type']

    def perform_create(self, serializer):
        """
        TEKLİ SATIŞ: Ürün stoğundan düşer ve maliyeti sabitler.
        """
        product = serializer.validated_data.get('product')
        quantity = serializer.validated_data.get('quantity', 1)
        transaction_type = serializer.validated_data.get('transaction_type', 'SALE')
        
        cost = Decimal('0')
        if product:
            cost = product.weighted_cost if product.weighted_cost > 0 else product.buying_price
            
            # --- STOKTAN DÜŞÜM ---
            if transaction_type == 'SALE':
                product.stock_quantity -= quantity
                product.save() # Product modelindeki save mantığı tetiklenir
        
        serializer.save(cost_at_transaction=cost)
    
    @action(detail=False, methods=['post'], url_path='bulk_create')
    def bulk_create(self, request):
        """
        SEPET (TOPLU) SATIŞ: Her ürün için stoğu düşer ve kaydeder.
        """
        print("\n🚀 [DEBUG] BULK_CREATE BASLADI (Stok Düşümü Dahil)")
        try:
            items = request.data.get('items', [])
            common_data = request.data.get('common', {})
            
            if not items:
                return Response({"error": "Sepet boş"}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                total_shipping = Decimal(str(common_data.get('shipping_cost') or '0'))
                shipping_per_item = total_shipping / len(items) if len(items) > 0 else 0
                
                aware_date = timezone.make_aware(datetime.strptime(common_data['transaction_date'], '%Y-%m-%d'))

                for item in items:
                    product = Product.objects.get(id=item['product'])
                    qty = int(item.get('quantity', 1))
                    
                    # Maliyet Hesapla
                    cost = product.weighted_cost if product.weighted_cost > 0 else product.buying_price
                    
                    # --- STOKTAN DÜŞÜM ---
                    if common_data.get('transaction_type', 'SALE') == 'SALE':
                        product.stock_quantity -= qty
                        product.save()
                    
                    # Satışı Kaydet
                    Transaction.objects.create(
                        marketplace_id=common_data['marketplace'],
                        transaction_date=aware_date,
                        order_number=common_data['order_number'],
                        transaction_type=common_data.get('transaction_type', 'SALE'),
                        shipping_cost=shipping_per_item,
                        product=product,
                        quantity=qty,
                        sale_price=Decimal(str(item.get('sale_price', 0))),
                        commission_amount=Decimal(str(item.get('commission_amount', 0))),
                        cost_at_transaction=cost
                    )
                
            print("✅ [DEBUG] SATIŞLAR VE STOK GÜNCELLEMELERİ TAMAMLANDI")
            return Response({"status": "ok"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"❌ [DEBUG] HATA: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        Transaction.objects.filter(id__in=ids).delete()
        return Response({"status": "ok"}, status=status.HTTP_200_OK)

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-expense_date')
    serializer_class = ExpenseSerializer