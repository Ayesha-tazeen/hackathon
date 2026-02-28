import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, User, Briefcase, Send, Settings, LogOut, Zap
} from 'lucide-react';

const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/jobs', label: 'Browse Jobs', icon: Briefcase },
    { to: '/applications', label: 'Applications', icon: Send },
    { to: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#4f8ef7,#9b59f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={18} color="white" />
                        </div>
                        <div>
                            <div className="sidebar-logo-title">AutoApply</div>
                            <div className="sidebar-logo-sub">AI Job Platform</div>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Navigation</div>
                    {navItems.slice(0, 4).map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={18} className="nav-icon" />
                            {label}
                        </NavLink>
                    ))}
                    <div className="sidebar-section-label" style={{ marginTop: 8 }}>Account</div>
                    <NavLink
                        to="/settings"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Settings size={18} className="nav-icon" />
                        Settings
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user" onClick={logout} title="Logout">
                        <div className="user-avatar">{initials}</div>
                        <div className="user-info">
                            <div className="user-name">{user?.name}</div>
                            <div className="user-email">{user?.email}</div>
                        </div>
                        <LogOut size={15} color="var(--text-muted)" />
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
