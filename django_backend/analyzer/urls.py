from django.urls import path
from .views import (
    UploadAndParseChatView,
    ActionItemsView,
    FilesCatalogView,
    HealthCheckView
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('parse/', UploadAndParseChatView.as_view(), name='parse-chat'),
    path('sessions/<int:session_id>/actions/', ActionItemsView.as_view(), name='session-actions'),
    path('sessions/<int:session_id>/files/', FilesCatalogView.as_view(), name='session-files'),
]
