export interface User {
    id: number;
    username: string;
    email: string;
}

export interface Document {
    id: number;
    name: string;
    file_type: string;
    size: number;
    uploaded_at: string;
    processed: boolean;
    file: string;
}

export interface DocumentChunk {
    id: number;
    document_name: string;
    text: string;
    chunk_index: number;
}

export interface ChatMessage {
    id: number;
    role: 'user' | 'ai';
    content: string;
    created_at: string;
    cited_chunks?: DocumentChunk[];
}

export interface ChatSession {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    last_message?: ChatMessage;
    messages?: ChatMessage[];
}
