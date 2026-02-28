import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, DollarSign, Clock, Zap, X, Building2 } from 'lucide-react';
import { jobsAPI, applicationsAPI, aiAPI } from '../services/api';
import { useProfile } from '../context/ProfileContext';

const COMPANY_EMOJIS = ['🏢', '🚀', '💡', '⚡', '🌐', '🎯', '🔥', '💎', '🌟', '🎮'];

function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return <div className={`toast toast-${type}`}>{msg}<button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 8, padding: 0 }}><X size={14} /></button></div>;
}

function JobModal({ job, onClose, onApplied }) {
    const { profile } = useProfile();
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const [roleDetecting, setRoleDetecting] = useState(false);
    const [detectedRole, setDetectedRole] = useState('');

    const detectRole = async () => {
        setRoleDetecting(true);
        try {
            const res = await aiAPI.detectRole(job.title + ' ' + job.description.slice(0, 500));
            setDetectedRole(res.data.role);
        } catch { } finally { setRoleDetecting(false); }
    };

    useEffect(() => { detectRole(); }, []);

    const apply = async () => {
        setApplying(true);
        try {
            await applicationsAPI.create({
                job: {
                    title: job.title, company: job.company,
                    location: job.location, applyUrl: job.applyUrl,
                    source: job.source,
                    salary: job.salary?.min ? `$${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}` : ''
                }
            });
            setApplied(true);
            onApplied?.();
        } catch { } finally { setApplying(false); }
    };

    const salaryText = job.salary?.min
        ? `$${job.salary.min.toLocaleString()} – $${job.salary.max.toLocaleString()}/yr`
        : 'Not disclosed';

    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="job-logo" style={{ width: 44, height: 44, fontSize: 22 }}>
                            {COMPANY_EMOJIS[job.company.charCodeAt(0) % COMPANY_EMOJIS.length]}
                        </div>
                        <div>
                            <div className="modal-title">{job.title}</div>
                            <div style={{ fontSize: 13, color: 'var(--accent-blue)' }}>{job.company}</div>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon-only" onClick={onClose}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                    <span className="badge badge-gray"><MapPin size={11} />{job.location}</span>
                    <span className="badge badge-green"><DollarSign size={11} />{salaryText}</span>
                    <span className="badge badge-blue"><Briefcase size={11} />{job.jobType}</span>
                    {detectedRole && <span className="ai-badge"><Zap size={11} />AI: {detectedRole}</span>}
                    {roleDetecting && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Detecting role…</span>}
                </div>

                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, maxHeight: 220, overflowY: 'auto', marginBottom: 16 }}>
                    {job.description}
                </div>

                {job.tags?.length > 0 && (
                    <div className="job-tags" style={{ marginBottom: 16 }}>
                        {job.tags.map(t => <span key={t} className="job-tag">{t}</span>)}
                    </div>
                )}

                {profile && (
                    <div style={{ background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <Zap size={12} style={{ display: 'inline', marginRight: 5, color: 'var(--accent-blue)' }} />
                        <strong style={{ color: 'var(--text-primary)' }}>AutoFill Ready</strong> — Your profile will be used to fill application forms automatically.
                    </div>
                )}

                {applied ? (
                    <div className="btn btn-success btn-full" style={{ justifyContent: 'center', cursor: 'default' }}>
                        ✅ Applied Successfully!
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                        {job.applyUrl && job.applyUrl !== '#' && (
                            <a href={job.applyUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                                View Listing
                            </a>
                        )}
                        <button id={`apply-btn-${job.id}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={apply} disabled={applying}>
                            {applying ? 'Applying…' : '⚡ Auto Apply'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Jobs() {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [selectedJob, setSelectedJob] = useState(null);
    const [toast, setToast] = useState(null);
    const [page, setPage] = useState(1);
    const [activeFilter, setActiveFilter] = useState('');

    const search = useCallback(async (pg = 1) => {
        setLoading(true);
        try {
            const res = await jobsAPI.search({ q: query || 'developer', location, page: pg, type: activeFilter });
            setJobs(res.data.jobs || []);
            setTotal(res.data.total || 0);
            setPage(pg);
        } catch { } finally { setLoading(false); }
    }, [query, location, activeFilter]);

    useEffect(() => { search(1); }, [activeFilter]);

    const handleSubmit = (e) => { e.preventDefault(); search(1); };

    const filterTypes = ['', 'full-time', 'part-time', 'contract', 'remote'];
    const filterLabels = { '': 'All', 'full-time': 'Full Time', 'part-time': 'Part Time', 'contract': 'Contract', 'remote': 'Remote' };

    return (
        <div className="animate-fade">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <div className="page-header">
                <div>
                    <h1 className="page-title">Browse Jobs</h1>
                    <p className="page-subtitle">{total > 0 ? `${total} positions found` : 'Search for your next opportunity'}</p>
                </div>
            </div>

            <div className="page-body">
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <div className="search-bar" style={{ flex: '2 1 280px' }}>
                        <Search size={16} color="var(--text-muted)" />
                        <input id="job-search-input" placeholder="Job title, role, or keyword…" value={query}
                            onChange={e => setQuery(e.target.value)} />
                    </div>
                    <div className="search-bar" style={{ flex: '1 1 180px' }}>
                        <MapPin size={16} color="var(--text-muted)" />
                        <input id="job-location-input" placeholder="Location or Remote" value={location}
                            onChange={e => setLocation(e.target.value)} />
                    </div>
                    <button id="job-search-btn" type="submit" className="btn btn-primary">
                        <Search size={15} /> Search
                    </button>
                </form>

                <div className="filter-row" style={{ marginBottom: 20 }}>
                    {filterTypes.map(t => (
                        <button key={t} className={`filter-chip ${activeFilter === t ? 'active' : ''}`}
                            onClick={() => setActiveFilter(t)}>
                            {filterLabels[t]}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="loader loader-lg" /></div>
                ) : jobs.length === 0 ? (
                    <div className="empty-state card">
                        <Briefcase size={40} className="empty-state-icon" />
                        <p className="empty-state-title">No jobs found</p>
                        <p className="empty-state-text">Try a different search term or remove filters</p>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {jobs.map((job, i) => {
                            const emoji = COMPANY_EMOJIS[job.company.charCodeAt(0) % COMPANY_EMOJIS.length];
                            return (
                                <div key={job.id || i} className="job-card" onClick={() => setSelectedJob(job)}>
                                    <div className="job-logo">{emoji}</div>
                                    <div className="job-main">
                                        <div className="job-title">{job.title}</div>
                                        <div className="job-company">{job.company}</div>
                                        <div className="job-meta">
                                            <span className="job-meta-item"><MapPin size={12} />{job.location}</span>
                                            <span className="job-meta-item"><Briefcase size={12} />{job.jobType}</span>
                                            {job.salary?.min > 0 && (
                                                <span className="job-meta-item"><DollarSign size={12} />
                                                    ${job.salary.min.toLocaleString()} – ${job.salary.max.toLocaleString()}
                                                </span>
                                            )}
                                            <span className="job-meta-item"><Clock size={12} />{new Date(job.postedAt).toLocaleDateString()}</span>
                                        </div>
                                        {job.tags?.length > 0 && (
                                            <div className="job-tags">
                                                {job.tags.slice(0, 4).map(t => <span key={t} className="job-tag">{t}</span>)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="job-actions">
                                        <span className={`badge ${job.source === 'demo' ? 'badge-gray' : 'badge-blue'}`}>
                                            <Building2 size={10} />{job.source}
                                        </span>
                                        <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}>
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && jobs.length > 0 && total > jobs.length && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24 }}>
                        <button className="btn btn-secondary" disabled={page === 1} onClick={() => search(page - 1)}>Previous</button>
                        <span style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>Page {page}</span>
                        <button className="btn btn-secondary" onClick={() => search(page + 1)}>Next</button>
                    </div>
                )}
            </div>

            {selectedJob && (
                <JobModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onApplied={() => setToast({ msg: `Applied to ${selectedJob.title} at ${selectedJob.company}!`, type: 'success' })}
                />
            )}
        </div>
    );
}
