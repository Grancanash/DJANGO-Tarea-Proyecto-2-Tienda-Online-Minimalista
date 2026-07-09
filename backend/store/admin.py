from django.contrib import admin
from django.urls import path, reverse
from django.shortcuts import redirect
from django.utils.html import format_html
from .models import Category, Product, Order, OrderItem, ShippingProfile, UserProfile


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'featured_star', 'price', 'stock', 'created_at')
    list_display_links = ('id', 'name')
    list_select_related = ('category',)
    search_fields = ('name', 'description')
    list_filter = ('category', 'featured')
    fieldsets = (
        ('Información general', {
            'fields': ('name', 'category', 'summary', 'description', 'price', 'stock', 'featured')
        }),
        ('Imágenes', {
            'fields': ('image', 'image2', 'image3', 'image4')
        }),
    )

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:product_id>/toggle-featured/',
                self.admin_site.admin_view(self.toggle_featured_view),
                name='product-toggle-featured',
            ),
        ]
        return custom_urls + urls

    def toggle_featured_view(self, request, product_id):
        """Vista que invierte el estado de 'featured' y redirige de vuelta al listado."""
        product = Product.objects.get(pk=product_id)
        product.featured = not product.featured
        product.save(update_fields=['featured'])
        return redirect(request.META.get('HTTP_REFERER', reverse('admin:store_product_changelist')))

    @admin.display(description='⭐ Destacado', ordering='featured')
    def featured_star(self, obj):
        """Renderiza una estrella clickeable que alterna el estado de destacado."""
        toggle_url = reverse('admin:product-toggle-featured', args=[obj.pk])
        if obj.featured:
            return format_html(
                '<a href="{}" title="Quitar destacado" '
                'style="font-size:1.3rem;text-decoration:none;">⭐</a>',
                toggle_url,
            )
        return format_html(
            '<a href="{}" title="Marcar como destacado" '
            'style="font-size:1.3rem;text-decoration:none;filter:grayscale(1);opacity:0.3;">☆</a>',
            toggle_url,
        )

    class Media:
        css = {
            'all': ('admin/featured_star.css',),
        }


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ('product', 'price', 'quantity')
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'guest_email', 'total_price', 'is_paid', 'created_at')
    list_select_related = ('user',)
    inlines = (OrderItemInline,)
    list_filter = ('is_paid',)
    search_fields = ('guest_email', 'user__email', 'first_name', 'last_name')
    fieldsets = (
        ('Cliente', {
            'fields': ('user', 'guest_email', 'first_name', 'last_name', 'phone')
        }),
        ('Dirección de envío', {
            'fields': ('address_line1', 'address_line2', 'postal_code', 'city', 'province')
        }),
        ('Pedido', {
            'fields': ('total_price', 'is_paid', 'delivery_notes', 'created_at')
        }),
    )
    readonly_fields = ('created_at',)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'product', 'quantity', 'price')
    list_select_related = ('order', 'product')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_store_admin')
    list_filter = ('is_store_admin',)
    search_fields = ('user__username', 'user__email')
    raw_id_fields = ('user',)


@admin.register(ShippingProfile)
class ShippingProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'province', 'phone')
    search_fields = ('user__username', 'city')
    raw_id_fields = ('user',)
