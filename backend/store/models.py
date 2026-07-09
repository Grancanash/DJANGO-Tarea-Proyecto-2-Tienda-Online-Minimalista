from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, related_name='products', on_delete=models.SET_NULL, null=True, blank=True)
    summary = models.CharField(max_length=255, blank=True, help_text="Descripción breve para los listados")
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    featured = models.BooleanField(default=False, verbose_name="Destacado")
    # Aquí cumplimos el reto de "Carga de imágenes"
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    image2 = models.ImageField(upload_to='products/', null=True, blank=True)
    image3 = models.ImageField(upload_to='products/', null=True, blank=True)
    image4 = models.ImageField(upload_to='products/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    created_at = models.DateTimeField(auto_now_add=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)

    # -- Campos para Guest Checkout (envío) --
    guest_email = models.EmailField(null=True, blank=True, help_text="Email para pedidos de invitado")
    first_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    address_line1 = models.CharField(max_length=255, null=True, blank=True, verbose_name="Dirección")
    address_line2 = models.CharField(max_length=255, null=True, blank=True, verbose_name="Piso/Puerta")
    postal_code = models.CharField(max_length=20, null=True, blank=True, verbose_name="Código Postal")
    city = models.CharField(max_length=100, null=True, blank=True, verbose_name="Ciudad")
    province = models.CharField(max_length=100, null=True, blank=True, verbose_name="Provincia")
    phone = models.CharField(max_length=30, null=True, blank=True, verbose_name="Teléfono")
    delivery_notes = models.TextField(null=True, blank=True, verbose_name="Notas para el repartidor")

    def __str__(self):
        if self.user:
            return f"Pedido {self.id} de {self.user.username}"
        return f"Pedido invitado {self.id} ({self.guest_email or 'sin email'})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"


class ShippingProfile(models.Model):
    """Datos de envío guardados por el usuario para prerellenar el checkout."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='shipping_profile')
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)
    province = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30, blank=True)

    def __str__(self):
        return f"Perfil de envío de {self.user.username}"


class UserProfile(models.Model):
    """
    Perfil de usuario para permisos de la tienda (independiente de is_staff de Django).
    is_store_admin=True → acceso al panel React de administración de la tienda.
    No otorga acceso al admin de Django (/admin/).
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='store_profile')
    is_store_admin = models.BooleanField(
        default=False,
        verbose_name="Administrador de la tienda",
        help_text="Permite acceder al panel de administración de la tienda (React)."
    )

    def __str__(self):
        return f"Perfil de tienda de {self.user.username}"
