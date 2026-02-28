const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const OpenAI = require('openai');

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Extract raw text from PDF or DOCX buffer
async function extractText(file) {
    const mimeType = file.mimetype;

    if (mimeType === 'application/pdf') {
        const data = await pdfParse(file.buffer);
        return data.text;
    } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
    ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value;
    }
    throw new Error('Unsupported file type');
}

// Mock parser - extracts some basic info with regex when no OpenAI key
function mockParse(text) {
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,})/);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Extract skills by looking for common tech keywords
    const skillKeywords = [
        'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'MongoDB', 'TypeScript',
        'HTML', 'CSS', 'Docker', 'AWS', 'Git', 'Express', 'Vue', 'Angular', 'Next.js',
        'PostgreSQL', 'MySQL', 'Redis', 'Kubernetes', 'GraphQL', 'REST API', 'C++', 'C#',
        'Go', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Flutter', 'TensorFlow', 'Machine Learning'
    ];
    const foundSkills = skillKeywords.filter(s => text.includes(s));

    return {
        personal: {
            firstName: lines[0]?.split(' ')[0] || '',
            lastName: lines[0]?.split(' ').slice(1).join(' ') || '',
            phone: phoneMatch ? phoneMatch[1].trim() : '',
            email: emailMatch ? emailMatch[0] : '',
            summary: lines.slice(0, 3).join(' ')
        },
        skills: foundSkills,
        rawText: text.slice(0, 2000),
        mock: true,
        message: 'Set OPENAI_API_KEY for full AI-powered parsing'
    };
}

async function parse(file) {
    const text = await extractText(file);

    if (!openai) {
        return mockParse(text);
    }

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: `You are an expert resume parser. Extract all information from the resume text and return valid JSON with this structure:
{
  "personal": {
    "firstName": "", "lastName": "", "phone": "", "email": "",
    "address": "", "city": "", "state": "", "country": "",
    "linkedin": "", "github": "", "portfolio": "", "summary": ""
  },
  "education": [{ "institution": "", "degree": "", "field": "", "startYear": "", "endYear": "", "gpa": "" }],
  "experience": [{ "company": "", "title": "", "location": "", "startDate": "", "endDate": "", "current": false, "description": "" }],
  "skills": [],
  "certifications": [{ "name": "", "issuer": "", "year": "" }],
  "languages": []
}`
            },
            {
                role: 'user',
                content: `Parse this resume:\n\n${text.slice(0, 6000)}`
            }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    parsed.rawText = text;
    return parsed;
}

module.exports = { parse };
