import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, User, Mail, Lock } from 'lucide-react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post('http://localhost:8000/auth/users/', {
                username,
                email,
                password,
            });
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                let errorMsg = '';
                if (typeof errorData === 'object') {
                    errorMsg = Object.entries(errorData)
                        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
                        .join('. ');
                } else {
                    errorMsg = JSON.stringify(errorData);
                }
                setError(errorMsg);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="card auth-form" style={{ padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '16px', 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <UserPlus size={32} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Create Account
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Start chatting with your documents</p>
                </div>

                {error && (
                    <div style={{ 
                        padding: '0.75rem 1rem', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                        borderRadius: '12px', 
                        color: 'var(--error)',
                        fontSize: '0.9rem',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{ width: '100%', paddingLeft: '3rem' }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', paddingLeft: '3rem' }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', paddingLeft: '3rem' }}
                        />
                    </div>
                    <button type="submit" className="btn" disabled={loading} style={{ width: '100%', padding: '1rem' }}>
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
                    <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
