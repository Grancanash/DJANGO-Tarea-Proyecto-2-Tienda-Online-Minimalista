from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, CategoryViewSet, OrderViewSet,
    GuestCheckoutView, RegisterFromOrderView, RegisterView,
    ShippingProfileView, UserMeView, GoogleLoginView,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'orders', OrderViewSet)

urlpatterns = [
    # Rutas explícitas DEBEN ir antes que el router para que el patrón
    # orders/{pk}/ del ViewSet no capture "guest-checkout" como si fuera un pk.
    path('orders/guest-checkout/', GuestCheckoutView.as_view(), name='guest-checkout'),
    path('users/register-from-order/', RegisterFromOrderView.as_view(), name='register-from-order'),
    path('users/register/', RegisterView.as_view(), name='user-register'),
    path('users/me/', UserMeView.as_view(), name='user-me'),
    path('users/shipping-profile/', ShippingProfileView.as_view(), name='shipping-profile'),
    path('auth/google/', GoogleLoginView.as_view(), name='google-login'),
    path('', include(router.urls)),
]
