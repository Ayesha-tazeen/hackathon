const axios = require('axios');




// Mock job data for demo / when Adzuna keys are not set
const mockJobs = [
    {
        id: 'mock1', title: 'Senior Frontend Developer', company: 'TechCorp Inc.',
        location: 'San Francisco, CA', description: 'We are looking for a skilled Senior Frontend Developer with experience in React, TypeScript, and modern web technologies. You will lead the development of our user-facing products.',
        applyUrl: '#', salary: { min: 120000, max: 160000, currency: 'USD' }, jobType: 'full-time',
        tags: ['React', 'TypeScript', 'CSS', 'JavaScript'], source: 'demo', postedAt: new Date()
    },
    {
        id: 'mock2', title: 'Backend Engineer (Node.js)', company: 'StartupAI',
        location: 'Remote', description: 'Join our growing team as a Backend Engineer. You will build scalable APIs and microservices using Node.js, Express, and MongoDB.',
        applyUrl: '#', salary: { min: 100000, max: 140000, currency: 'USD' }, jobType: 'remote',
        tags: ['Node.js', 'Express', 'MongoDB', 'AWS'], source: 'demo', postedAt: new Date()
    },
    {
        id: 'mock3', title: 'Full Stack Developer', company: 'GlobalSoft',
        location: 'New York, NY', description: 'Build end-to-end features across our SaaS platform. Work with React frontend and Python/Django backend. PostgreSQL database experience valued.',
        applyUrl: '#', salary: { min: 110000, max: 150000, currency: 'USD' }, jobType: 'full-time',
        tags: ['React', 'Python', 'PostgreSQL', 'Django'], source: 'demo', postedAt: new Date()
    },
    {
        id: 'mock4', title: 'DevOps Engineer', company: 'CloudNative Co.',
        location: 'Austin, TX', description: 'Manage CI/CD pipelines, Kubernetes clusters, and cloud infrastructure on AWS. Experience with Terraform and Docker required.',
        applyUrl: '#', salary: { min: 115000, max: 155000, currency: 'USD' }, jobType: 'full-time',
        tags: ['DevOps', 'Kubernetes', 'AWS', 'Docker', 'Terraform'], source: 'demo', postedAt: new Date()
    },
    {
        id: 'mock5', title: 'Data Scientist', company: 'AnalyticsPro',
        location: 'Boston, MA', description: 'Apply machine learning and statistical analysis to drive business insights. Python, TensorFlow, and SQL expertise needed.',
        applyUrl: '#', salary: { min: 105000, max: 145000, currency: 'USD' }, jobType: 'full-time',
        tags: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'], source: 'demo', postedAt: new Date()
    },
    {
        id: 'mock6', title: 'Mobile Developer (React Native)', company: 'AppWorks',
        location: 'Remote', description: 'Build cross-platform mobile apps using React Native. Work with iOS and Android platforms, integrate REST APIs.',
        applyUrl: '#', salary: { min: 95000, max: 130000, currency: 'USD' }, jobType: 'remote',
        tags: ['React Native', 'iOS', 'Android', 'JavaScript'], source: 'demo', postedAt: new Date()
    },
    {
        id: 'mock7', title: 'Software Engineer II', company: 'Enterprise Solutions',
        location: 'Seattle, WA', description: 'Work on distributed backend systems with Java/Spring Boot. Collaborate with cross-functional teams on high-impact products.',
        applyUrl: '#', salary: { min: 130000, max: 170000, currency: 'USD' }, jobType: 'full-time',
        tags: ['Java', 'Spring Boot', 'Microservices', 'AWS'], source: 'demo', postedAt: new Date()
    },
    {
        id: 'mock8', title: 'UI/UX Designer & Developer', company: 'DesignFirst Agency',
        location: 'Los Angeles, CA', description: 'Bridge design and development. Create stunning interfaces in Figma and implement them with React. Strong CSS and animation skills.',
        applyUrl: '#', salary: { min: 90000, max: 120000, currency: 'USD' }, jobType: 'full-time',
        tags: ['Figma', 'React', 'CSS', 'UI/UX'], source: 'demo', postedAt: new Date()
    }
];

async function fetchFromAdzuna({ q, location, page, limit }) {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    const country = process.env.ADZUNA_COUNTRY || 'us';

    if (!appId || !appKey || appId === 'your_adzuna_app_id') {
        return null; // Will fall back to mock
    }

    try {
        const params = new URLSearchParams({
            app_id: appId,
            app_key: appKey,
            results_per_page: limit,
            what: q,
            where: location,
            page,
            'content-type': 'application/json'
        });

        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`;
        const { data } = await axios.get(url, { timeout: 8000 });

        const jobs = (data.results || []).map(j => ({
            id: j.id,
            title: j.title,
            company: j.company?.display_name || 'Unknown Company',
            location: j.location?.display_name || location || 'Remote',
            description: j.description || '',
            applyUrl: j.redirect_url || '#',
            salary: {
                min: Math.round(j.salary_min || 0),
                max: Math.round(j.salary_max || 0),
                currency: 'USD'
            },
            jobType: j.contract_type === 'permanent' ? 'full-time' : (j.contract_type || 'full-time'),
            tags: j.category?.tag ? [j.category.tag] : [],
            source: 'adzuna',
            postedAt: j.created ? new Date(j.created) : new Date()
        }));

        return { jobs, total: data.count || jobs.length };
    } catch (err) {
        console.warn('Adzuna fetch failed, using mock data:', err.message);
        return null;
    }
}

async function search({ q, location, page = 1, limit = 20, type }) {
    const adzunaResult = await fetchFromAdzuna({ q, location, page, limit });

    if (adzunaResult) {
        return { jobs: adzunaResult.jobs, total: adzunaResult.total, source: 'adzuna' };
    }

    // Filter mock data
    let filtered = mockJobs;
    if (q) {
        const lower = q.toLowerCase();
        filtered = filtered.filter(j =>
            j.title.toLowerCase().includes(lower) ||
            j.description.toLowerCase().includes(lower) ||
            j.tags.some(t => t.toLowerCase().includes(lower))
        );
    }
    if (location) {
        const lower = location.toLowerCase();
        filtered = filtered.filter(j => j.location.toLowerCase().includes(lower));
    }
    if (type) {
        filtered = filtered.filter(j => j.jobType === type);
    }

    const start = (page - 1) * limit;
    return {
        jobs: filtered.slice(start, start + limit),
        total: filtered.length,
        source: 'demo'
    };
}

async function getById(id) {
    return mockJobs.find(j => j.id === id) || null;
}

module.exports = { search, getById };


// const axios = require('axios');

// // Mock job data for demo / fallback
// const mockJobs = [
//     {
//         id: 'mock1',
//         title: 'Senior Frontend Developer',
//         company: 'TechCorp Inc.',
//         location: 'San Francisco, CA',
//         description: 'React + TypeScript developer role.',
//         applyUrl: '#',
//         salary: { min: 120000, max: 160000, currency: 'USD' },
//         jobType: 'full-time',
//         tags: ['React','TypeScript','CSS'],
//         source: 'demo',
//         postedAt: new Date()
//     }
// ];

// // ================= FETCH FROM ADZUNA =================
// async function fetchFromAdzuna({ q, location, page = 1, limit = 20 }) {

//     const appId = process.env.ADZUNA_APP_ID;
//     const appKey = process.env.ADZUNA_APP_KEY;
//     const country = process.env.ADZUNA_COUNTRY || 'us';

//     // if keys missing → fallback
//     if (!appId || !appKey) {
//         console.log("Adzuna keys missing");
//         return null;
//     }

//     try {
//         const params = new URLSearchParams({
//             app_id: appId,
//             app_key: appKey,
//             results_per_page: limit,
//             what: q || "developer",
//             where: location || ""
//         });

//         const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`;

//         console.log("FINAL URL:", url);

//         const { data } = await axios.get(url, { timeout: 8000 });

//         const jobs = (data.results || []).map(j => ({
//             id: j.id,
//             title: j.title,
//             company: j.company?.display_name || 'Unknown Company',
//             location: j.location?.display_name || location || 'Remote',
//             description: j.description || '',
//             applyUrl: j.redirect_url || '#',
//             salary: {
//                 min: Math.round(j.salary_min || 0),
//                 max: Math.round(j.salary_max || 0),
//                 currency: 'USD'
//             },
//             jobType: j.contract_type === 'permanent'
//                 ? 'full-time'
//                 : (j.contract_type || 'full-time'),
//             tags: j.category?.tag ? [j.category.tag] : [],
//             source: 'adzuna',
//             postedAt: j.created ? new Date(j.created) : new Date()
//         }));

//         return { jobs, total: data.count || jobs.length };

//     } catch (err) {
//         console.log("ADZUNA ERROR:", err.response?.data || err.message);
//         return null;
//     }
// }

// // ================= SEARCH =================
// async function search({ q, location, page = 1, limit = 20, type }) {

//     const adzunaResult = await fetchFromAdzuna({ q, location, page, limit });

//     if (adzunaResult) {
//         return {
//             jobs: adzunaResult.jobs,
//             total: adzunaResult.total,
//             source: 'adzuna'
//         };
//     }

//     // fallback mock filter
//     let filtered = mockJobs;

//     if (q) {
//         const lower = q.toLowerCase();
//         filtered = filtered.filter(j =>
//             j.title.toLowerCase().includes(lower)
//         );
//     }

//     if (location) {
//         const lower = location.toLowerCase();
//         filtered = filtered.filter(j =>
//             j.location.toLowerCase().includes(lower)
//         );
//     }

//     if (type) {
//         filtered = filtered.filter(j => j.jobType === type);
//     }

//     const start = (page - 1) * limit;

//     return {
//         jobs: filtered.slice(start, start + limit),
//         total: filtered.length,
//         source: 'demo'
//     };
// }

// // ================= GET BY ID =================
// async function getById(id) {
//     return mockJobs.find(j => j.id === id) || null;
// }

// module.exports = { search, getById };