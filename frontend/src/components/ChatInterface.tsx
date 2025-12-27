import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import type { ChatSession, ChatMessage } from '../types';
import { Send, ArrowLeft, FileText } from 'lucide-react';

const ChatInterface = () => {
    const { id } = useParams<{ id: string }>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [sessionName, setSessionName] = useState('Chat');
    const [activeDoc, setActiveDoc] = useState<{ id: number, name: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check for passed state (from "Chat from File")
        if (location.state && location.state.activeDocId) {
            setActiveDoc({
                id: location.state.activeDocId,
                name: location.state.activeDocName || 'Document'
            });
        }
    }, [location.state]);

    useEffect(() => {
        fetchSession();
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchSession = async () => {
        try {
            const res = await api.get(`chats/${id}/`);
            setSessionName(res.data.name);
            if (res.data.messages) {
                setMessages(res.data.messages);
            }
        } catch (err) {
            console.error(err);
            navigate('/dashboard');
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const userMsg: ChatMessage = {
            id: Date.now(), // Optimistic ID
            role: 'user',
            content: input,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSending(true);

        try {
            const payload: any = { message: userMsg.content };
            if (activeDoc) {
                payload.doc_ids = [activeDoc.id];
            }

            const res = await api.post(`chats/${id}/send_message/`, payload);
            // Replace optimistic message with real one and add AI response
            setMessages(prev => [
                ...prev.filter(m => m.id !== userMsg.id),
                res.data.user_message,
                res.data.ai_message
            ]);
        } catch (err: any) {
            console.error(err);
            let errMsg = 'Failed to send message';
            if (err.response && err.response.data) {
                errMsg = JSON.stringify(err.response.data);
            }
            alert(errMsg);
            // Remove optimistic message on error or show error
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-light)', marginRight: '1rem' }}>
                    <ArrowLeft />
                </button>
                <div>
                    <h2 style={{ margin: 0 }}>{sessionName}</h2>
                    {activeDoc && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                            Talking to: <span style={{ fontWeight: 600 }}>{activeDoc.name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                        }}
                    >
                        <div style={{
                            backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                            padding: '1rem',
                            borderRadius: '1rem',
                            borderBottomRightRadius: msg.role === 'user' ? 0 : '1rem',
                            borderBottomLeftRadius: msg.role === 'ai' ? 0 : '1rem'
                        }}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                        </div>

                        {/* Citations */}
                        {msg.role === 'ai' && msg.cited_chunks && msg.cited_chunks.length > 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                <div style={{ color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Sources:</div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {msg.cited_chunks.map((chunk: any) => (
                                        <div key={chunk.id} style={{
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}>
                                            <FileText size={12} />
                                            <span>{chunk.document_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {sending && <div style={{ alignSelf: 'flex-start', color: 'var(--text-dim)' }}>AI is thinking...</div>}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '1rem 0 2rem 0' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask about your documents..."
                        style={{ flex: 1 }}
                        disabled={sending}
                    />
                    <button type="submit" className="btn" disabled={sending || !input.trim()}>
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
