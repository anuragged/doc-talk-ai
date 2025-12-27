import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/auth/users/', {
                username,
                email,
                password,
            });
            // After register, login or redirect to login
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                let errorMsg = '';
                if (typeof errorData === 'object') {
                    errorMsg = Object.entries(errorData)
                        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
                        .join('\n');
                } else {
                    errorMsg = JSON.stringify(errorData);
                }
                setError(errorMsg);
            } else {
                setError('Registration failed. Try again.');
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="card auth-form">
                <h2 style={{ textAlign: 'center' }}>Register</h2>
                {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn">Register</button>
                </form>
                <p style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
