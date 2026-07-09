import os
from django.db.models.signals import post_delete, pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Product, UserProfile

# 1. Función auxiliar para borrar un archivo físico de forma segura


def delete_file_if_exists(storage_file):
    if storage_file and storage_file.name:
        if os.path.isfile(storage_file.path):
            os.remove(storage_file.path)

# 2. Señal para borrar archivos cuando se ELIMINA el producto completo


@receiver(post_delete, sender=Product)
def delete_product_images_on_delete(sender, instance, **kwargs):
    fields = [instance.image, instance.image2, instance.image3, instance.image4]
    for f in fields:
        delete_file_if_exists(f)

# 3. Señal para borrar archivos viejos cuando se EDITA o CAMBIA una imagen


@receiver(pre_save, sender=Product)
def delete_old_product_images_on_change(sender, instance, **kwargs):
    # Si el producto es nuevo (no tiene ID), no hay nada viejo que borrar
    if not instance.pk:
        return

    try:
        # Obtenemos la versión del producto que todavía está en la base de datos
        old_instance = Product.objects.get(pk=instance.pk)
    except Product.DoesNotExist:
        return

    # Lista de campos de imagen a comparar
    image_fields = ['image', 'image2', 'image3', 'image4']

    for field_name in image_fields:
        old_file = getattr(old_instance, field_name)
        new_file = getattr(instance, field_name)

        # Si el archivo viejo existe y es diferente al nuevo (o se ha borrado)
        if old_file and old_file != new_file:
            delete_file_if_exists(old_file)


# 4. Crear UserProfile automáticamente al crear un usuario
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)
