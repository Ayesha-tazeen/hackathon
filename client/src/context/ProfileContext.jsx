import { createContext, useContext, useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import { useAuth } from './AuthContext';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetch = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await profileAPI.get();
            setProfile(res.data.profile);
        } catch (err) {
            console.error('Profile fetch error', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (user) fetch(); }, [user]);

    const update = async (data) => {
        const res = await profileAPI.update(data);
        setProfile(res.data.profile);
        return res.data.profile;
    };

    return (
        <ProfileContext.Provider value={{ profile, loading, fetch, update, setProfile }}>
            {children}
        </ProfileContext.Provider>
    );
}

export const useProfile = () => useContext(ProfileContext);
