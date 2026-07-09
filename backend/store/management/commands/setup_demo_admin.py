"""
Management command: python manage.py setup_demo_admin

Crea (o actualiza) el usuario demo para la tienda:
- username: demo
- password: 123456
- is_store_admin: True (accede al panel React de administración)
- is_staff: False (NO accede al admin de Django)

El usuario real 'admin' (con is_staff=True) NO se modifica.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from store.models import UserProfile


DEMO_USERNAME = 'demo'
DEMO_PASSWORD = '123456'


class Command(BaseCommand):
    help = 'Configura el usuario demo de la tienda (sin acceso al admin de Django)'

    def handle(self, *args, **options):
        user, created = User.objects.update_or_create(
            username=DEMO_USERNAME,
            defaults={
                'email': 'demo@xenoflora.demo',
                'is_staff': False,       # ← NO acceso al admin de Django
                'is_superuser': False,
            }
        )
        user.set_password(DEMO_PASSWORD)
        user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.is_store_admin = True    # ← SÍ acceso al panel React
        profile.save(update_fields=['is_store_admin'])

        if created:
            self.stdout.write(self.style.SUCCESS(
                f'✅ Usuario demo "{DEMO_USERNAME}" creado con contraseña "{DEMO_PASSWORD}"'
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'✅ Usuario demo "{DEMO_USERNAME}" actualizado (is_staff=False, is_store_admin=True)'
            ))
