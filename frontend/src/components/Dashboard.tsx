import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import type { Document, ChatSession } from '../types';
import { FileText, Image as ImageIcon, Trash2, MessageSquarePlus } from 'lucide-react';

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

    // Feature: Chat from File
    const handleChatFromFile = async (doc: Document) => {
        try {
            const res = await api.post('chats/', { name: `Chat: ${doc.name}` });
            // Navigate with state to pre-select this document
            navigate(`/chats/${res.data.id}`, { state: { activeDocId: doc.id, activeDocName: doc.name } });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>RAG Chatbot</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontWeight: 600 }}>Hello, {username}</span>
                    <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'white' }}>
                        Logout
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Left: Documents */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Documents</h2>
                        <label className="btn" style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
                            {uploading ? 'Uploading...' : 'Upload File'}
                            <input type="file" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
                        </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {documents.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No documents uploaded.</p>}
                        {documents.map(doc => (
                            <div key={doc.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {doc.file_type.includes('image') ? <ImageIcon size={20} /> : <FileText size={20} />}
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{doc.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                            {(doc.size / 1024).toFixed(1)} KB • {doc.processed ? 'Indexed' : 'Processing...'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn"
                                        onClick={() => handleChatFromFile(doc)}
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '500px' }}
                                    >
                                        Chat
                                    </button>
                                    <button onClick={() => handleDelete(doc.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', opacity: 0.7 }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Right: Chats */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>History</h2>
                        <button className="btn" onClick={handleNewChat}>
                            <MessageSquarePlus size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            New Chat
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {chats.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No chat history.</p>}
                        {chats.map(chat => (
                            <Link to={`/chats/${chat.id}`} key={chat.id} style={{ display: 'block', textDecoration: 'none' }}>
                                <div className="card" style={{ padding: '1rem', cursor: 'pointer', transition: 'background 0.2s' }}>
                                    <div style={{ fontWeight: 500, color: 'var(--text-light)' }}>{chat.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                        {chat.last_message ? chat.last_message.content.substring(0, 50) + '...' : 'No messages'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'right', marginTop: '0.5rem' }}>
                                        {new Date(chat.updated_at).toLocaleString()}
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
