import { useState, useEffect, useRef } from 'react';
import { useProfile } from '../context/ProfileContext';
import { profileAPI, aiAPI } from '../services/api';
import {
    User, Briefcase, GraduationCap, Code2, FileText, Settings as SettingsIcon,
    Plus, Trash2, Save, Upload, X, Zap, CheckCircle, AlertCircle
} from 'lucide-react';

function TagInput({ value = [], onChange, placeholder }) {
    const [input, setInput] = useState('');
    const addTag = (tag) => {
        const t = tag.trim();
        if (t && !value.includes(t)) onChange([...value, t]);
        setInput('');
    };
    const onKeyDown = (e) => {
        if (['Enter', ',', 'Tab'].includes(e.key)) { e.preventDefault(); addTag(input); }
        if (e.key === 'Backspace' && !input && value.length > 0) onChange(value.slice(0, -1));
    };
    return (
        <div className="tag-input-wrapper">
            {value.map(t => (
                <span key={t} className="tag-chip">
                    {t}
                    <span className="tag-chip-remove" onClick={() => onChange(value.filter(x => x !== t))}><X size={11} /></span>
                </span>
            ))}
            <input className="tag-input" value={input} placeholder={value.length === 0 ? placeholder : ''}
                onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown} onBlur={() => addTag(input)} />
        </div>
    );
}

function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return <div className={`toast toast-${type}`}>{msg}</div>;
}

const TABS = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills & More', icon: Code2 },
    { id: 'resume', label: 'Resume', icon: FileText },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
];

export default function Profile() {
    const { profile, update, setProfile } = useProfile();
    const [activeTab, setActiveTab] = useState('personal');
    const [local, setLocal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [parseResult, setParseResult] = useState(null);
    const fileRef = useRef();

    useEffect(() => {
        if (profile && !local) setLocal(JSON.parse(JSON.stringify(profile)));
    }, [profile]);

    if (!local) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="loader loader-lg" /></div>;

    const setField = (path, val) => {
        const parts = path.split('.');
        setLocal(prev => {
            const n = JSON.parse(JSON.stringify(prev));
            let cur = n;
            for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]] = cur[parts[i]] || {};
            cur[parts[parts.length - 1]] = val;
            return n;
        });
    };

    const save = async () => {
        setSaving(true);
        try {
            await update(local);
            setToast({ msg: 'Profile saved successfully!', type: 'success' });
        } catch {
            setToast({ msg: 'Failed to save profile', type: 'error' });
        } finally { setSaving(false); }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setParsing(true);
        try {
            const res = await profileAPI.parseResume(file);
            setParseResult(res.data);
        } catch {
            setToast({ msg: 'Failed to parse resume', type: 'error' });
        } finally { setParsing(false); }
    };

    const applyParsed = () => {
        if (!parseResult?.data) return;
        const d = parseResult.data;
        const merged = { ...local };
        if (d.personal) merged.personal = { ...merged.personal, ...d.personal };
        if (d.education?.length) merged.education = d.education;
        if (d.experience?.length) merged.experience = d.experience;
        if (d.skills?.length) merged.skills = [...new Set([...(merged.skills || []), ...d.skills])];
        if (d.certifications?.length) merged.certifications = d.certifications;
        if (d.languages?.length) merged.languages = d.languages;
        if (d.rawText) merged.resumeText = d.rawText;
        setLocal(merged);
        setParseResult(null);
        setToast({ msg: 'Resume data applied to profile!', type: 'success' });
    };

    const addExp = () => setLocal(p => ({ ...p, experience: [...(p.experience || []), { company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '' }] }));
    const removeExp = (i) => setLocal(p => ({ ...p, experience: p.experience.filter((_, idx) => idx !== i) }));
    const setExp = (i, key, val) => setLocal(p => {
        const exp = [...p.experience];
        exp[i] = { ...exp[i], [key]: val };
        return { ...p, experience: exp };
    });

    const addEdu = () => setLocal(p => ({ ...p, education: [...(p.education || []), { institution: '', degree: '', field: '', startYear: '', endYear: '', gpa: '' }] }));
    const removeEdu = (i) => setLocal(p => ({ ...p, education: p.education.filter((_, idx) => idx !== i) }));
    const setEdu = (i, key, val) => setLocal(p => {
        const edu = [...p.education];
        edu[i] = { ...edu[i], [key]: val };
        return { ...p, education: edu };
    });

    const inp = (path, placeholder, type = 'text') => (
        <input type={type} className="form-input" placeholder={placeholder}
            value={path.split('.').reduce((o, k) => o?.[k] ?? '', local) || ''}
            onChange={e => setField(path, e.target.value)} />
    );

    return (
        <div className="animate-fade">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <div className="page-header">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Profile completeness: <strong style={{ color: 'var(--accent-blue)' }}>{local.completeness || 0}%</strong></p>
                </div>
                <button id="save-profile-btn" className="btn btn-primary" onClick={save} disabled={saving}>
                    <Save size={15} /> {saving ? 'Saving…' : 'Save Profile'}
                </button>
            </div>

            <div className="page-body">
                {/* Completeness bar */}
                <div style={{ marginBottom: 20 }}>
                    <div className="completeness-bar">
                        <div className="completeness-fill" style={{ width: `${local.completeness || 0}%` }} />
                    </div>
                </div>

                <div className="profile-tabs">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button key={id} className={`profile-tab ${activeTab === id ? 'active' : ''}`}
                            onClick={() => setActiveTab(id)}>
                            <Icon size={14} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Personal */}
                {activeTab === 'personal' && (
                    <div className="animate-fade">
                        <div className="form-grid">
                            <div className="form-group"><label className="form-label">First Name</label>{inp('personal.firstName', 'John')}</div>
                            <div className="form-group"><label className="form-label">Last Name</label>{inp('personal.lastName', 'Doe')}</div>
                            <div className="form-group"><label className="form-label">Phone</label>{inp('personal.phone', '+1 234 567 8900', 'tel')}</div>
                            <div className="form-group"><label className="form-label">City</label>{inp('personal.city', 'San Francisco')}</div>
                            <div className="form-group"><label className="form-label">State / Province</label>{inp('personal.state', 'CA')}</div>
                            <div className="form-group"><label className="form-label">Country</label>{inp('personal.country', 'United States')}</div>
                            <div className="form-group"><label className="form-label">LinkedIn URL</label>{inp('personal.linkedin', 'https://linkedin.com/in/yourname')}</div>
                            <div className="form-group"><label className="form-label">GitHub URL</label>{inp('personal.github', 'https://github.com/yourusername')}</div>
                            <div className="form-group form-grid-full"><label className="form-label">Portfolio / Website</label>{inp('personal.portfolio', 'https://yoursite.com')}</div>
                            <div className="form-group form-grid-full">
                                <label className="form-label">Professional Summary</label>
                                <textarea className="form-textarea" placeholder="Brief summary of your background and goals…"
                                    value={local.personal?.summary || ''} onChange={e => setField('personal.summary', e.target.value)}
                                    style={{ minHeight: 120 }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Experience */}
                {activeTab === 'experience' && (
                    <div className="animate-fade">
                        {(local.experience || []).map((exp, i) => (
                            <div key={i} className="card" style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                                    <h4 style={{ color: 'var(--text-primary)' }}>Position {i + 1}</h4>
                                    <button className="btn btn-danger btn-sm" onClick={() => removeExp(i)}><Trash2 size={13} /></button>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group"><label className="form-label">Job Title</label>
                                        <input className="form-input" placeholder="Software Engineer" value={exp.title || ''} onChange={e => setExp(i, 'title', e.target.value)} /></div>
                                    <div className="form-group"><label className="form-label">Company</label>
                                        <input className="form-input" placeholder="ACME Corp" value={exp.company || ''} onChange={e => setExp(i, 'company', e.target.value)} /></div>
                                    <div className="form-group"><label className="form-label">Location</label>
                                        <input className="form-input" placeholder="San Francisco, CA" value={exp.location || ''} onChange={e => setExp(i, 'location', e.target.value)} /></div>
                                    <div className="form-group"><label className="form-label">Start Date</label>
                                        <input className="form-input" placeholder="Jan 2022" value={exp.startDate || ''} onChange={e => setExp(i, 'startDate', e.target.value)} /></div>
                                    <div className="form-group"><label className="form-label">End Date</label>
                                        <input className="form-input" placeholder="Dec 2023 or Present" disabled={exp.current} value={exp.current ? 'Present' : (exp.endDate || '')} onChange={e => setExp(i, 'endDate', e.target.value)} /></div>
                                    <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 24 }}>
                                            <input type="checkbox" checked={exp.current || false} onChange={e => setExp(i, 'current', e.target.checked)} />
                                            <span style={{ fontSize: 13 }}>Currently working here</span>
                                        </label>
                                    </div>
                                    <div className="form-group form-grid-full"><label className="form-label">Description</label>
                                        <textarea className="form-textarea" placeholder="Key responsibilities and achievements…" value={exp.description || ''} onChange={e => setExp(i, 'description', e.target.value)} /></div>
                                </div>
                            </div>
                        ))}
                        <button className="btn btn-secondary" onClick={addExp}><Plus size={15} /> Add Work Experience</button>
                    </div>
                )}

                {/* Education */}
                {activeTab === 'education' && (
                    <div className="animate-fade">
                        {(local.education || []).map((edu, i) => (
                            <div key={i} className="card" style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                                    <h4>Degree {i + 1}</h4>
                                    <button className="btn btn-danger btn-sm" onClick={() => removeEdu(i)}><Trash2 size={13} /></button>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group form-grid-full"><label className="form-label">Institution</label>
                                        <input className="form-input" placeholder="MIT" value={edu.institution || ''} onChange={e => setEdu(i, 'institution', e.target.value)} /></div>
                                    <div className="form-group"><label className="form-label">Degree</label>
                                        <input className="form-input" placeholder="Bachelor of Science" value={edu.degree || ''} onChange={e => setEdu(i, 'degree', e.target.value)} /></div>
                                    <div className="form-group"><label className="form-label">Field of Study</label>
                                        <input className="form-input" placeholder="Computer Science" value={edu.field || ''} onChange={e => setEdu(i, 'field', e.target.value)} /></div>
                                    <div className="form-group"><label className="form-label">Start Year</label>
                                        <input className="form-input" placeholder="2018" value={edu.startYear || ''} onChange={e => setEdu(i, 'startYear', e.target.value)} /></div>
                                    <div className="form-group"><label className="form-label">End Year</label>
                                        <input className="form-input" placeholder="2022" value={edu.endYear || ''} onChange={e => setEdu(i, 'endYear', e.target.value)} /></div>
                                    <div className="form-group"><label className="form-label">GPA</label>
                                        <input className="form-input" placeholder="3.8" value={edu.gpa || ''} onChange={e => setEdu(i, 'gpa', e.target.value)} /></div>
                                </div>
                            </div>
                        ))}
                        <button className="btn btn-secondary" onClick={addEdu}><Plus size={15} /> Add Education</button>
                    </div>
                )}

                {/* Skills */}
                {activeTab === 'skills' && (
                    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="card">
                            <h4 style={{ marginBottom: 12 }}>Technical Skills</h4>
                            <TagInput value={local.skills || []} onChange={v => setField('skills', v)}
                                placeholder="Type a skill and press Enter (e.g. React, Python…)" />
                        </div>
                        <div className="card">
                            <h4 style={{ marginBottom: 12 }}>Languages</h4>
                            <TagInput value={local.languages || []} onChange={v => setField('languages', v)}
                                placeholder="e.g. English, Spanish…" />
                        </div>
                        <div className="card">
                            <h4 style={{ marginBottom: 12 }}>Certifications</h4>
                            {(local.certifications || []).map((cert, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                                    <input className="form-input" placeholder="Certification name" value={cert.name || ''}
                                        onChange={e => {
                                            const c = [...(local.certifications || [])];
                                            c[i] = { ...c[i], name: e.target.value };
                                            setField('certifications', c);
                                        }} />
                                    <input className="form-input" placeholder="Issuer" value={cert.issuer || ''}
                                        onChange={e => {
                                            const c = [...(local.certifications || [])];
                                            c[i] = { ...c[i], issuer: e.target.value };
                                            setField('certifications', c);
                                        }} />
                                    <input className="form-input" placeholder="Year" style={{ width: 80 }} value={cert.year || ''}
                                        onChange={e => {
                                            const c = [...(local.certifications || [])];
                                            c[i] = { ...c[i], year: e.target.value };
                                            setField('certifications', c);
                                        }} />
                                    <button className="btn btn-danger btn-sm btn-icon-only"
                                        onClick={() => setField('certifications', (local.certifications || []).filter((_, idx) => idx !== i))}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                            <button className="btn btn-secondary btn-sm" onClick={() => setField('certifications', [...(local.certifications || []), { name: '', issuer: '', year: '' }])}>
                                <Plus size={13} /> Add Certification
                            </button>
                        </div>
                    </div>
                )}

                {/* Resume */}
                {activeTab === 'resume' && (
                    <div className="animate-fade">
                        <div className="card" style={{ marginBottom: 16 }}>
                            <h4 style={{ marginBottom: 4 }}>AI Resume Parser</h4>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                Upload your PDF or DOCX resume to automatically extract profile information using AI.
                            </p>
                            <div className="dropzone" onClick={() => fileRef.current.click()}>
                                <div className="dropzone-icon"><Upload size={40} /></div>
                                <div className="dropzone-text">Click or drag resume here</div>
                                <div className="dropzone-sub">PDF or DOCX, max 10MB</div>
                            </div>
                            <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf,.doc,.docx"
                                onChange={handleResumeUpload} />
                            {parsing && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, color: 'var(--accent-blue)' }}>
                                <div className="loader" /><span style={{ fontSize: 13 }}>Parsing resume with AI…</span>
                            </div>}
                        </div>

                        {parseResult && (
                            <div className="card" style={{ marginBottom: 16, border: '1px solid rgba(79,142,247,0.3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <Zap size={16} color="var(--accent-blue)" />
                                    <h4>AI Extracted Data</h4>
                                    {parseResult.data?.mock && <span className="ai-badge">Demo Mode</span>}
                                </div>
                                {parseResult.data?.personal && (
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                                        <strong>{parseResult.data.personal.firstName} {parseResult.data.personal.lastName}</strong>
                                        {parseResult.data.personal.email && ` • ${parseResult.data.personal.email}`}
                                    </div>
                                )}
                                {parseResult.data?.skills?.length > 0 && (
                                    <div style={{ marginBottom: 10 }}>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Detected skills:</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {parseResult.data.skills.map(s => <span key={s} className="badge badge-blue">{s}</span>)}
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                                    <button className="btn btn-primary" onClick={applyParsed}><CheckCircle size={14} /> Apply to Profile</button>
                                    <button className="btn btn-secondary" onClick={() => setParseResult(null)}><X size={14} /> Dismiss</button>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Resume Text (editable)</label>
                            <textarea className="form-textarea" style={{ minHeight: 300, fontFamily: 'monospace', fontSize: 12 }}
                                placeholder="Your resume text will appear here after upload, or paste it manually…"
                                value={local.resumeText || ''}
                                onChange={e => setField('resumeText', e.target.value)} />
                        </div>
                    </div>
                )}

                {/* Preferences */}
                {activeTab === 'preferences' && (
                    <div className="animate-fade">
                        <div className="card" style={{ marginBottom: 16 }}>
                            <h4 style={{ marginBottom: 14 }}>Job Preferences</h4>
                            <div className="form-grid" style={{ marginBottom: 16 }}>
                                <div className="form-group form-grid-full">
                                    <label className="form-label">Desired Roles</label>
                                    <TagInput value={local.preferences?.desiredRoles || []}
                                        onChange={v => setField('preferences.desiredRoles', v)}
                                        placeholder="e.g. Software Engineer, Product Manager…" />
                                </div>
                                <div className="form-group form-grid-full">
                                    <label className="form-label">Preferred Locations</label>
                                    <TagInput value={local.preferences?.desiredLocations || []}
                                        onChange={v => setField('preferences.desiredLocations', v)}
                                        placeholder="e.g. San Francisco, Remote…" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Min Salary (USD/yr)</label>
                                    <input type="number" className="form-input" placeholder="80000"
                                        value={local.preferences?.minSalary || ''} onChange={e => setField('preferences.minSalary', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Max Salary (USD/yr)</label>
                                    <input type="number" className="form-input" placeholder="150000"
                                        value={local.preferences?.maxSalary || ''} onChange={e => setField('preferences.maxSalary', e.target.value)} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                {[
                                    { key: 'remote', label: 'Remote Work' },
                                    { key: 'fullTime', label: 'Full-Time' },
                                    { key: 'partTime', label: 'Part-Time' },
                                    { key: 'contract', label: 'Contract' },
                                ].map(({ key, label }) => (
                                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={local.preferences?.[key] || false}
                                            onChange={e => setField(`preferences.${key}`, e.target.checked)} />
                                        <span style={{ fontSize: 13 }}>{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
