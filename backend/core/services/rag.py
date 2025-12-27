import os
import logging
import base64
import docx
import mimetypes
from io import BytesIO

from django.conf import settings
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pgvector.django import CosineDistance
from core.models import Document, DocumentChunk

logger = logging.getLogger(__name__)

from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)

# Initialize Gemini clients
# Embeddings: embedding-001 is standard for Gemini
embeddings_model = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004") 
# Chat: gemini-2.0-flash is the available model
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash")

def extract_text_from_file(file_path, file_type, file_obj=None):
    """
    Extracts text from PDF, DOCX, or TXT files.
    Accepts either a file_path (local) or a file-like object (S3).
    """
    text = ""
    try:
        if file_type == 'pdf':
            source = file_obj if file_obj else file_path
            reader = PdfReader(source)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif file_type == 'docx':
            source = file_obj if file_obj else file_path
            doc = docx.Document(source)
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif file_type == 'txt':
            if file_obj:
                text = file_obj.read().decode('utf-8')
            else:
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
        return text
    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        return ""

def process_image(file_path, file_obj=None):
    """
    Uses Gemini 1.5 Flash Vision to describe the image.
    Accepts either file_path or file_obj (S3).
    """
    try:
        if file_obj:
            image_data = file_obj.read()
        else:
            with open(file_path, "rb") as image_file:
                image_data = image_file.read()

        base64_image = base64.b64encode(image_data).decode('utf-8')

        # Gemini via Langchain handles image_url with data:image syntax properly
        message = HumanMessage(
            content=[
                {"type": "text", "text": "Describe this image in detail for retrieval purposes."},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
            ]
        )
        
        response = llm.invoke([message])
        return response.content
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        return ""

def ingest_document(document_id):
    """
    Main function to process a document: extract, chunk, embed, save.
    """
    try:
        doc = Document.objects.get(id=document_id)
        
        content = ""
        is_image = doc.file_type.startswith('image')
        
        # Determine if we are using S3 or Local
        # If Supabase keys are set, we assume S3 storage via django-storages
        using_s3 = bool(settings.SUPABASE_ACCESS_KEY_ID and settings.SUPABASE_STORAGE_BUCKET_NAME)

        try:
            if using_s3:
                # Open the file from S3 storage
                # Read into memory (BytesIO) to ensure compatibility with pypdf/docx
                with doc.file.open('rb') as f:
                    file_content = f.read()
                    file_buffer = BytesIO(file_content)
                    
                    if is_image:
                        # Reset buffer is not strictly needed for process_image as we pass the buffer
                        # but process_image logic uses file_obj.read(), so we need a fresh stream or BytesIO
                        content = process_image(None, file_obj=file_buffer)
                    else:
                        content = extract_text_from_file(None, doc.file_type, file_obj=file_buffer)
            else:
                # Local file system
                if is_image:
                    content = process_image(doc.file.path)
                else:
                    content = extract_text_from_file(doc.file.path, doc.file_type)
        except Exception as e:
            logger.error(f"Error accessing file for doc {doc.name}: {e}")
            return

        if not content:
            logger.warning(f"No content extracted for doc {doc.name}")
            return

        # Chunking
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(content)

        if not chunks:
             logger.warning(f"No chunks created for doc {doc.name}")
             return

        # Embedding & Saving using pgvector
        try:
            vectors = embeddings_model.embed_documents(chunks)
            
            # Efficient bulk create
            doc_chunks = []
            for i, (chunk_text, vector) in enumerate(zip(chunks, vectors)):
                doc_chunks.append(DocumentChunk(
                    document=doc,
                    chunk_index=i,
                    text=chunk_text,
                    embedding=vector
                ))
            
            DocumentChunk.objects.bulk_create(doc_chunks)
            
            doc.processed = True
            doc.save()
            logger.info(f"Document {doc.name} processed successfully with {len(chunks)} chunks.")
            
        except Exception as e:
             logger.error(f"Error creating embeddings for {doc.name}: {e}")

    except Exception as e:
        logger.error(f"Error ingesting document {document_id}: {e}")


def get_relevant_chunks(query, user, doc_ids=None, top_k=5):
    """
    Retrieves relevant chunks for a user query using PGVector.
    Optional: filter by specific document IDs.
    """
    query_vector = embeddings_model.embed_query(query)
    
    qs = DocumentChunk.objects.filter(document__user=user)
    
    if doc_ids:
        qs = qs.filter(document_id__in=doc_ids)

    # Retrieve top K most similar chunks
    # We use Cosine Distance (1 - Cosine Similarity)
    relevant_chunks = qs.annotate(
        distance=CosineDistance('embedding', query_vector)
    ).order_by('distance')[:top_k]
    
    return relevant_chunks

def generate_rag_response(query, chunks):
    """
    Generates an answer using GPT-4o-mini grounded in the chunks.
    """
    if not chunks:
        return "I could not find any relevant information in your uploaded documents to answer this question."

    context_text = "\n\n".join([f"source: {chunk.document.name}\ncontent: {chunk.text}" for chunk in chunks])
    
    system_prompt = """You are a helpful assistant. Answer the user's question using ONLY the context provided below.
    If the answer is not in the context, say "I don't have enough information to answer that based on the uploaded files."
    Cite your sources by referencing the document name."""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion: {query}"}
    ]
    
    response = llm.invoke(messages)
    return response.content
