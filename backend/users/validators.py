from math import log2
from typing import Optional

from rest_framework.serializers import ValidationError

from users.models import User


class MinimumEntropyValidator:
    def __init__(self, min_entropy_ratio=0.8):
        #: The minimum acceptable ratio between the real and ideal entropy.
        self.min_entropy_ratio = min_entropy_ratio

    def validate(self, password: str, user: Optional[User] = None):
        """Validates the password based on its entropy."""
        length = len(password)
        # get probability of characters in string
        prob = [password.count(c) / length for c in set(password)]
        # calculate the entropy of the string
        entropy = abs(sum(p * log2(p) for p in prob))
        # check if the entropy is significantly lower than the ideal
        if entropy / log2(length) < self.min_entropy_ratio:
            raise ValidationError(self.get_help_text(), code='password_low_entropy')

    def get_help_text(self) -> str:
        """Explains the requirements."""
        return 'This password is not varied enough.'
