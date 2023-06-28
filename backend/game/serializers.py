from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers

from .fields import HashField, UInt64Field


class IntegersSerializer(serializers.Serializer):
    #: The integer created for the client.
    client = UInt64Field(required=True)
    #: The integer created for the server.
    server = UInt64Field(required=True)


class CommitRollSerializer(serializers.Serializer):
    """Serializer for the hashed part (commit) of dice rolls."""
    #: The hash created by the client.
    client_hash = HashField(min_length=64, max_length=64, write_only=True, required=True)
    #: The hash created by the server.
    server_hash = HashField(min_length=64, max_length=64, read_only=True)


class RevealRollSerializer(serializers.Serializer):
    """Serializer for the unhashed part (reveal) of dice rolls."""
    #: The integers created by the client.
    client_integers = IntegersSerializer(write_only=True, required=True)
    #: The integers created by the server.
    server_integers = IntegersSerializer(read_only=True)
    #: The winner of the dice roll.
    #: * ``1`` -> client
    #: * ``-1`` -> server
    #: * ``0`` -> tie
    winner = serializers.IntegerField(read_only=True, min_value=-1, max_value=1)
