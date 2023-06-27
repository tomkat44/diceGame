from re import compile as regex

from django.core.validators import RegexValidator

from rest_framework.serializers import CharField, IntegerField


class HashField(CharField):
    """Field for hexadecimal hash values."""
    def __init__(self, **kwargs):
        kwargs.setdefault('allow_blank', False)
        super().__init__(**kwargs)
        if self.min_length == self.max_length:
            hash_re = regex(r'^[A-Fa-f0-9]{%d}$' % self.min_length)
        else:
            hash_re = regex(r'^[A-Fa-f0-9]{%d,%d}$' % (self.min_length, self.max_length))
        self.validators.append(RegexValidator(hash_re, 'Enter a valid hash.', 'invalid_hash'))


class UInt64Field(IntegerField):
    """Field for 64-bit unsigned integers."""
    def __init__(self, **kwargs):
        kwargs.setdefault('min_value', 0)
        kwargs.setdefault('max_value', 2 ** 64 - 1)
        super().__init__(**kwargs)
