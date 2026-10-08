from rest_framework import serializers
from .models import ChatSession, ChatMessageRecord, ActionItemRecord, FileAttachmentRecord

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessageRecord
        fields = [
            'id', 'date_str', 'time_str', 'sender', 'message_text',
            'message_type', 'word_count', 'char_count', 'sentiment_label',
            'sentiment_score', 'emotion', 'arousal'
        ]

class ActionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionItemRecord
        fields = [
            'id', 'speaker', 'assignee', 'task_text', 'detected_deadline',
            'deadline_date_str', 'timeline_category', 'urgency', 'category',
            'is_completed', 'created_date'
        ]

class FileAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileAttachmentRecord
        fields = [
            'id', 'file_name', 'file_extension', 'category',
            'sender', 'date_str', 'time_str', 'direct_url'
        ]

class ChatSessionSerializer(serializers.ModelSerializer):
    messages_count = serializers.IntegerField(source='messages.count', read_only=True)
    action_items_count = serializers.IntegerField(source='action_items.count', read_only=True)
    files_count = serializers.IntegerField(source='files.count', read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            'id', 'filename', 'uploaded_at', 'total_messages', 'total_words',
            'total_media', 'total_links', 'total_participants', 'start_date',
            'end_date', 'messages_count', 'action_items_count', 'files_count'
        ]
