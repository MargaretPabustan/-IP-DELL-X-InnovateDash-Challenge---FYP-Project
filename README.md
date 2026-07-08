# Boothflow — Final Year Project

**AI-Powered Mobile Lead Capture System**
Republic Polytechnic | Diploma in Information Technology | AY2026

Developed for the Dell Technologies Forum Singapore as part of Dell x InnovateDash Challenge.

---

## Project Background

Traditional lead capture at technology forums relies on manual business card collection and paper forms, resulting in data loss, delayed follow-ups, and missed sales opportunities. Boothflow addresses these pain points by providing a seamless, AI-driven mobile solution that captures, analyses, and acts on leads in real time.

This project was developed as a Final Year Project by a team of four students from the Diploma in Information Technology programme at Republic Polytechnic, with the goal of delivering a production-ready system that demonstrates full-stack development, cloud deployment, and AI integration competencies.

---

## System Overview

Boothflow is a mobile application that enables Dell Technologies booth representatives to scan visitor QR codes, capture lead information, and automatically analyse leads using **Google Gemini 2.5 Flash AI**. The system intelligently assigns a lead status and confidence score, schedules automated follow-up emails, and provides managers with a real-time dashboard for team performance tracking.

---

## Key Features

| Feature | Description |
|---------|-------------|
| QR Code Scanning | Instant lead capture via QR code at the booth |
| AI Lead Analysis | Google Gemini 2.5 Flash analyses customer intent with confidence scoring |
| Rule-Based Fallback | Ensures AI analysis continues even if Gemini API is unavailable |
| Automated Email Follow-ups | Leads receive a follow-up email 3 hours after capture via Brevo |
| Manual Email Scheduling | Managers can override and schedule follow-ups at any time |
| Manager Dashboard | Real-time team lead stats, charts, activity logs and Excel export |
| Role-Based Access Control | Three roles — Rep, Manager, Admin — with JWT authentication |
| Theme System | Four UI themes — Navy, Matcha, Dark, Aurora |
| PDPA Compliance | Personal data handling aligned with Singapore's PDPA guidelines |
| Docker + Kubernetes | Containerised backend deployed on AWS EKS with HPA |
| CI/CD Pipeline | Automated testing and deployment via GitHub Actions |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native, Expo Router, TypeScript |
| Backend | Node.js, Express.js, REST API |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini 2.5 Flash + Rule-Based Fallback |
| Email | Brevo (Transactional Email API) |
| DevOps | Docker, Docker Compose, GitHub Actions CI/CD |
| Orchestration | Kubernetes (AWS EKS), Horizontal Pod Autoscaling |
| Image Registry | GitHub Container Registry (GHCR) |
| Security | JWT, bcrypt, Rate Limiting, Helmet.js, Expo SecureStore |

---

## System Architecture

```
Mobile App (Expo/React Native)
        ↓ REST API (HTTPS)
Backend (Node.js/Express) ──→ Google Gemini 2.5 Flash API
        ↓                 ──→ Brevo Transactional Email
Supabase (PostgreSQL)

CI/CD Pipeline:
GitHub → GitHub Actions → Docker Build → GHCR → AWS EKS (Kubernetes)
```

---

## User Roles

| Role | Capabilities |
|------|-------------|
| Booth Representative | Scan QR codes, capture leads, view own leads, run AI analysis |
| Manager | View team leads, schedule follow-up emails, export reports, view activity logs |
| Administrator | Full system access — manage users, teams, leads, override AI notes |

---

## Testing

The backend is tested using a comprehensive Postman collection:
- **46 test cases** across 7 test folders
- **143 assertions** covering authentication, leads, teams, AI analysis, manager and admin routes
- Automated test execution via GitHub Actions CI/CD on every push to main

Frontend validation testing is covered using **Jest** and `@testing-library/react-native`.

---

## Security

This project implements multiple layers of security including JWT-based authentication, role-based access control, bcrypt password hashing, API rate limiting, Kubernetes security contexts, and PDPA-compliant data handling.

For full details, refer to [SECURITY.md](./SECURITY.md).

---

## Documentation

Full technical details, API documentation, database schema, and setup instructions are available in the **Technical Guide** submitted as part of the project deliverables.

---

## Project Structure

```
fyp-project/
├── app/                    # Expo Router screens
│   ├── auth/               # Login
│   ├── booth/              # Booth Rep screens
│   ├── manager/            # Manager screens
│   └── admin/              # Admin screens
├── src/
│   └── constants/          # Theme system
├── backend/
│   ├── app.js              # Express server + cron job
│   ├── Dockerfile
│   └── docker-compose.yml
├── k8s/
│   └── cluster/            # Kubernetes manifests
└── .github/
    └── workflows/          # CI/CD pipelines
```

---

## Team

| Member | Key Contributions |
|--------|------------------|
| Sahana | Frontend development, AI integration, DevOps, API testing |
| Margaret | Backend routes, database design, authentication, email integration |
| Thanmaee | Backend routes, CI/CD pipeline, email scheduling, SMTP setup |
| Thanushri | Kubernetes deployment, system architecture, project documentation |

---

*Republic Polytechnic — Diploma in Information Technology | AY2025/2026*
*Developed for Dell Technologies Forum Singapore*