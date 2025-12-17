from rest_framework import serializers
from .models import Marketplace

# 1. Excel Yükleme İşlemi İçin
class FileUploadSerializer(serializers.Serializer):
    marketplace_id = serializers.IntegerField(required=True)
    file = serializers.FileField(required=True)
    file_type = serializers.ChoiceField(choices=[
        ('SALES', 'Satış/Hakediş Raporu'),
        ('STOCK', 'Stok Raporu')
    ])

    def validate_file(self, value):
        if not value.name.endswith(('.xls', '.xlsx')):
            raise serializers.ValidationError("Sadece .xls veya .xlsx dosyaları yüklenebilir.")
        return value

# 2. Pazaryeri Listeleme İşlemi İçin
class MarketplaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marketplace
        fields = ['id', 'name']