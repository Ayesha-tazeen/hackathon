import { useState, useEffect } from 'react';
import { Send, Briefcase, CheckCircle, XCircle, Clock, ArrowUpRight, Trash2, X, Edit3, MessageSquare } from 'lucide-react';
import { applicationsAPI } from '../services/api';

const COLUMNS = [
    { key: 'applied', label: 'Applied', color: '#4f8ef7' },
    { key: 'pending', label: 'Pending', color: '#9b59f7' },
    { key: 'interview', label: 'Interview', color: '#f59e0b' },
    { key: 'offer', label: 'Offer', color: '#22c55e' },
    { key: 'rejected', label: 'Rejected', color: '#ef4444' },
];

function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return <div className={`toast toast-${type}`}>{msg}<button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 8 }}><X size={14} /></button></div>;
}

function EditModal({ app, onClose, onSaved }) {
    const [form, setForm] = useState({
        status: app.status, notes: app.notes || '', contactName: app.contactName || '',
        contactEmail: app.contactEmail || '', nextStep: app.nextStep || ''
    });
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            await applicationsAPI.update(app._id, form);
            onSaved();
        } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-header">
                    <div>
                        <div className="modal-title">{app.job.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{app.job.company}</div>
                    </div>
                    <button className="btn btn-ghost btn-icon-only" onClick={onClose}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                            {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                            <option value="withdrawn">Withdrawn</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contact Name</label>
                        <input className="form-input" placeholder="Recruiter name" value={form.contactName}
                            onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contact Email</label>
                        <input className="form-input" type="email" placeholder="recruiter@company.com" value={form.contactEmail}
                            onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Next Step</label>
                        <input className="form-input" placeholder="e.g. Technical interview on Monday" value={form.nextStep}
                            onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea className="form-textarea" placeholder="Any notes about this application…" value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ minHeight: 80 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Applications() {
    const [apps, setApps] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('kanban');
    const [toast, setToast] = useState(null);
    const [editApp, setEditApp] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await applicationsAPI.list({ limit: 100 });
            setApps(res.data.applications || []);
            setStats(res.data.stats || {});
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const deleteApp = async (id) => {
        if (!window.confirm('Remove this application?')) return;
        await applicationsAPI.delete(id);
        setApps(a => a.filter(x => x._id !== id));
        setToast({ msg: 'Application removed', type: 'info' });
    };

    const grouped = COLUMNS.reduce((acc, col) => {
        acc[col.key] = apps.filter(a => a.status === col.key);
        return acc;
    }, {});

    const total = apps.length;

    return (
        <div className="animate-fade">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <div className="page-header">
                <div>
                    <h1 className="page-title">Applications</h1>
                    <p className="page-subtitle">{total} application{total !== 1 ? 's' : ''} tracked</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['kanban', 'list'].map(v => (
                        <button key={v} className={`btn ${view === v ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => setView(v)}>
                            {v === 'kanban' ? '⊞ Board' : '≡ List'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="page-body">
                {/* Quick stats */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                    {COLUMNS.map(col => (
                        <div key={col.key} style={{ background: `${col.color}15`, border: `1px solid ${col.color}33`, borderRadius: 10, padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 18, fontWeight: 800, color: col.color }}>{stats[col.key] || 0}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{col.label}</span>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="loader loader-lg" /></div>
                ) : apps.length === 0 ? (
                    <div className="empty-state card">
                        <Send size={40} className="empty-state-icon" />
                        <p className="empty-state-title">No applications yet</p>
                        <p className="empty-state-text">When you apply to jobs, they'll appear here for tracking.</p>
                    </div>
                ) : view === 'kanban' ? (
                    <div className="kanban-board">
                        {COLUMNS.map(col => (
                            <div key={col.key} className="kanban-col">
                                <div className="kanban-col-header">
                                    <span className="kanban-col-title" style={{ color: col.color }}>{col.label}</span>
                                    <span className="kanban-count">{grouped[col.key]?.length || 0}</span>
                                </div>
                                {grouped[col.key]?.map(app => (
                                    <div key={app._id} className="kanban-card" onClick={() => setEditApp(app)}>
                                        <div className="kanban-card-title">{app.job.title}</div>
                                        <div className="kanban-card-company">{app.job.company}</div>
                                        {app.nextStep && <div style={{ fontSize: 11, color: 'var(--accent-yellow)', marginTop: 5 }}>→ {app.nextStep}</div>}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                            <div className="kanban-card-date">{new Date(app.appliedAt).toLocaleDateString()}</div>
                                            <button className="btn btn-ghost btn-sm btn-icon-only" style={{ width: 24, height: 24 }}
                                                onClick={e => { e.stopPropagation(); deleteApp(app._id); }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {grouped[col.key]?.length === 0 && (
                                    <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Empty</div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                                    {['Role', 'Company', 'Location', 'Status', 'Applied', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {apps.map((app, i) => {
                                    const colInfo = COLUMNS.find(c => c.key === app.status) || COLUMNS[0];
                                    return (
                                        <tr key={app._id} style={{ borderBottom: i < apps.length - 1 ? '1px solid var(--border-default)' : 'none' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>{app.job.title}</td>
                                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{app.job.company}</td>
                                            <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{app.job.location}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ background: `${colInfo.color}20`, color: colInfo.color, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                                                {new Date(app.appliedAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="btn btn-ghost btn-sm btn-icon-only" onClick={() => setEditApp(app)} title="Edit"><Edit3 size={13} /></button>
                                                    <button className="btn btn-ghost btn-sm btn-icon-only" onClick={() => deleteApp(app._id)} title="Delete"><Trash2 size={13} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {editApp && (
                <EditModal
                    app={editApp}
                    onClose={() => setEditApp(null)}
                    onSaved={() => { setEditApp(null); load(); setToast({ msg: 'Application updated!', type: 'success' }); }}
                />
            )}
        </div>
    );
}
