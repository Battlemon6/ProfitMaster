from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from .serializers import FileUploadSerializer
from .models import Marketplace
from .services import ExcelProcessor
from rest_framework import viewsets
from .serializers import MarketplaceSerializer

class ExcelUploadView(GenericAPIView):
    serializer_class = FileUploadSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, *args, **kwargs):
        """
        Tarayıcıdan girildiğinde bilgi mesajı gösterir.
        """
        return Response({
            "message": "Excel yüklemek için POST isteği gönderin."
        })

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            file_obj = request.FILES['file']
            marketplace_id = serializer.validated_data['marketplace_id']
            file_type = serializer.validated_data['file_type']

            try:
                marketplace = Marketplace.objects.get(id=marketplace_id)
                
                # Servisi Başlat
                processor = ExcelProcessor(marketplace=marketplace, file_type=file_type)
                
                # Dosya türüne göre doğru işlemi seç
                result = {}
                if file_type == 'SALES':
                    result = processor.process_sales_file(file_obj)
                elif file_type == 'STOCK':
                    result = processor.process_stock_file(file_obj)
                else:
                    return Response({"error": "Geçersiz dosya türü"}, status=status.HTTP_400_BAD_REQUEST)

                if result['success']:
                    return Response({
                        "message": "İşlem Tamamlandı",
                        "detaylar": result
                    }, status=status.HTTP_201_CREATED)
                else:
                    return Response({
                        "message": "İşlem Başarısız",
                        "error": result.get('error', 'Bilinmeyen hata')
                    }, status=status.HTTP_400_BAD_REQUEST)

            except Marketplace.DoesNotExist:
                 return Response({"error": "Pazaryeri bulunamadı"}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class MarketplaceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Pazaryerlerini listeler (Sadece okuma yeterli).
    """
    queryset = Marketplace.objects.filter(is_active=True)
    serializer_class = MarketplaceSerializer