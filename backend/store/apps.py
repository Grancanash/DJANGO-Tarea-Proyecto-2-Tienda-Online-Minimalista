from django.apps import AppConfig


class StoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'store'

    def ready(self):
        # Este método se ejecuta cuando Django arranca
        import store.signals  # <--- Aquí importamos las señales
