from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Product, Category, Order, OrderItem, ShippingProfile


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Añade username, email e is_staff al payload del JWT."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        # Permiso para el panel React de la tienda (independiente del admin de Django)
        profile = getattr(user, 'store_profile', None)
        token['is_store_admin'] = profile.is_store_admin if profile else False
        return token


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'summary', 'description', 'price',
            'stock', 'featured', 'image', 'image2', 'image3', 'image4',
            'category', 'category_name', 'created_at'
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'price', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_username = serializers.ReadOnlyField(source='user.username', default=None)
    user_email = serializers.ReadOnlyField(source='user.email', default=None)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_username', 'user_email',
            'created_at', 'total_price', 'is_paid', 'items',
            'guest_email', 'first_name', 'last_name',
            'address_line1', 'address_line2', 'postal_code',
            'city', 'province', 'phone', 'delivery_notes',
        ]
        read_only_fields = ['user', 'is_paid']

    def create(self, validated_data):
        items_data = self.context.get('items')
        order = Order.objects.create(**validated_data)

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

        return order


# ─── Serializadores para Guest Checkout ───

class GuestCheckoutSerializer(serializers.Serializer):
    """Valida el payload completo de un pedido como invitado."""
    items = serializers.ListField(
        child=serializers.DictField(), min_length=1
    )
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    guest_email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    address_line1 = serializers.CharField(max_length=255)
    address_line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    postal_code = serializers.CharField(max_length=20)
    city = serializers.CharField(max_length=100)
    province = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    delivery_notes = serializers.CharField(required=False, allow_blank=True)


class RegisterFromOrderSerializer(serializers.Serializer):
    """Recibe el ID del pedido y crea un User a partir de sus datos."""
    order_id = serializers.IntegerField()

    def validate_order_id(self, value):
        try:
            order = Order.objects.get(pk=value)
        except Order.DoesNotExist:
            raise serializers.ValidationError("Pedido no encontrado.")
        if not order.guest_email:
            raise serializers.ValidationError("Este pedido no tiene email de invitado asociado.")
        if User.objects.filter(email=order.guest_email).exists():
            raise serializers.ValidationError("Ya existe una cuenta con este email.")
        self._order = order
        return value

    def create_user(self):
        order = self._order
        password = User.objects.make_random_password(length=12)
        user = User.objects.create_user(
            username=order.guest_email,
            email=order.guest_email,
            first_name=order.first_name or '',
            last_name=order.last_name or '',
            password=password,
        )
        order.user = user
        order.save(update_fields=['user'])
        return user, password


class ShippingProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingProfile
        fields = ['first_name', 'last_name', 'address_line1', 'postal_code', 'city', 'province', 'phone']
