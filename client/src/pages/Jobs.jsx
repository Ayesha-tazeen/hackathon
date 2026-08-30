import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Clock, Zap, X, Building2, CheckCircle, Edit3, Loader } from 'lucide-react';
import { jobsAPI, aiAPI } from '../services/api';
import { useProfile } from '../context/ProfileContext';

const COMPANY_EMOJIS = ['🏢', '🚀', '💡', '⚡', '🌐', '🎯', '🔥', '💎', '🌟', '🎮'];

function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`toast toast-${type}`}>
            {msg}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 8, padding: 0 }}>
                <X size={14} />
            </button>
        </div>
    );
}

// ─── Cover Letter Preview Modal ───────────────────────────────────────────────
function CoverLetterModal({ job, coverLetter: initialLetter, onConfirm, onClose, mock }) {
    const [letter, setLetter] = useState(initialLetter);
    const [submitting, setSubmitting] = useState(false);

    const confirm = async () => {
        setSubmitting(true);
        await onConfirm(letter);
        setSubmitting(false);
    };

    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal" style={{ maxWidth: 640 }}>
                <div className="modal-header">
                    <div>
                        <div className="modal-title">📝 AI-Generated Cover Letter</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {job.title} @ {job.company}
                            {mock && <span style={{ marginLeft: 8, color: 'var(--accent-yellow)', fontSize: 11 }}>⚠ Demo (add OpenAI key for real AI)</span>}
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon-only" onClick={onClose}><X size={18} /></button>
                </div>

                <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(79,142,247,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Zap size={13} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: 1 }} />
                    <span>AI wrote this cover letter using your profile. You can edit it before submitting.</span>
                </div>

                <textarea
                    value={letter}
                    onChange={e => setLetter(e.target.value)}
                    className="form-textarea"
                    style={{ minHeight: 280, fontFamily: 'inherit', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}
                />

                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={confirm} disabled={submitting}>
                        {submitting ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : '✅ Confirm & Submit Application'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Job Detail Modal ─────────────────────────────────────────────────────────
function JobModal({ job, onClose, onApplied }) {
    const { profile } = useProfile();
    const [step, setStep] = useState('detail'); // 'detail' | 'generating' | 'preview' | 'done'
    const [coverLetter, setCoverLetter] = useState('');
    const [isMock, setIsMock] = useState(false);
    const [detectedRole, setDetectedRole] = useState('');
    const [roleDetecting, setRoleDetecting] = useState(false);
    const [error, setError] = useState('');

    // Detect role on open
    useEffect(() => {
        const detect = async () => {
            setRoleDetecting(true);
            try {
                const res = await aiAPI.detectRole(job.title + ' ' + (job.description || '').slice(0, 500));
                setDetectedRole(res.data.role);
            } catch { /* silently ignore */ } finally { setRoleDetecting(false); }
        };
        detect();
    }, []);

    // Step 1: Generate cover letter via AI
    const startAIApply = async () => {
        if (!profile) {
            setError('Please complete your profile before applying.');
            return;
        }
        setError('');
        setStep('generating');
        try {
            const res = await aiAPI.generateCoverLetter(profile, job);
            setCoverLetter(res.data.coverLetter);
            setIsMock(res.data.mock || false);
            setStep('preview');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to generate cover letter. Please try again.');
            setStep('detail');
        }
    };

    // Step 2: Save application after user confirms cover letter
    const confirmApply = async (finalLetter) => {
        try {
            await aiAPI.autoApply(profile, { ...job, coverLetter: finalLetter });
            setStep('done');
            onApplied?.();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to submit application.');
            setStep('preview');
        }
    };

    const salaryText = job.salary?.min
        ? `$${job.salary.min.toLocaleString()} – $${job.salary.max.toLocaleString()}/yr`
        : 'Not disclosed';

    if (step === 'preview') {
        return (
            <CoverLetterModal
                job={job}
                coverLetter={coverLetter}
                mock={isMock}
                onConfirm={confirmApply}
                onClose={() => setStep('detail')}
            />
        );
    }

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

                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
                    {job.description}
                </div>

                {job.tags?.length > 0 && (
                    <div className="job-tags" style={{ marginBottom: 16 }}>
                        {job.tags.map(t => <span key={t} className="job-tag">{t}</span>)}
                    </div>
                )}

                {/* AI AutoFill Info */}
                <div style={{ background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.18)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Zap size={13} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                            <strong style={{ color: 'var(--text-primary)' }}>AI Auto-Apply Flow</strong>
                        </div>
                        <div style={{ paddingLeft: 19, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <span>1. AI reads your profile</span>
                            <span>2. Generates a personalized cover letter</span>
                            <span>3. You review &amp; edit before submitting</span>
                        </div>
                        {!profile && <div style={{ color: 'var(--accent-yellow)', marginTop: 4 }}>⚠ Complete your profile first for best results.</div>}
                    </div>
                </div>

                {error && (
                    <div style={{ color: 'var(--accent-red)', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>
                        {error}
                    </div>
                )}

                {step === 'done' ? (
                    <div className="btn btn-success btn-full" style={{ justifyContent: 'center', cursor: 'default' }}>
                        <CheckCircle size={16} /> Applied Successfully!
                    </div>
                ) : step === 'generating' ? (
                    <div className="btn btn-primary btn-full" style={{ justifyContent: 'center', cursor: 'not-allowed', opacity: 0.8 }}>
                        <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />
                        AI is writing your cover letter…
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                        {job.applyUrl && job.applyUrl !== '#' && (
                            <a href={job.applyUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                                View Listing
                            </a>
                        )}
                        <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={startAIApply}>
                            <Zap size={15} /> ⚡ AI Auto Apply
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Jobs Page ───────────────────────────────────────────────────────────
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
    const [bulkApplying, setBulkApplying] = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
    const { profile } = useProfile();

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

    // Bulk AI Apply — applies to all visible jobs sequentially
    const bulkAIApply = async () => {
        if (!profile) {
            setToast({ msg: 'Complete your profile before bulk applying!', type: 'error' });
            return;
        }
        if (!window.confirm(`AI will apply to all ${jobs.length} jobs using your profile. Continue?`)) return;

        setBulkApplying(true);
        setBulkProgress({ done: 0, total: jobs.length });
        let successCount = 0;

        for (let i = 0; i < jobs.length; i++) {
            try {
                await aiAPI.autoApply(profile, jobs[i]);
                successCount++;
            } catch { /* skip failed ones */ }
            setBulkProgress({ done: i + 1, total: jobs.length });
        }

        setBulkApplying(false);
        setToast({ msg: `⚡ Bulk AI Apply done! Applied to ${successCount}/${jobs.length} jobs.`, type: 'success' });
    };

    return (
        <div className="animate-fade">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <div className="page-header">
                <div>
                    <h1 className="page-title">Browse Jobs</h1>
                    <p className="page-subtitle">{total > 0 ? `${total} positions found` : 'Search for your next opportunity'}</p>
                </div>
                {jobs.length > 0 && (
                    <button
                        className="btn btn-primary"
                        onClick={bulkAIApply}
                        disabled={bulkApplying}
                        style={{ gap: 8 }}
                    >
                        {bulkApplying
                            ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> {bulkProgress.done}/{bulkProgress.total}</>
                            : <><Zap size={14} /> Bulk AI Apply ({jobs.length})</>
                        }
                    </button>
                )}
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
                                            <Zap size={12} /> Apply
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
                    onApplied={() => {
                        setToast({ msg: `⚡ Applied to ${selectedJob.title} at ${selectedJob.company}!`, type: 'success' });
                        setSelectedJob(null);
                    }}
                />
            )}
        </div>
    );
}
