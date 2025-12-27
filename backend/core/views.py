from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Document, ChatSession, ChatMessage
from .serializers import DocumentSerializer, ChatSessionSerializer, ChatSessionDetailSerializer, ChatMessageSerializer
from core.services import rag

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user).order_by('-uploaded_at')

    def perform_create(self, serializer):
        # Initial save to get the file object
        doc = serializer.save(user=self.request.user, size=0) # Temp size
        
        # Determine file type
        filename = doc.file.name.lower()
        if filename.endswith('.pdf'):
            doc.file_type = 'pdf'
        elif filename.endswith('.docx'):
            doc.file_type = 'docx'
        elif filename.endswith('.txt'):
            doc.file_type = 'txt'
        elif filename.endswith(('.png', '.jpg', '.jpeg')):
            doc.file_type = 'image'
        else:
            doc.file_type = 'unknown'
        
        # Calculate size
        try:
            doc.size = doc.file.size
        except:
            doc.size = 0
            
        doc.save()

        # Trigger RAG ingestion (Sync for now)
        # In production, use Celery/Dramatiq
        rag.ingest_document(doc.id)

class ChatSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user).order_by('-updated_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ChatSessionDetailSerializer
        return ChatSessionSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        session = self.get_object()
        user_message_content = request.data.get('message')
        doc_ids = request.data.get('doc_ids') # Optional list of IDs
        
        if not user_message_content:
            return Response({"error": "Message content is required"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Save User Message
        user_msg = ChatMessage.objects.create(
            session=session,
            role='user',
            content=user_message_content
        )

        # 2. Retrieve Context
        relevant_chunks = rag.get_relevant_chunks(user_message_content, request.user, doc_ids=doc_ids)

        # 3. Generate Answer
        answer = rag.generate_rag_response(user_message_content, relevant_chunks)

        # 4. Save AI Message
        ai_msg = ChatMessage.objects.create(
            session=session,
            role='ai',
            content=answer
        )
        ai_msg.cited_chunks.set(relevant_chunks)
        
        return Response({
            "user_message": ChatMessageSerializer(user_msg).data,
            "ai_message": ChatMessageSerializer(ai_msg).data
        })
