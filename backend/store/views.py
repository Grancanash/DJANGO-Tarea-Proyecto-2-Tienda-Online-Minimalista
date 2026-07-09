import os
from rest_framework import viewsets, filters, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .models import Product, Category, Order, OrderItem, ShippingProfile
from .serializers import (
    ProductSerializer, CategorySerializer, OrderSerializer,
    GuestCheckoutSerializer, RegisterFromOrderSerializer, ShippingProfileSerializer,
)


class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 48


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    authentication_classes = []
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').order_by('-created_at')
    serializer_class = ProductSerializer
    pagination_class = ProductPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    authentication_classes = []
    permission_classes = [AllowAny]

    def get_queryset(self):
        """
        Optimizado con select_related('category') para evitar N+1 al serializar
        category_name en ProductSerializer.
        Filtros soportados:
          ?category=X   -> filtra por ID de categoría
          ?featured=1   -> solo productos destacados
        """
        queryset = super().get_queryset()

        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        featured = self.request.query_params.get('featured')
        if featured == '1' or featured == 'true':
            queryset = queryset.filter(featured=True)

        return queryset


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('user').prefetch_related('items__product').order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filtra los pedidos del usuario autenticado.
        Soporta user=None (guest) — simplemente no aparecen aquí.
        """
        return super().get_queryset().filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        items_data = request.data.get('items')

        if not items_data or len(items_data) == 0:
            return Response(
                {"error": "No hay productos en el contenedor de carga"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(
            data=request.data,
            context={'items': items_data}
        )

        serializer.is_valid(raise_exception=True)

        # Simulamos la pasarela de pago: marcamos is_paid=True directamente
        order = serializer.save(user=request.user, is_paid=True)

        # Re-serializamos con el queryset optimizado para incluir items prefetchados
        optimized_order = (
            Order.objects
            .filter(pk=order.pk)
            .select_related('user')
            .prefetch_related('items__product')
            .first()
        )

        # ─── Enviar email de confirmación ───
        _send_order_confirmation(optimized_order)

        return Response(
            OrderSerializer(optimized_order).data,
            status=status.HTTP_201_CREATED
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # El usuario demo no puede cambiar su contraseña
        if user.username == 'demo':
            return Response(
                {
                    "error": (
                        "Este usuario es una cuenta demo compartida. "
                        "La contraseña no se puede modificar para que todos "
                        "los visitantes puedan probar la tienda. "
                        "Si quieres tu propia cuenta, crea una nueva."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not user.check_password(old_password):
            return Response(
                {"error": "La contraseña actual no es correcta"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not new_password or len(new_password) < 4:
            return Response(
                {"error": "La nueva contraseña debe tener al menos 4 caracteres"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response({"message": "Contraseña actualizada con éxito"}, status=status.HTTP_200_OK)


# ─── Guest Checkout & Post-Purchase Registration ───

class GuestCheckoutView(APIView):
    """
    POST /api/orders/guest-checkout/
    Permite a usuarios anónimos/invitados crear un pedido sin autenticarse.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GuestCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        items_data = data.pop('items')

        # Crear la orden (user=None es válido ahora)
        order = Order.objects.create(**data, is_paid=True)

        # Procesar items (misma lógica optimizada que OrderSerializer.create)
        product_ids = [item['product'] for item in items_data]
        products_map = {
            p.id: p
            for p in Product.objects.filter(id__in=product_ids)
        }

        order_items = []
        products_to_update = []

        for item in items_data:
            product = products_map.get(item['product'])
            if not product:
                continue

            product.stock -= item['quantity']
            if product.stock < 0:
                product.stock = 0
            products_to_update.append(product)

            order_items.append(
                OrderItem(
                    order=order,
                    product_id=product.id,
                    quantity=item['quantity'],
                    price=item['price']
                )
            )

        Product.objects.bulk_update(products_to_update, ['stock'])
        OrderItem.objects.bulk_create(order_items)

        # Re-fetch optimizado para la respuesta
        optimized_order = (
            Order.objects
            .filter(pk=order.pk)
            .prefetch_related('items__product')
            .first()
        )

        # ─── Enviar email de confirmación ───
        _send_order_confirmation(optimized_order)

        return Response(
            OrderSerializer(optimized_order).data,
            status=status.HTTP_201_CREATED
        )


class RegisterFromOrderView(APIView):
    """
    POST /api/users/register-from-order/
    Crea una cuenta de usuario a partir de los datos de un pedido invitado.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterFromOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user, password = serializer.create_user()

        return Response({
            'message': 'Cuenta creada con éxito.',
            'email': user.email,
            'username': user.username,
            'temporary_password': password,
        }, status=status.HTTP_201_CREATED)


class RegisterView(APIView):
    """
    POST /api/users/register/
    Crea una cuenta de cliente con username, email y password.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        errors = {}
        if not username:
            errors['username'] = 'El nombre de usuario es obligatorio.'
        if not email:
            errors['email'] = 'El email es obligatorio.'
        if not password or len(password) < 4:
            errors['password'] = 'La contraseña debe tener al menos 4 caracteres.'

        if User.objects.filter(username=username).exists():
            errors['username'] = 'Este nombre de usuario ya está en uso.'
        if User.objects.filter(email=email).exists():
            errors['email'] = 'Este email ya está registrado.'

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )

        return Response({
            'message': 'Cuenta creada con éxito.',
            'email': user.email,
            'username': user.username,
        }, status=status.HTTP_201_CREATED)


class UserMeView(APIView):
    """GET /api/users/me/ — Datos básicos del usuario autenticado."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'username': user.username,
            'email': user.email,
        })


class ShippingProfileView(APIView):
    """GET/PUT /api/users/shipping-profile/ — Datos de envío del usuario autenticado."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = ShippingProfile.objects.get_or_create(user=request.user)
        serializer = ShippingProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        profile, _ = ShippingProfile.objects.get_or_create(user=request.user)
        serializer = ShippingProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


GOOGLE_CLIENT_ID = os.environ.get(
    'GOOGLE_CLIENT_ID', '407380072093-net9iu582ctjsa5aego2pdqeq220l5l6.apps.googleusercontent.com')


class GoogleLoginView(APIView):
    """
    POST /api/auth/google/
    Recibe un access_token de Google (implicit flow), obtiene los datos
    del usuario desde Google, crea/víncula un User y devuelve JWT.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        access_token = request.data.get('credential')
        if not access_token:
            return Response({'error': 'Token de Google no proporcionado'}, status=400)

        try:
            # Validar el access_token contra la API de Google (id_token)
            idinfo = id_token.verify_oauth2_token(
                access_token,
                google_requests.Request(),
                GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10,
            )
        except ValueError:
            # Fallback: obtener userinfo directamente con el access_token
            import requests as req
            userinfo_resp = req.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            if userinfo_resp.status_code != 200:
                return Response({'error': 'Token de Google inválido'}, status=400)
            idinfo = userinfo_resp.json()

        email = idinfo.get('email')
        if not email:
            return Response({'error': 'No se pudo obtener el email de Google'}, status=400)

        user, created = User.objects.get_or_create(
            username=email,
            defaults={
                'email': email,
                'first_name': idinfo.get('given_name', ''),
                'last_name': idinfo.get('family_name', ''),
            }
        )
        if not created and not user.email:
            user.email = email
            user.save(update_fields=['email'])

        refresh = RefreshToken.for_user(user)
        refresh['username'] = user.username
        refresh['email'] = user.email
        refresh['is_staff'] = user.is_staff

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


# ─── Helper: envío de email de confirmación de pedido ───

def _send_order_confirmation(order):
    """Envía un email de confirmación al cliente tras realizar un pedido."""
    recipient = order.guest_email or (order.user.email if order.user else None)
    if not recipient:
        return

    items_lines = []
    for item in order.items.all():
        items_lines.append(f"  • {item.product.name} × {item.quantity} — {item.price} €")

    subject = f"[Tienda Minimalista] Pedido #{order.id} confirmado"
    message = f"""
¡Hola {order.first_name or 'explorador'}!

Tu pedido #{order.id} ha sido confirmado y está siendo preparado.

🌱 Resumen del pedido:
{chr(10).join(items_lines)}

💰 Total: {order.total_price} €

📍 Dirección de envío:
{order.address_line1}
{order.postal_code} {order.city}, {order.province}

Gracias por confiar en nosotros. Pronto recibirás noticias sobre el envío.

— El equipo de Tienda Minimalista
"""
    html_message = f"""
<h2>¡Pedido #{order.id} confirmado!</h2>
<p>Hola <strong>{order.first_name or 'explorador'}</strong>, tu pedido ha sido confirmado.</p>
<h3>🌱 Resumen:</h3>
<ul>
{"".join(f"<li>{item.product.name} × {item.quantity} — {item.price} €</li>" for item in order.items.all())}
</ul>
<p><strong>Total: {order.total_price} €</strong></p>
<p>📍 Envío a: {order.address_line1}, {order.postal_code} {order.city}, {order.province}</p>
<hr>
<p>Gracias por confiar en nosotros. — Tienda Minimalista</p>
"""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            html_message=html_message,
            fail_silently=True,
        )
    except Exception:
        pass  # El email es informativo; no debe bloquear el flujo de compra
