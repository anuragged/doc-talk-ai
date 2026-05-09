import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import type { Document, ChatSession } from '../types';
import { FileText, Image as ImageIcon, Trash2, MessageSquarePlus, LogOut, Plus, Search, Clock, File } from 'lucide-react';

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
            let errMsg = 'Upload failed';
            if (err.response && err.response.data) {
                errMsg = JSON.stringify(err.response.data);
            }
            alert(`Upload failed: ${errMsg}`);
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
        <div className="container" style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <header style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-end', 
                marginBottom: '3rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '1.5rem'
            }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        DocTalk AI
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Upload, analyze, and chat with your documents.</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Signed in as</div>
                        <div style={{ fontWeight: 600 }}>{username}</div>
                    </div>
                    <button 
                        onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} 
                        className="btn" 
                        style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '0.6rem 1rem' }}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2.5rem' }}>
                {/* Left: Documents */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                            <File size={24} color="var(--primary-light)" />
                            Knowledge Base
                        </h2>
                        <label className="btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
                            <Plus size={18} />
                            {uploading ? 'Processing...' : 'Add Document'}
                            <input type="file" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
                        </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {documents.length === 0 && (
                            <div className="card" style={{ padding: '3rem', textAlign: 'center', background: 'var(--glass)' }}>
                                <FileText size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.2 }} />
                                <p style={{ color: 'var(--text-muted)' }}>No documents yet. Upload a PDF or Image to get started.</p>
                            </div>
                        )}
                        {documents.map(doc => (
                            <div key={doc.id} className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ 
                                        width: '44px', 
                                        height: '44px', 
                                        borderRadius: '12px', 
                                        background: 'rgba(99, 102, 241, 0.1)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        color: 'var(--primary-light)'
                                    }}>
                                        {doc.file_type.includes('image') ? <ImageIcon size={22} /> : <FileText size={22} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{doc.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }}></span>
                                            <span style={{ color: doc.processed ? 'var(--success)' : 'var(--primary-light)' }}>
                                                {doc.processed ? '✓ Ready' : 'Processing...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        className="btn"
                                        onClick={() => handleChatFromFile(doc)}
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                    >
                                        Chat
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(doc.id)} 
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '0.5rem' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Right: Chats */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                            <Clock size={24} color="var(--primary-light)" />
                            Recent Chats
                        </h2>
                        <button className="btn" onClick={handleNewChat} style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
                            <Plus size={18} />
                            New Thread
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {chats.length === 0 && (
                            <div className="card" style={{ padding: '3rem', textAlign: 'center', background: 'var(--glass)' }}>
                                <MessageSquarePlus size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.2 }} />
                                <p style={{ color: 'var(--text-muted)' }}>Your conversation history will appear here.</p>
                            </div>
                        )}
                        {chats.map(chat => (
                            <Link to={`/chats/${chat.id}`} key={chat.id} style={{ display: 'block', textDecoration: 'none' }}>
                                <div className="card" style={{ 
                                    padding: '1.25rem', 
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                                        {chat.name}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                        {chat.last_message ? chat.last_message.content.substring(0, 80) + '...' : 'Start a conversation...'}
                                    </div>
                                    <div style={{ 
                                        fontSize: '0.75rem', 
                                        color: 'var(--text-muted)', 
                                        marginTop: '1rem',
                                        display: 'flex',
                                        justifyContent: 'flex-end'
                                    }}>
                                        {new Date(chat.updated_at).toLocaleDateString()}
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
