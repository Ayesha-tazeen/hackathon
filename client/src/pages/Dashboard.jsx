import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Send, Briefcase, CheckCircle, XCircle, Clock, TrendingUp,
    User, ArrowRight, Zap, Activity, BarChart2, Trophy
} from 'lucide-react';
import { applicationsAPI, jobsAPI } from '../services/api';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLORS = {
    applied: '#4f8ef7', interview: '#f59e0b', offer: '#22c55e',
    rejected: '#ef4444', pending: '#9b59f7', withdrawn: '#64748b'
};

export default function Dashboard() {
    const { user } = useAuth();
    const { profile } = useProfile();
    const [stats, setStats] = useState({});
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        applicationsAPI.list({ limit: 5 }).then(res => {
            setStats(res.data.stats || {});
            setRecent(res.data.applications || []);
        }).finally(() => setLoading(false));
    }, []);

    const total = Object.values(stats).reduce((a, b) => a + b, 0);

    const chartData = Object.entries(STATUS_COLORS).map(([status, color]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: stats[status] || 0,
        color
    })).filter(d => d.count > 0);

    const statCards = [
        { label: 'Total Applied', value: total, icon: Send, color: 'blue' },
        { label: 'Interviews', value: stats.interview || 0, icon: Activity, color: 'yellow' },
        { label: 'Offers', value: stats.offer || 0, icon: Trophy, color: 'green' },
        { label: 'Rejected', value: stats.rejected || 0, icon: XCircle, color: 'red' },
    ];

    const getStatusBadge = (status) => {
        const map = { applied: 'blue', interview: 'yellow', offer: 'green', rejected: 'red', pending: 'purple', withdrawn: 'gray' };
        return <span className={`badge badge-${map[status] || 'gray'}`}>{status}</span>;
    };

    const firstName = profile?.personal?.firstName || user?.name?.split(' ')[0] || 'there';

    return (
        <div className="animate-fade">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Hey, {firstName} 👋</h1>
                    <p className="page-subtitle">Here's your job application overview</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link to="/jobs" className="btn btn-primary">
                        <Briefcase size={16} /> Browse Jobs
                    </Link>
                </div>
            </div>

            <div className="page-body">
                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: 24 }}>
                    {statCards.map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className={`stat-card ${color}`}>
                            <div className={`stat-icon ${color}`}><Icon size={20} /></div>
                            <div className="stat-value">{loading ? '—' : value}</div>
                            <div className="stat-label">{label}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    {/* Chart */}
                    <div className="card">
                        <div className="section-header">
                            <div className="section-title"><BarChart2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Application Breakdown</div>
                        </div>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={chartData} barSize={32}>
                                    <XAxis dataKey="status" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f1f5f9', fontSize: 12 }}
                                        cursor={{ fill: 'rgba(79,142,247,0.07)' }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {chartData.map((entry) => <Cell key={entry.status} fill={entry.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-state" style={{ padding: '32px 0' }}>
                                <BarChart2 size={36} className="empty-state-icon" />
                                <p className="empty-state-text" style={{ marginTop: 8 }}>Apply to jobs to see your statistics here.</p>
                            </div>
                        )}
                    </div>

                    {/* Profile completion */}
                    <div className="card">
                        <div className="section-header">
                            <div className="section-title"><User size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Profile Completeness</div>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Progress</span>
                                <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{profile?.completeness || 0}%</span>
                            </div>
                            <div className="completeness-bar">
                                <div className="completeness-fill" style={{ width: `${profile?.completeness || 0}%` }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                            {[
                                { label: 'Personal Info', done: !!(profile?.personal?.firstName) },
                                { label: 'Work Experience', done: (profile?.experience?.length || 0) > 0 },
                                { label: 'Education', done: (profile?.education?.length || 0) > 0 },
                                { label: 'Skills', done: (profile?.skills?.length || 0) > 0 },
                                { label: 'Resume Uploaded', done: !!(profile?.resumeText) },
                            ].map(({ label, done }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {done
                                        ? <CheckCircle size={15} color="var(--accent-green)" />
                                        : <Clock size={15} color="var(--text-muted)" />
                                    }
                                    <span style={{ fontSize: 13, color: done ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
                                </div>
                            ))}
                        </div>
                        <Link to="/profile" className="btn btn-secondary btn-full" style={{ marginTop: 16 }}>
                            Complete Profile <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                {/* Recent Applications */}
                <div className="card">
                    <div className="section-header">
                        <div className="section-title"><Send size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Recent Applications</div>
                        <Link to="/applications" className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="loader" /></div>
                    ) : recent.length === 0 ? (
                        <div className="empty-state">
                            <Send size={36} className="empty-state-icon" />
                            <p className="empty-state-title">No applications yet</p>
                            <p className="empty-state-text">Browse jobs and start applying with one click!</p>
                            <Link to="/jobs" className="btn btn-primary" style={{ marginTop: 16 }}>Find Jobs</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {recent.map((app, i) => (
                                <div key={app._id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 0', borderBottom: i < recent.length - 1 ? '1px solid var(--border-default)' : 'none'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{app.job.title}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{app.job.company}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {getStatusBadge(app.status)}
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {new Date(app.appliedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 20 }}>
                    {[
                        { to: '/jobs', icon: Briefcase, label: 'Browse Jobs', sub: 'Find your next role', color: '#4f8ef7' },
                        { to: '/profile', icon: User, label: 'Update Profile', sub: 'Keep info current', color: '#9b59f7' },
                        { to: '/applications', icon: TrendingUp, label: 'Track Status', sub: 'Monitor progress', color: '#22c55e' },
                    ].map(({ to, icon: Icon, label, sub, color }) => (
                        <Link key={to} to={to} className="card card-hover" style={{ textDecoration: 'none', display: 'flex', gap: 14, alignItems: 'center' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={18} color={color} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
