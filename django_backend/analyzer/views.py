import re
import datetime
from collections import Counter, defaultdict

from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import ChatSession, ChatMessageRecord, ActionItemRecord, FileAttachmentRecord
from .serializers import (
    ChatSessionSerializer,
    ChatMessageSerializer,
    ActionItemSerializer,
    FileAttachmentSerializer
)

# Regular Expressions for Parsing
HEADER_REGEX = re.compile(
    r'^\[?(\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}|[A-Za-z]{3,9}\.?\s\d{1,2},?\s\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:[APap]\.?[Mm]\.?)?)\]?\s*[-–—]?\s*(.*)$'
)
MEDIA_REGEX = re.compile(r'<Media omitted>|image omitted|video omitted|document omitted', re.IGNORECASE)
DELETED_REGEX = re.compile(r'This message was deleted|You deleted this message', re.IGNORECASE)
URL_REGEX = re.compile(r'https?://\S+|www\.\S+', re.IGNORECASE)
FILE_EXT_REGEX = re.compile(r'\b([a-zA-Z0-9_\-.\s]+\.(pdf|docx?|pptx?|xlsx?|csv|zip|rar|ipynb|py|cpp|java))\b', re.IGNORECASE)

MONTH_INDEX = {
    'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
    'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7,
    'aug': 8, 'august': 8, 'sep': 9, 'sept': 9, 'september': 9, 'oct': 10,
    'october': 10, 'nov': 11, 'november': 11, 'dec': 12, 'december': 12
}

MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

# Emotion Lexicon
JOY_WORDS = {'good', 'great', 'awesome', 'amazing', 'happy', 'mast', 'badhiya', 'accha', 'khush', 'maza', 'party', 'congrats', 'yay', 'jhakas', 'kamaal'}
LOVE_WORDS = {'love', 'thanks', 'thank', 'grateful', 'appreciate', 'shukriya', 'respect', 'pyaar', 'dil se'}
HUMOR_WORDS = {'haha', 'hahaha', 'lol', 'rofl', 'lmao', 'joke', 'funny', 'meme', 'comedy', 'hasna', 'roast'}
STRESS_WORDS = {'stress', 'tension', 'deadline', 'urgent', 'asap', 'panic', 'exam', 'viva', 'submission', 'submit', 'hurry'}
SADNESS_WORDS = {'sad', 'upset', 'disappointed', 'tired', 'udaas', 'dukhi', 'sed', 'lonely', 'miss', 'broken'}
ANGER_WORDS = {'angry', 'hate', 'frustrated', 'annoying', 'worst', 'bakwas', 'faltu', 'gussa', 'dimag kharab', 'ghatiya'}


def classify_emotion(text):
    text_lower = text.lower()
    words = set(re.findall(r'\b\w+\b', text_lower))
    
    joy = len(words & JOY_WORDS)
    love = len(words & LOVE_WORDS)
    humor = len(words & HUMOR_WORDS)
    stress = len(words & STRESS_WORDS)
    sadness = len(words & SADNESS_WORDS)
    anger = len(words & ANGER_WORDS)
    
    pos_score = joy + love + humor
    neg_score = stress + sadness + anger
    total = pos_score + neg_score
    
    if total == 0:
        return 'neutral', 'neutral', 0.0, 'low'
    
    net_score = round((pos_score - neg_score) / total, 2)
    sentiment_label = 'positive' if net_score > 0.15 else ('negative' if net_score < -0.15 else 'neutral')
    
    scores = {
        'joy': joy, 'love_gratitude': love, 'humor': humor,
        'stress_urgency': stress, 'sadness': sadness, 'anger_frustration': anger
    }
    top_emotion = max(scores, key=scores.get)
    if scores[top_emotion] == 0:
        top_emotion = 'neutral'
        
    arousal = 'high' if (total >= 3 or '!' in text or text.isupper()) else ('moderate' if total >= 1 else 'low')
    return top_emotion, sentiment_label, net_score, arousal


def resolve_task_timeline(text, now=None):
    """Dynamically categorizes task deadline into past, pending, or upcoming using current date."""
    if now is None:
        now = datetime.date.today()
        
    lower = text.lower()
    
    # 1. Day + Month (e.g., "by 25 September", "10 October", "20 December")
    match = re.search(r'\b(?:by|before|on|due|till|until)?\s*(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s*,?\s*(\d{4}|\d{2}))?\b', lower)
    if match:
        day = int(match.group(1))
        m_str = match.group(2)
        month = MONTH_INDEX.get(m_str)
        year = now.year
        if match.group(3):
            y_val = int(match.group(3))
            year = 2000 + y_val if y_val < 100 else y_val
            
        if month and 1 <= day <= 31:
            try:
                target_date = datetime.date(year, month, day)
                date_str = f"{day} {MONTH_NAMES[month]} {year}"
                if target_date < now:
                    return 'past', match.group(0).strip(), date_str, 'Low'
                elif target_date == now:
                    return 'pending', match.group(0).strip(), date_str, 'High'
                else:
                    return 'upcoming', match.group(0).strip(), date_str, 'Medium'
            except ValueError:
                pass
                
    # 2. "today" / "tonight"
    if re.search(r'\b(today|tonight|aaj|aaj raat)\b', lower):
        return 'pending', 'Today', now.strftime('%d %b %Y'), 'High'
        
    # 3. "tomorrow" / "kal"
    if re.search(r'\b(tomorrow|kal|kal subah)\b', lower):
        tmrw = now + datetime.timedelta(days=1)
        return 'upcoming', 'Tomorrow', tmrw.strftime('%d %b %Y'), 'Medium'
        
    return 'pending', None, None, 'Medium'


class UploadAndParseChatView(APIView):
    """
    POST: Uploads raw WhatsApp .txt chat, parses lines, extracts NLP features,
          and returns complete structured analysis JSON.
    """
    def post(self, request):
        chat_file = request.FILES.get('file')
        raw_text = request.data.get('text')
        
        if chat_file:
            try:
                content = chat_file.read().decode('utf-8')
                filename = chat_file.name
            except UnicodeDecodeError:
                return Response({'error': 'File must be UTF-8 encoded text.'}, status=status.HTTP_400_BAD_REQUEST)
        elif raw_text:
            content = raw_text
            filename = 'pasted_chat.txt'
        else:
            return Response({'error': 'No chat file or text provided.'}, status=status.HTTP_400_BAD_REQUEST)
            
        lines = content.splitlines()
        parsed_events = []
        
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            match = HEADER_REGEX.match(line_str)
            if match:
                date_str, time_str, rest = match.groups()
                parsed_events.append({'date': date_str, 'time': time_str, 'text': rest})
            elif parsed_events:
                parsed_events[-1]['text'] += f"\n{line_str}"
                
        if not parsed_events:
            return Response({'error': 'No valid WhatsApp chat messages found in format.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Create ChatSession
        session = ChatSession.objects.create(filename=filename)
        
        total_words = 0
        total_media = 0
        total_links = 0
        participants = set()
        messages_to_create = []
        action_items_to_create = []
        files_to_create = []
        
        for ev in parsed_events:
            text = ev['text'].strip()
            sender = 'group_notification'
            msg_type = 'system'
            
            if ': ' in text:
                parts = text.split(': ', 1)
                sender = parts[0].strip()
                text = parts[1].strip()
                msg_type = 'text'
                participants.add(sender)
                
            if MEDIA_REGEX.search(text):
                msg_type = 'media'
                total_media += 1
            elif DELETED_REGEX.search(text):
                msg_type = 'deleted'
                
            words = text.split()
            word_count = len(words)
            total_words += word_count
            
            links = URL_REGEX.findall(text)
            total_links += len(links)
            
            # Emotion & Sentiment
            top_emotion, sentiment_label, score, arousal = classify_emotion(text)
            
            msg_record = ChatMessageRecord(
                session=session,
                date_str=ev['date'],
                time_str=ev['time'],
                sender=sender,
                message_text=text,
                message_type=msg_type,
                word_count=word_count,
                char_count=len(text),
                sentiment_label=sentiment_label,
                sentiment_score=score,
                emotion=top_emotion,
                arousal=arousal
            )
            messages_to_create.append(msg_record)
            
            # Check for Action Item commitment
            if re.search(r'\b(i will|i\'ll|please|kindly|reminder|deadline|submit|bhej dena|kar dunga|karna hai)\b', text, re.IGNORECASE):
                timeline, deadline_phrase, deadline_date, urg = resolve_task_timeline(text)
                action_items_to_create.append(
                    ActionItemRecord(
                        session=session,
                        speaker=sender,
                        assignee=sender if 'i will' in text.lower() else 'Team',
                        task_text=text,
                        detected_deadline=deadline_phrase,
                        deadline_date_str=deadline_date,
                        timeline_category=timeline,
                        urgency=urg,
                        created_date=ev['date']
                    )
                )
                
            # Check for Shared Files & Links
            for f_match in FILE_EXT_REGEX.findall(text):
                fname, ext = f_match[0], f_match[1].lower()
                files_to_create.append(
                    FileAttachmentRecord(
                        session=session,
                        file_name=fname,
                        file_extension=ext,
                        category='code' if ext in ['py', 'cpp', 'java', 'ipynb'] else 'document',
                        sender=sender,
                        date_str=ev['date'],
                        time_str=ev['time']
                    )
                )
            for link in links:
                if 'drive.google.com' in link or 'dropbox.com' in link:
                    files_to_create.append(
                        FileAttachmentRecord(
                            session=session,
                            file_name=link[:45] + '...',
                            file_extension='link',
                            category='cloud_drive',
                            sender=sender,
                            date_str=ev['date'],
                            time_str=ev['time'],
                            direct_url=link
                        )
                    )

        # Bulk Create
        ChatMessageRecord.objects.bulk_create(messages_to_create)
        ActionItemRecord.objects.bulk_create(action_items_to_create)
        FileAttachmentRecord.objects.bulk_create(files_to_create)
        
        session.total_messages = len(messages_to_create)
        session.total_words = total_words
        session.total_media = total_media
        session.total_links = total_links
        session.total_participants = len(participants)
        session.start_date = parsed_events[0]['date']
        session.end_date = parsed_events[-1]['date']
        session.save()
        
        return Response({
            'session': ChatSessionSerializer(session).data,
            'stats': {
                'total_messages': session.total_messages,
                'total_words': session.total_words,
                'total_media': session.total_media,
                'total_links': session.total_links,
                'participants': list(participants),
                'action_items_count': len(action_items_to_create),
                'files_count': len(files_to_create)
            }
        })


class ActionItemsView(APIView):
    """GET: Returns action items for a session, filtered by timeline_category."""
    def get(self, request, session_id):
        category_filter = request.query_params.get('category')
        items = ActionItemRecord.objects.filter(session_id=session_id)
        
        if category_filter in ['past', 'pending', 'upcoming']:
            items = items.filter(timeline_category=category_filter)
            
        serializer = ActionItemSerializer(items, many=True)
        return Response(serializer.data)

    def patch(self, request, session_id):
        """Toggle completion status of an action item."""
        item_id = request.data.get('id')
        try:
            item = ActionItemRecord.objects.get(id=item_id, session_id=session_id)
            item.is_completed = not item.is_completed
            item.save()
            return Response({'id': item.id, 'is_completed': item.is_completed})
        except ActionItemRecord.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)


class FilesCatalogView(APIView):
    """GET: Returns all extracted documents and shared links."""
    def get(self, request, session_id):
        q = request.query_params.get('q', '').strip().lower()
        files = FileAttachmentRecord.objects.filter(session_id=session_id)
        if q:
            files = files.filter(file_name__icontains=q)
        return Response(FileAttachmentSerializer(files, many=True).data)


class HealthCheckView(APIView):
    """GET: Ping endpoint."""
    def get(self, request):
        return Response({'status': 'online', 'service': 'Django WhatsApp Chat Analyzer Backend', 'version': '1.0'})
