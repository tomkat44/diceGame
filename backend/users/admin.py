from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from .models import User


class UserAdmin(admin.ModelAdmin):
    """Admin model for :class:`User`."""
    list_display = ('username', 'first_name', 'last_name')
    fields = (
        'username', 'first_name', 'last_name', 'email',
        'is_active', 'date_joined', 'last_login'
    )
    readonly_fields = ('date_joined', 'last_login')

    def has_add_permission(self, request) -> bool:
        """Prevents adding a new user from the admin panel."""
        return False


admin.site.register(User, UserAdmin)
admin.site.unregister(Group)
