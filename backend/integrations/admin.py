from django.contrib import admin
from .models import Marketplace, ColumnMapping

@admin.register(Marketplace)
class MarketplaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')

@admin.register(ColumnMapping)
class ColumnMappingAdmin(admin.ModelAdmin):
    list_display = ('marketplace', 'file_type', 'excel_column_name', 'db_field_name')
    list_filter = ('marketplace', 'file_type')