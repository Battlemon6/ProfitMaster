from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DashboardStatsView, TransactionViewSet
from .views import DashboardStatsView, TransactionViewSet, ExpenseViewSet # Import'a ekleyin

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet) # /api/finance/transactions/
router.register(r'expenses', ExpenseViewSet) # <--- YENİ EKLENEN SATIR

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
]