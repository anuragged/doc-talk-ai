from rest_framework import serializers
from .models import Document, DocumentChunk, ChatSession, ChatMessage

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'name', 'file_type', 'size', 'uploaded_at', 'processed', 'file']
        read_only_fields = ['file_type', 'size', 'uploaded_at', 'processed']

class DocumentChunkSerializer(serializers.ModelSerializer):
    document_name = serializers.CharField(source='document.name', read_only=True)
    
    class Meta:
        model = DocumentChunk
        fields = ['id', 'document_name', 'text', 'chunk_index']

class ChatMessageSerializer(serializers.ModelSerializer):
    cited_chunks = DocumentChunkSerializer(many=True, read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'created_at', 'cited_chunks']

class ChatSessionSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'name', 'created_at', 'updated_at', 'last_message']

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return ChatMessageSerializer(last_msg).data
        return None

class ChatSessionDetailSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatSession
        fields = ['id', 'name', 'created_at', 'updated_at', 'messages']
