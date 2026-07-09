from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (TokenObtainPairView, TokenRefreshView,)
from store.views import ChangePasswordView


urlpatterns = [
    path('admin-django/', admin.site.urls),
    path('api/', include('store.urls')),

    # Rutas para autenticación
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Ruta para cambiar contraseña
    path('api/change-password/', ChangePasswordView.as_view(), name='change_password'),
]

# Esto le dice a Django que si estamos en modo DEBUG (desarrollo),
# sirva los archivos de la carpeta MEDIA_ROOT a través de MEDIA_URL
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
