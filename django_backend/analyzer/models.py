from django.db import models

class ChatSession(models.Model):
    """Represents an uploaded and analyzed WhatsApp chat session."""
    filename = models.CharField(max_length=255, default='chat.txt')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    total_messages = models.IntegerField(default=0)
    total_words = models.IntegerField(default=0)
    total_media = models.IntegerField(default=0)
    total_links = models.IntegerField(default=0)
    total_participants = models.IntegerField(default=0)
    start_date = models.CharField(max_length=64, blank=True, null=True)
    end_date = models.CharField(max_length=64, blank=True, null=True)

    def __str__(self):
        return f"{self.filename} ({self.total_messages} msgs) - {self.uploaded_at.strftime('%Y-%m-%d %H:%M')}"


class ChatMessageRecord(models.Model):
    """Represents an individual parsed message."""
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    date_str = models.CharField(max_length=32)
    time_str = models.CharField(max_length=32)
    sender = models.CharField(max_length=128)
    message_text = models.TextField()
    message_type = models.CharField(max_length=32, default='text')  # text, media, deleted, system
    word_count = models.IntegerField(default=0)
    char_count = models.IntegerField(default=0)
    sentiment_label = models.CharField(max_length=32, default='neutral')  # positive, neutral, negative
    sentiment_score = models.FloatField(default=0.0)
    emotion = models.CharField(max_length=64, default='neutral')
    arousal = models.CharField(max_length=32, default='low')  # low, moderate, high

    def __str__(self):
        return f"[{self.date_str} {self.time_str}] {self.sender}: {self.message_text[:40]}"


class ActionItemRecord(models.Model):
    """Represents an extracted task commitment with dynamic date classification."""
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='action_items')
    speaker = models.CharField(max_length=128)
    assignee = models.CharField(max_length=128)
    task_text = models.TextField()
    detected_deadline = models.CharField(max_length=128, blank=True, null=True)
    deadline_date_str = models.CharField(max_length=64, blank=True, null=True)
    timeline_category = models.CharField(max_length=32, default='pending')  # past, pending, upcoming
    urgency = models.CharField(max_length=32, default='Medium')             # High, Medium, Low
    category = models.CharField(max_length=64, default='Task')              # Deliverable, Meeting, Review, Resource, Task
    is_completed = models.BooleanField(default=False)
    created_date = models.CharField(max_length=32, blank=True, null=True)

    def __str__(self):
        return f"[{self.timeline_category.upper()}] {self.speaker} -> {self.task_text[:50]}"


class FileAttachmentRecord(models.Model):
    """Represents an extracted document, file, or cloud link."""
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='files')
    file_name = models.CharField(max_length=255)
    file_extension = models.CharField(max_length=32)
    category = models.CharField(max_length=64, default='document')
    sender = models.CharField(max_length=128)
    date_str = models.CharField(max_length=32)
    time_str = models.CharField(max_length=32)
    direct_url = models.URLField(max_length=512, blank=True, null=True)

    def __str__(self):
        return f"{self.file_name} ({self.category}) shared by {self.sender}"
