import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff } from 'lucide-react';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) {
            setError('Passwords do not match'); return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters'); return;
        }
        setLoading(true);
        try {
            await register(form.name, form.email, form.password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    return (
        <div className="auth-page">
            <div className="auth-bg" />
            <div className="auth-container animate-fade">
                <div className="auth-logo">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#4f8ef7,#9b59f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={22} color="white" />
                        </div>
                    </div>
                    <div className="auth-logo-title">AutoApply</div>
                    <div className="auth-logo-sub">Create your universal job profile</div>
                </div>

                <div className="auth-card">
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">One profile. Apply everywhere.</p>

                    {error && (
                        <div className="toast toast-error" style={{ position: 'static', marginBottom: 16, animation: 'none' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input id="reg-name" type="text" className="form-input" placeholder="John Doe"
                                value={form.name} onChange={e => set('name', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input id="reg-email" type="email" className="form-input" placeholder="you@example.com"
                                value={form.email} onChange={e => set('email', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input id="reg-password" type={showPw ? 'text' : 'password'} className="form-input"
                                    placeholder="Min. 6 characters" value={form.password}
                                    onChange={e => set('password', e.target.value)} required style={{ paddingRight: 44 }} />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input id="reg-confirm" type="password" className="form-input" placeholder="Repeat password"
                                value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
                        </div>
                        <button id="reg-submit" type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 4 }}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-footer" style={{ marginTop: 20 }}>
                        Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
