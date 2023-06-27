from hashlib import sha3_256
from secrets import randbits
from typing import Optional

from django.core.cache import cache

from rest_framework.status import HTTP_409_CONFLICT
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_simplejwt.views import Response

from .serializers import (
    CommitRollSerializer, HashesSerializer, IntegersSerializer, RevealRollSerializer
)


def _hash_int(value: int) -> str:
    """Hashes an integer value with SHA3-256."""
    return sha3_256(str(value).encode()).hexdigest()


def _cmp_ints(a: int, b: int) -> int:
    """Compares two integers."""
    return (a > b) - (a < b)


class RerollException(APIException):
    """Exception that prevents users from rerolling."""
    status_code = HTTP_409_CONFLICT
    default_code = 'dup_commit'
    default_detail = 'You cannot roll multiple times.'


class NoRollException(APIException):
    """Exception that is thrown no die has been rolled."""
    status_code = HTTP_409_CONFLICT
    default_code = 'no_commit'
    default_detail = 'You must roll before getting the result.'


class CommitRollView(GenericAPIView):
    """Viewset for the commitment phase of the roll."""
    serializer_class = CommitRollSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, format: Optional[str] = None) -> Response:
        # validate received data
        serializer = CommitRollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # prevent users from rerolling
        username = request.user.username
        if cache.has_key(f'commit_{username}'):
            raise RerollException()
        # generate and hash random numbers
        rand_client, rand_server = randbits(64), randbits(64)
        serializer.validated_data['server_hashes'] = {
            'client': _hash_int(rand_client),
            'server': _hash_int(rand_server)
        }
        # save data to the cache
        cache.set_many({
            f'rand_client_{username}': rand_client,
            f'rand_server_{username}': rand_server,
            f'commit_{username}': serializer.validated_data
        }, timeout=60)
        return Response(serializer.data)


class RevealRollView(GenericAPIView):
    """Viewset for the commitment phase of the roll."""
    serializer_class = RevealRollSerializer
    permission_classes = [IsAuthenticated]

    def _compute(self, a: int, b: int) -> int:
        """Computes a die roll from two numbers via XOR."""
        return (a ^ b) % 6 + 1

    def _verify(self, client_int: int, server_int: int, client_hash: str, server_hash: str):
        """Verifies that the received integers match the cached hashes."""
        errors = {'client_integers': {}}
        if (client_new_hash := _hash_int(client_int)) != client_hash:
            errors['client_integers']['client'] = f'Expected {client_hash}, got {client_new_hash}'
        if (server_new_hash := _hash_int(server_int)) != server_hash:
            errors['client_integers']['server'] = f'Expected {server_hash}, got {server_new_hash}'
        if len(errors['client_integers']) > 0:
            raise ValidationError(errors, code='hash_mismatch')

    def post(self, request: Request, format: Optional[str] = None) -> Response:
        # validate received data
        serializer = RevealRollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # check that the user has rolled a die
        username = request.user.username
        if not cache.has_key(f'commit_{username}'):
            raise NoRollException()
        # retrieve cached data
        rand_client: int = cache.get(f'rand_client_{username}')
        rand_server: int = cache.get(f'rand_server_{username}')
        commit_data: dict = cache.get(f'commit_{username}')
        # verify the client's numbers
        client_int: int = serializer.validated_data['client_integers']['client']
        server_int: int = serializer.validated_data['client_integers']['server']
        client_hash: str = commit_data['client_hashes']['client']
        server_hash: str = commit_data['client_hashes']['server']
        self._verify(client_int, server_int, client_hash, server_hash)
        # reveal the server's numbers
        serializer.validated_data['server_integers'] = {
            'client': rand_client,
            'server': rand_server
        }
        # reveal the winner
        client_roll = self._compute(rand_client, client_int)
        server_roll = self._compute(rand_server, server_int)
        serializer.validated_data['winner'] = _cmp_ints(client_roll, server_roll)
        # delete cached data
        cache.delete_many([
            f'rand_client_{username}',
            f'rand_server_{username}',
            f'commit_{username}'
        ])
        return Response(serializer.data)
