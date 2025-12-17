from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/integrations/', include('integrations.urls')),
    path('api/finance/', include('finance.urls')), # <--- BU SATIR ÇOK ÖNEMLİ
    path('api/products/', include('products.urls'))
]