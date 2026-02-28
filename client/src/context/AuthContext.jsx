import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('aa_user')); } catch { return null; }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('aa_token');
        if (token) {
            authAPI.me()
                .then(res => setUser(res.data.user))
                .catch(() => { localStorage.removeItem('aa_token'); localStorage.removeItem('aa_user'); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await authAPI.login({ email, password });
        const { token, user } = res.data;
        localStorage.setItem('aa_token', token);
        localStorage.setItem('aa_user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const register = async (name, email, password) => {
        const res = await authAPI.register({ name, email, password });
        const { token, user } = res.data;
        localStorage.setItem('aa_token', token);
        localStorage.setItem('aa_user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const logout = () => {
        localStorage.removeItem('aa_token');
        localStorage.removeItem('aa_user');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
