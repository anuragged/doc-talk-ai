# File-Chat RAG Chatbot - End to End Walkthrough

This application allows you to upload documents (PDF, DOCX, TXT, Images), and a smart AI assistant will answer your questions based on those files.
Demo Video: https://drive.google.com/file/d/1KCmzyED0oZO2loNsBzJbEKfECLDE6J4R/view?usp=sharing

## Project Structure
- **Frontend**: React + TypeScript + Vite (Port 5173)
- **Backend**: Django + Django REST Framework (Port 8000)
- **Database**: Postgres + pgvector (Port 5435) via Docker

## Prerequisites
- Docker Desktop
- Node.js & npm
- Python 3.11+
- OpenAI API Key

## Setup Instructions

1. **Environment Setup**
    - Copy `.env.example` to `backend/.env` (Created automatically)
    - Add your `OPENAI_API_KEY` to `backend/.env`

2. **Start Database**
    ```bash
    docker-compose up -d
    ```

3. **Backend Setup**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r backend/requirements.txt
    python backend/manage.py migrate
    python backend/manage.py createsuperuser --username admin --email admin@example.com
    python backend/manage.py runserver
    ```

4. **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

5. **Usage**
    - Go to `http://localhost:5173`
    - Login/Register
    - Dashboard: Upload your files. The system will process them (OCR for images, text extraction for docs).
    - Create a "New Chat".
    - Ask questions like "Summarize the uploaded agreement" or "Describe the image I uploaded".
    - The AI will cite the source document.

## Architecture Highlights
- **Auth**: Token-based auth ensuring users only see their own files.
- **RAG Pipeline**:
    - **Ingestion**: Text extraction (pypdf, python-docx) + Image Understanding (GPT-4o-mini Vision).
    - **Indexing**: OpenAI Embeddings -> PGVector store.
    - **Retrieval**: Cosine similarity search on chunks.
    - **Generation**: GPT-4o-mini generates answers with citations.
