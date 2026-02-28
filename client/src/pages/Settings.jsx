import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Shield, Bell, User, Eye, EyeOff, X } from 'lucide-react';

function Toast({ msg, type, onClose }) {
    return <div className={`toast toast-${type}`}>{msg}<button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 8 }}><X size={14} /></button></div>;
}

export default function Settings() {
    const { user, logout } = useAuth();
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [showPw, setShowPw] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const handlePwChange = async (e) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirm) {
            setToast({ msg: 'New passwords do not match', type: 'error' }); return;
        }
        if (pwForm.newPassword.length < 6) {
            setToast({ msg: 'Password must be at least 6 characters', type: 'error' }); return;
        }
        setSaving(true);
        try {
            await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
            setToast({ msg: 'Password changed successfully!', type: 'success' });
            setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
        } catch (err) {
            setToast({ msg: err.response?.data?.message || 'Failed to change password', type: 'error' });
        } finally { setSaving(false); }
    };

    return (
        <div className="animate-fade">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your account and preferences</p>
                </div>
            </div>

            <div className="page-body" style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Account Info */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <User size={16} color="var(--accent-blue)" />
                        <h3>Account Information</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div className="user-avatar" style={{ width: 52, height: 52, fontSize: 20 }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{user?.email}</div>
                            <div style={{ marginTop: 6 }}>
                                <span className="badge badge-green">Active Account</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Shield size={16} color="var(--accent-blue)" />
                        <h3>Change Password</h3>
                    </div>
                    <form onSubmit={handlePwChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <div style={{ position: 'relative' }}>
                                <input id="current-pw" type={showPw ? 'text' : 'password'} className="form-input"
                                    placeholder="••••••••" value={pwForm.currentPassword}
                                    onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                                    required style={{ paddingRight: 42 }} />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input id="new-pw" type="password" className="form-input" placeholder="Min. 6 characters"
                                value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input id="confirm-pw" type="password" className="form-input" placeholder="Repeat new password"
                                value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
                        </div>
                        <button id="change-pw-btn" type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={saving}>
                            {saving ? 'Updating…' : 'Update Password'}
                        </button>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="card" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Shield size={16} color="var(--accent-red)" />
                        <h3 style={{ color: 'var(--accent-red)' }}>Danger Zone</h3>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        Actions here are permanent and cannot be undone.
                    </p>
                    <button id="logout-btn" className="btn btn-danger" onClick={logout}>Sign Out of AutoApply</button>
                </div>

                {/* API Status */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Bell size={16} color="var(--accent-blue)" />
                        <h3>Integration Status</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            { name: 'MongoDB Database', status: 'Connected', color: 'green' },
                            { name: 'OpenAI API', status: 'Configure in .env', color: 'yellow' },
                            { name: 'Adzuna Job API', status: 'Configure in .env', color: 'yellow' },
                        ].map(({ name, status, color }) => (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-default)' }}>
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
                                <span className={`badge badge-${color}`}>{status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
