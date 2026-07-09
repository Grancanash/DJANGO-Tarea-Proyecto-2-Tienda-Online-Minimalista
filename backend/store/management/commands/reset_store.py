"""
Management command: python manage.py reset_store

Restaura la tienda a su estado original (30 productos, 10 categorías)
eliminando pedidos, productos y categorías actuales, y recargándolos
desde fixture.json.

Los usuarios (auth.User) y archivos multimedia no se tocan.
"""
import json
import os
from django.core.management.base import BaseCommand, CommandError
from django.apps import apps
from django.conf import settings
from django.db import connection, transaction
from django.db.models.signals import post_delete
from store.models import Product as ProductModel
from store.signals import delete_product_images_on_delete


def _find_fixture():
    """Busca fixture.json en varios lugares (local, Docker, etc.)."""
    candidates = [
        # Dentro del Docker (build context = ./backend)
        os.path.join(settings.BASE_DIR, 'fixture.json'),
        # Raíz del proyecto (desarrollo local)
        os.path.join(settings.BASE_DIR, '..', 'fixture.json'),
    ]
    for path in candidates:
        real = os.path.abspath(path)
        if os.path.exists(real):
            return real
    raise CommandError(
        f'fixture.json no encontrado. Buscado en: {candidates}'
    )


class Command(BaseCommand):
    help = 'Resetea productos y categorías al estado original del fixture.json'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra lo que se haría sin ejecutar cambios',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('🧪 MODO DRY-RUN — no se modificará nada\n'))

        self.stdout.write('🔧 Restaurando tienda a estado original...')

        fixture_path = _find_fixture()
        self.stdout.write(f'   📄 Leyendo fixture: {fixture_path}')

        with open(fixture_path, encoding='utf-8') as f:
            fixture_data = json.load(f)

        # 2. Separar entradas por modelo
        categories_data = [e for e in fixture_data if e['model'] == 'store.category']
        products_data = [e for e in fixture_data if e['model'] == 'store.product']

        self.stdout.write(
            f'   📊 Fixture contiene {len(categories_data)} categorías '
            f'y {len(products_data)} productos'
        )

        Category = apps.get_model('store', 'Category')
        Product = apps.get_model('store', 'Product')
        OrderItem = apps.get_model('store', 'OrderItem')
        Order = apps.get_model('store', 'Order')

        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f'   🧪 Se eliminarían {OrderItem.objects.count()} order items, '
                f'{Order.objects.count()} pedidos, '
                f'{Product.objects.count()} productos '
                f'y {Category.objects.count()} categorías'
            ))
            self.stdout.write(self.style.SUCCESS(
                f'   🧪 Se crearían {len(categories_data)} categorías '
                f'y {len(products_data)} productos'
            ))
            return

        with transaction.atomic():
            # 3. Eliminar en orden (respetando FK)
            deleted_oi = OrderItem.objects.all().delete()[0]
            self.stdout.write(f'   🗑️  {deleted_oi} order items eliminados')

            deleted_o = Order.objects.all().delete()[0]
            self.stdout.write(f'   🗑️  {deleted_o} pedidos eliminados')

            # Desconectar la señal que borra archivos físicos al eliminar productos
            # (no queremos perder las imágenes originales durante el reset)
            post_delete.disconnect(delete_product_images_on_delete, sender=ProductModel)
            try:
                deleted_p = Product.objects.all().delete()[0]
                self.stdout.write(f'   🗑️  {deleted_p} productos eliminados')
            finally:
                post_delete.connect(delete_product_images_on_delete, sender=ProductModel)

            deleted_c = Category.objects.all().delete()[0]
            self.stdout.write(f'   🗑️  {deleted_c} categorías eliminadas')

            # 4. Recrear categorías con sus PKs originales
            for entry in categories_data:
                cat = Category(**entry['fields'])
                cat.pk = entry['pk']
                cat.save()

            self.stdout.write(f'   ✅ {len(categories_data)} categorías restauradas')

            # 5. Recrear productos con sus PKs originales
            for entry in products_data:
                fields = entry['fields'].copy()
                # La fixture usa 'category' (FK) con valor entero; hay que pasarlo
                # como 'category_id' para que Django acepte el PK directamente
                if 'category' in fields:
                    fields['category_id'] = fields.pop('category')
                prod = Product(**fields)
                prod.pk = entry['pk']
                prod.save()

            self.stdout.write(f'   ✅ {len(products_data)} productos restaurados')

            # 6. Resetear secuencias de auto-incremento (PostgreSQL)
            if connection.vendor == 'postgresql':
                with connection.cursor() as cursor:
                    for table in [
                        'store_orderitem', 'store_order',
                        'store_product', 'store_category'
                    ]:
                        cursor.execute(
                            f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                            f"(SELECT COALESCE(MAX(id), 1) FROM {table}))"
                        )
                self.stdout.write('   🔢 Secuencias PostgreSQL reseteadas')

            # 7. Asegurar que el usuario demo admin tiene los permisos correctos
            from django.core.management import call_command
            call_command('setup_demo_admin')

        self.stdout.write(self.style.SUCCESS('\n🎉 Tienda restaurada a su estado original.'))
