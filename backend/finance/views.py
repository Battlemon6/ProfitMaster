from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status, viewsets
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
import traceback
from .models import Transaction, Expense
from .serializers import TransactionSerializer, ExpenseSerializer

class DashboardStatsView(APIView):
    def get(self, request):
        # Hata ayıklama için terminale başlık atalım
        # print("\n--- DASHBOARD HESAPLAMASI BAŞLADI ---")

        try:
            # 1. GENEL TOPLAMLAR (TÜM ZAMANLAR)
            # ---------------------------------------------------------
            sales_agg = Transaction.objects.filter(transaction_type='SALE').aggregate(total=Sum('sale_price'))
            total_sales = float(sales_agg['total'] or 0)
            
            # Brüt Kârı Manuel Hesapla (En güvenlisi)
            gross_profit_from_sales = 0.0
            all_sales = Transaction.objects.filter(transaction_type='SALE')
            
            for t in all_sales:
                s = float(t.sale_price or 0)
                m = float(getattr(t, 'cost_at_transaction', 0) or 0) # Maliyet
                c = float(t.commission_amount or 0)
                k = float(t.shipping_cost or 0)
                # Formül: Satış - (Maliyet + Komisyon + Kargo)
                gross_profit_from_sales += (s - (m + c + k))

            expense_agg = Expense.objects.aggregate(total=Sum('amount'))
            total_expenses = float(expense_agg['total'] or 0)
            real_net_profit = gross_profit_from_sales - total_expenses

            # 2. GRAFİK VERİSİ (GÜNLÜK / AYLIK)
            # ---------------------------------------------------------
            period = request.query_params.get('period', 'daily')
            chart_data = []
            today = timezone.now().date()

            if period == 'monthly':
                # --- AYLIK MOD ---
                for i in range(11, -1, -1):
                    target_month = today.month - i
                    target_year = today.year
                    while target_month <= 0:
                        target_month += 12
                        target_year -= 1
                    
                    monthly_txs = Transaction.objects.filter(
                        transaction_type='SALE', 
                        transaction_date__year=target_year,
                        transaction_date__month=target_month
                    )
                    
                    monthly_profit = 0
                    for t in monthly_txs:
                        s = float(t.sale_price or 0)
                        m = float(getattr(t, 'cost_at_transaction', 0) or 0)
                        c = float(t.commission_amount or 0)
                        k = float(t.shipping_cost or 0)
                        monthly_profit += (s - (m + c + k))
                    
                    chart_data.append({
                        "date": f"{target_month}/{target_year}",
                        "profit": round(monthly_profit, 2)
                    })
            else:
                # --- GÜNLÜK MOD (Sorunlu olan kısım burasıydı, düzelttik) ---
                for i in range(29, -1, -1):
                    target_date = today - timedelta(days=i)
                    
                    # DÜZELTME: Sadece tarih eşitliği bazen saat farkından kaçabilir.
                    # Bu yüzden garanti olsun diye __year, __month, __day kullanıyoruz.
                    daily_txs = Transaction.objects.filter(
                        transaction_type='SALE',
                        transaction_date__year=target_date.year,
                        transaction_date__month=target_date.month,
                        transaction_date__day=target_date.day
                    )
                    
                    daily_profit = 0
                    for t in daily_txs:
                        s = float(t.sale_price or 0)
                        m = float(getattr(t, 'cost_at_transaction', 0) or 0)
                        c = float(t.commission_amount or 0)
                        k = float(t.shipping_cost or 0)
                        daily_profit += (s - (m + c + k))
                    
                    # Terminalde kontrol etmek istersen bu satırı aç:
                    # if daily_profit > 0:
                    #    print(f"Tarih: {target_date} -> Kâr: {daily_profit}")

                    chart_data.append({
                        "date": target_date.strftime("%d/%m"), # Örn: 15/12
                        "profit": round(daily_profit, 2)
                    })

            # 3. SON İŞLEMLER
            # ---------------------------------------------------------
            recent_qs = Transaction.objects.all().order_by('-transaction_date', '-id')[:5]
            recent_transactions = []
            for tx in recent_qs:
                recent_transactions.append({
                    "id": tx.id,
                    "transaction_type": tx.transaction_type,
                    "transaction_date": tx.transaction_date,
                    "sale_price": float(tx.sale_price or 0),
                    "product_details": {"name": tx.product.name} if tx.product else {"name": "Silinmiş Ürün"},
                    # Marketplace modeli yoksa string, varsa name dön
                    "marketplace_details": {"name": str(tx.marketplace) if tx.marketplace else "-"},
                })

            return Response({
                "total_sales": total_sales,
                "gross_profit": gross_profit_from_sales,
                "total_expenses": total_expenses,
                "net_profit": real_net_profit,
                "chart_data": chart_data,
                "recent_transactions": recent_transactions
            })

        except Exception as e:
            print("!!! DASHBOARD HATASI !!!")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=500)

# Diğer ViewSetler (Olduğu gibi kalmalı)
class TransactionViewSet(ModelViewSet):
    queryset = Transaction.objects.all().order_by('-transaction_date')
    serializer_class = TransactionSerializer
    filterset_fields = ['transaction_type']

    def perform_create(self, serializer):
        product = serializer.validated_data.get('product')
        cost = 0
        if product:
            cost = getattr(product, 'weighted_cost', 0)
        serializer.save(cost_at_transaction=cost)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        Transaction.objects.filter(id__in=ids).delete()
        return Response({"status": "ok"}, status=status.HTTP_200_OK)

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-expense_date')
    serializer_class = ExpenseSerializer