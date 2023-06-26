from rest_framework.mixins import CreateModelMixin
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from .models import User
from .serializers import UserSerializer


class UserViewSet(GenericViewSet, CreateModelMixin):
    """Viewset for the :class:`User` model."""
    authentication_classes = []
    queryset = User.objects.all()
    serializer_class = UserSerializer


#: User registration view.
user_register = UserViewSet.as_view({'post': 'create'})
