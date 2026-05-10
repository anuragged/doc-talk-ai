import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import type { ChatSession, ChatMessage } from '../types';
import { Send, ArrowLeft, FileText, User, Bot, Paperclip, Sparkles, ChevronDown } from 'lucide-react';

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
        <div style={{ 
            height: 'calc(100vh - 4rem)', 
            display: 'flex', 
            flexDirection: 'column',
            animation: 'fadeIn 0.4s ease-out'
        }}>
            {/* Header Area */}
            <header style={{ 
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{sessionName}</h2>
                    {activeDoc && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>
                            <FileText size={16} />
                            <span>Context: {activeDoc.name}</span>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <Sparkles size={14} color="var(--primary)" />
                        <span>Gemini 2.0 Flash</span>
                    </div>
                </div>
            </header>

            {/* Chat Content */}
            <div className="glass-panel" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid var(--glass-border)'
            }}>
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '2rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2.5rem'
                }}>
                    {messages.length === 0 && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                            <div style={{ 
                                width: '64px', 
                                height: '64px', 
                                borderRadius: '20px', 
                                background: 'var(--glass)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <Bot size={32} />
                            </div>
                            <p style={{ fontSize: '1.1rem' }}>How can I help you with your documents today?</p>
                        </div>
                    )}
                    
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            style={{
                                display: 'flex',
                                gap: '1.5rem',
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                alignItems: 'flex-start',
                                animation: 'fadeIn 0.3s ease-out'
                            }}
                        >
                            <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '12px', 
                                background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--glass)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                color: 'white',
                                boxShadow: msg.role === 'user' ? '0 4px 12px var(--primary-glow)' : 'none',
                                border: msg.role === 'ai' ? '1px solid var(--glass-border)' : 'none'
                            }}>
                                {msg.role === 'user' ? <User size={22} /> : <Bot size={22} />}
                            </div>
                            
                            <div style={{ 
                                maxWidth: '75%', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '0.75rem',
                                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'transparent',
                                    padding: msg.role === 'user' ? '1rem 1.5rem' : '0',
                                    borderRadius: '20px',
                                    borderTopRightRadius: msg.role === 'user' ? '4px' : '20px',
                                    borderTopLeftRadius: msg.role === 'ai' ? '4px' : '20px',
                                    color: 'var(--text-main)',
                                    lineHeight: '1.6',
                                    fontSize: '1rem',
                                    whiteSpace: 'pre-wrap',
                                    boxShadow: msg.role === 'user' ? '0 10px 15px -3px rgba(0,0,0,0.2)' : 'none'
                                }}>
                                    {msg.content}
                                </div>

                                {/* Citations */}
                                {msg.role === 'ai' && msg.cited_chunks && msg.cited_chunks.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                        {Array.from(new Set(msg.cited_chunks.map((c: any) => c.document_name))).map((docName: any, idx) => (
                                            <div key={idx} style={{
                                                backgroundColor: 'var(--glass)',
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '10px',
                                                fontSize: '0.75rem',
                                                color: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                border: '1px solid var(--glass-border)',
                                                fontWeight: 600
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
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '12px', 
                                background: 'var(--glass)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <Bot size={22} />
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <div className="typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'float 1.5s infinite ease-in-out' }}></div>
                                <div className="typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'float 1.5s infinite ease-in-out 0.2s' }}></div>
                                <div className="typing-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'float 1.5s infinite ease-in-out 0.4s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ 
                    padding: '1.5rem 2rem', 
                    background: 'rgba(2, 6, 23, 0.5)',
                    borderTop: '1px solid var(--glass-border)'
                }}>
                    <form 
                        onSubmit={handleSend} 
                        style={{ 
                            display: 'flex', 
                            gap: '1rem', 
                            background: 'var(--glass)', 
                            padding: '0.5rem', 
                            borderRadius: '18px',
                            border: '1px solid var(--glass-border)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease'
                        }}
                        onFocusCapture={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onBlurCapture={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
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
                                outline: 'none',
                                color: 'white',
                                padding: '0.75rem 1rem',
                                fontSize: '1rem'
                            }}
                            disabled={sending}
                        />
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={sending || !input.trim()}
                            style={{ 
                                borderRadius: '14px', 
                                padding: '0.75rem',
                                width: '48px',
                                height: '48px',
                                justifyContent: 'center'
                            }}
                        >
                            <Send size={20} />
                        </button>
                    </form>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
                        Powered by <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Gemini AI</span> • Citations included automatically
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
