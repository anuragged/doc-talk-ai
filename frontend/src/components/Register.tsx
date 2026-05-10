import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, User, Mail, Lock, Sparkles } from 'lucide-react';

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
            <div className="glass-panel auth-form" style={{ padding: '3.5rem', animation: 'fadeIn 0.6s ease-out' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ 
                        width: '72px', 
                        height: '72px', 
                        borderRadius: '20px', 
                        background: 'linear-gradient(135deg, var(--secondary), var(--primary))', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        margin: '0 auto 2rem auto',
                        boxShadow: '0 10px 25px var(--primary-glow)',
                        animation: 'float 4s infinite ease-in-out'
                    }}>
                        <UserPlus size={36} />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} className="text-gradient">
                        Get Started
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Create your DocTalk AI account</p>
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
                            <Mail size={20} />
                        </div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            placeholder="Create Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="input-field"
                            style={{ paddingLeft: '3.5rem' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '1rem', marginTop: '1rem', justifyContent: 'center', fontSize: '1.1rem' }}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '1rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
                    <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
