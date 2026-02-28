# hackathon
# AutoApply – Universal Job Application Platform

[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## 🚀 Project Overview

**AutoApply** is a full-stack web application that allows users to create a **single universal job profile** and automatically apply to multiple companies’ job listings. The platform uses AI to:

- Parse resumes
- Detect suitable job roles
- Map profile data to application forms

It integrates with job APIs like **Adzuna** for live listings, and falls back to mock data when API keys are missing.  

---

## 📌 Features

### User Features
- Sign up / login with JWT authentication
- Create and edit a detailed profile (personal info, skills, experience)
- Upload resume for AI parsing
- Automatic job role detection from resume or profile
- Form-fill AI helper for applying to jobs
- Browse and search live job listings
- Filter jobs by title, location, type, and tags
- View detailed job descriptions and apply links

### Admin / Developer Features
- Secure RESTful APIs
- MongoDB database connection
- OpenAI integration for resume parsing and job form-fill
- Adzuna API integration for live job listings
- Mock fallback for demo or development
- Error handling and logging
- CORS setup for frontend connection

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Authentication | JWT |
| AI / ML | OpenAI API (GPT-3.5-turbo) |
| Job Listings | Adzuna API |
| Version Control | Git + GitHub |

---



