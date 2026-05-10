import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import type { Document, ChatSession } from '../types';
import { 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  MessageSquarePlus, 
  Plus, 
  Search, 
  Clock, 
  File,
  ChevronRight,
  UploadCloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [username, setUsername] = useState('User');
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserInfo();
        fetchDocuments();
        fetchChats();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const res = await api.get('auth/users/me/');
            setUsername(res.data.username);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDocuments = async () => {
        try {
            const res = await api.get('documents/');
            setDocuments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchChats = async () => {
        try {
            const res = await api.get('chats/');
            setChats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);

        setUploading(true);
        try {
            await api.post('documents/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            fetchDocuments();
        } catch (err: any) {
            console.error('Upload failed', err);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure? This will delete the document and its index.')) return;
        try {
            await api.delete(`documents/${id}/`);
            fetchDocuments();
        } catch (err) {
            console.error(err);
        }
    };

    const handleNewChat = async () => {
        try {
            const res = await api.post('chats/', { name: 'New Chat' });
            navigate(`/chats/${res.data.id}`);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChatFromFile = async (doc: Document) => {
        try {
            const res = await api.post('chats/', { name: `Chat: ${doc.name}` });
            navigate(`/chats/${res.data.id}`, { state: { activeDocId: doc.id, activeDocName: doc.name } });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    Welcome back, <span className="text-gradient">{username}</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    What would you like to analyze today?
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
                {/* Documents Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileText size={24} color="var(--primary)" />
                            Knowledge Base
                        </h2>
                        <label className="btn-primary" style={{ cursor: 'pointer' }}>
                            <UploadCloud size={20} />
                            {uploading ? 'Processing...' : 'Upload Document'}
                            <input type="file" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
                        </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {documents.length === 0 && !uploading && (
                            <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                <div style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    background: 'var(--glass)', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem auto'
                                }}>
                                    <File size={32} color="var(--text-muted)" />
                                </div>
                                <h3 style={{ marginBottom: '0.5rem' }}>No documents yet</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Upload a PDF, DOCX or Image to start chatting.</p>
                            </div>
                        )}

                        {documents.map(doc => (
                            <div key={doc.id} className="glass-panel" style={{ 
                                padding: '1.25rem 1.5rem', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                transition: 'transform 0.2s ease',
                                cursor: 'default'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                    <div style={{ 
                                        width: '50px', 
                                        height: '50px', 
                                        borderRadius: '16px', 
                                        background: 'var(--glass)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        color: 'var(--primary)'
                                    }}>
                                        {doc.file_type.includes('image') ? <ImageIcon size={24} /> : <FileText size={24} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{doc.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }}></span>
                                            <span style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '0.3rem',
                                                color: doc.processed ? 'var(--success)' : 'var(--primary)'
                                            }}>
                                                {doc.processed ? <CheckCircle2 size={14} /> : <div className="shimmer" style={{width: 14, height: 14, borderRadius: '50%', background: 'var(--primary)'}} />}
                                                {doc.processed ? 'Ready' : 'Processing...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        className="btn-primary"
                                        onClick={() => handleChatFromFile(doc)}
                                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                                    >
                                        Chat
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(doc.id)} 
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '0.5rem', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recent Chats Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Clock size={24} color="var(--secondary)" />
                            Recent
                        </h2>
                        <button onClick={handleNewChat} className="btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
                            <Plus size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {chats.length === 0 && (
                            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', background: 'transparent' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent chats found.</p>
                            </div>
                        )}
                        {chats.slice(0, 5).map(chat => (
                            <Link to={`/chats/${chat.id}`} key={chat.id} style={{ display: 'block' }}>
                                <div className="glass-panel" style={{ 
                                    padding: '1.25rem', 
                                    transition: 'all 0.2s ease',
                                    border: '1px solid transparent',
                                    background: 'rgba(255, 255, 255, 0.02)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                                    e.currentTarget.style.background = 'var(--glass)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                }}
                                >
                                    <div style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                        {chat.name}
                                        <ChevronRight size={16} color="var(--text-muted)" />
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {chat.last_message ? chat.last_message.content : 'New conversation...'}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
