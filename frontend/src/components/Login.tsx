import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, User, Lock, Sparkles } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/auth/token/login/', {
                username,
                password,
            });
            localStorage.setItem('token', response.data.auth_token);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid username or password');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-form" style={{ padding: '3.5rem', animation: 'fadeIn 0.6s ease-out' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ 
                        width: '72px', 
                        height: '72px', 
                        borderRadius: '20px', 
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        margin: '0 auto 2rem auto',
                        boxShadow: '0 10px 25px var(--primary-glow)',
                        animation: 'float 4s infinite ease-in-out'
                    }}>
                        <LogIn size={36} />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} className="text-gradient">
                        Welcome Back
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Enter your details to continue</p>
                </div>

                {error && (
                    <div style={{ 
                        padding: '1rem', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                        borderRadius: '14px', 
                        color: 'var(--error)',
                        fontSize: '0.95rem',
                        marginBottom: '2rem',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}>
                        <Sparkles size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                            <User size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="input-field"
                            style={{ paddingLeft: '3.5rem' }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                            <Lock size={20} />
                        </div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="input-field"
                            style={{ paddingLeft: '3.5rem' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '1rem', marginTop: '1rem', justifyContent: 'center', fontSize: '1.1rem' }}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '1rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
                    <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Join now</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
