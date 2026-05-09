import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import type { ChatSession, ChatMessage } from '../types';
import { Send, ArrowLeft, FileText, User, Bot, Paperclip } from 'lucide-react';

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
            id: Date.now(),
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
            setMessages(prev => [
                ...prev.filter(m => m.id !== userMsg.id),
                res.data.user_message,
                res.data.ai_message
            ]);
        } catch (err: any) {
            console.error(err);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
            {/* Header */}
            <header style={{ 
                padding: '1rem 2rem', 
                borderBottom: '1px solid var(--border)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.5rem',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)',
                zIndex: 10
            }}>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.5rem', borderRadius: '10px' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{sessionName}</h2>
                    {activeDoc && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <FileText size={12} />
                            Context: <span style={{ fontWeight: 600 }}>{activeDoc.name}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Messages Area */}
            <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '2rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '2rem',
                maxWidth: '1000px',
                width: '100%',
                margin: '0 auto'
            }}>
                {messages.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                        <Bot size={48} style={{ marginBottom: '1rem' }} />
                        <p>Ask anything about your uploaded documents.</p>
                    </div>
                )}
                
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                            alignItems: 'flex-start',
                        }}
                    >
                        <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '10px', 
                            background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-sidebar)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }}>
                            {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>
                        
                        <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{
                                backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                                padding: '1rem 1.25rem',
                                borderRadius: '18px',
                                borderTopRightRadius: msg.role === 'user' ? '4px' : '18px',
                                borderTopLeftRadius: msg.role === 'ai' ? '4px' : '18px',
                                boxShadow: 'var(--shadow-lg)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-main)',
                                lineHeight: '1.6'
                            }}>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                            </div>

                            {/* Citations */}
                            {msg.role === 'ai' && msg.cited_chunks && msg.cited_chunks.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                    {Array.from(new Set(msg.cited_chunks.map((c: any) => c.document_name))).map((docName: any, idx) => (
                                        <div key={idx} style={{
                                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            color: 'var(--primary-light)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            border: '1px solid rgba(99, 102, 241, 0.2)'
                                        }}>
                                            <Paperclip size={12} />
                                            <span>{docName}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {sending && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '10px', 
                            background: 'var(--bg-sidebar)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Bot size={20} />
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <div className="typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-light)', animation: 'bounce 1s infinite' }}></div>
                            <div className="typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-light)', animation: 'bounce 1s infinite 0.2s' }}></div>
                            <div className="typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-light)', animation: 'bounce 1s infinite 0.4s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ 
                padding: '1.5rem 2rem 2.5rem 2rem', 
                background: 'linear-gradient(to top, var(--bg-dark), transparent)',
                maxWidth: '1000px',
                width: '100%',
                margin: '0 auto'
            }}>
                <form 
                    onSubmit={handleSend} 
                    style={{ 
                        display: 'flex', 
                        gap: '0.75rem', 
                        background: 'var(--bg-card)', 
                        padding: '0.6rem', 
                        borderRadius: '16px',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                    }}
                >
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={activeDoc ? `Ask about ${activeDoc.name}...` : "Ask a question..."}
                        style={{ 
                            flex: 1, 
                            background: 'transparent', 
                            border: 'none', 
                            boxShadow: 'none',
                            padding: '0.8rem 1rem'
                        }}
                        disabled={sending}
                    />
                    <button 
                        type="submit" 
                        className="btn" 
                        disabled={sending || !input.trim()}
                        style={{ borderRadius: '12px', padding: '0.8rem' }}
                    >
                        <Send size={20} />
                    </button>
                </form>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
                    AI can make mistakes. Verify important information.
                </div>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
            `}</style>
        </div>
    );
};

export default ChatInterface;
