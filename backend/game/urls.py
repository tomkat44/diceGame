from django.urls import path

from .views import CommitRollView, RevealRollView

#: URL patterns for the game app.
urlpatterns = [
    path('game/commit/', CommitRollView.as_view()),
    path('game/reveal/', RevealRollView.as_view()),
]
