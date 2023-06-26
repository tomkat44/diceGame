from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password

from rest_framework.serializers import ModelSerializer

from .models import User


class UserSerializer(ModelSerializer):
    """Serializer for :class:`User` objects."""

    def validate_password(self, value: str) -> str:
        """Ensures the password adheres to the policy."""
        validate_password(value)
        return value

    def create(self, validated_data: dict) -> User:
        """Ensures the password is hashed when added to the database."""
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email', 'password')
        extra_kwargs = {
            'first_name': {
                'required': True,
                'allow_blank': False
            },
            'last_name': {
                'required': True,
                'allow_blank': False
            },
            'password': {
                'min_length': 8,
                'write_only': True,
                'style': {'input_type': 'password'}
            }
        }
