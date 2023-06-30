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

from .serializers import CommitRollSerializer, IntegersSerializer, RevealRollSerializer


def _hash_ints(a: int, b: int) -> str:
    """Concatenates and hashes two integers with SHA3-256."""
    return sha3_256((str(a) + str(b)).encode()).hexdigest()


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

    def check_permissions(self, request: Request):
        """Allows unauthenticated OPTIONS requests."""
        if request.method != 'OPTIONS':
            super().check_permissions(request)

    def post(self, request: Request, format: Optional[str] = None) -> Response:
        """Receives and handles POST request from the client."""
        # validate received data
        serializer = CommitRollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # prevent users from rerolling
        username = request.user.username
        if cache.has_key(f'commit_{username}'):
            raise RerollException()
        # generate and hash random numbers
        rand_client, rand_server = randbits(64), randbits(64)
        serializer.validated_data['server_hash'] = _hash_ints(rand_client, rand_server)
        # save data to the cache
        cache.set_many({
            f'rand_client_{username}': rand_client,
            f'rand_server_{username}': rand_server,
            f'commit_{username}': serializer.validated_data
        }, timeout=15)
        return Response(serializer.data)


class RevealRollView(GenericAPIView):
    """Viewset for the commitment phase of the roll."""
    serializer_class = RevealRollSerializer
    permission_classes = [IsAuthenticated]

    def _compute(self, a: int, b: int) -> int:
        """Computes a dice roll from two numbers via XOR."""
        return (a ^ b) % 6 + 1

    def check_permissions(self, request: Request):
        """Allows unauthenticated OPTIONS requests."""
        if request.method != 'OPTIONS':
            super().check_permissions(request)

    def post(self, request: Request, format: Optional[str] = None) -> Response:
        """Receives and handles POST request from the client."""
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
        client_hash: str = commit_data['client_hash']
        check_hash = _hash_ints(client_int, server_int)
        if check_hash != client_hash:
            raise ValidationError({
                'client_integers': f'Expected {client_hash}, got {check_hash}'
            }, code='hash_mismatch')
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
