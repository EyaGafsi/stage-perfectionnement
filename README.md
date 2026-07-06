# DataPilote 🚀

> Intelligent Multi-Company Platform integrating Machine Learning, NLP & Generative AI

![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![NestJS](https://img.shields.io/badge/NestJS-10+-red)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌐 Live Demo

**👉 [https://gestion-projets-front-zehe.vercel.app](https://gestion-projets-front-zehe.vercel.app)**

> The platform is fully deployed and accessible. No installation required to use it.

---

## 🎯 What is DataPilote?

DataPilote is a full-stack intelligent multi-tenant web platform that centralizes and automates business processes across multiple companies within a single unified interface. It integrates **Machine Learning**, **NLP**, and **Generative AI** across 7 functional modules and 12 independent FastAPI microservices.

Built during a 6-month internship at **3LM Solutions** (Tunis, Tunisia) as a Master's final year project in Data Science at **ISLAIB, University of Jendouba**.

---

## 🤗 Hugging Face Models & Spaces

| Asset | Type | Link |
|---|---|---|
| Industry Recommendation Model | Fine-tuned Sentence-Transformer | [Traii/predictindustryforcallcenter](https://huggingface.co/Traii/predictindustryforcallcenter) |
| Industry Prediction API | HF Space (Gradio) | [Traii/predict-industry-api](https://huggingface.co/spaces/Traii/predict-industry-api) |
| Prompt Enrichment Model | Fine-tuned GPT-2 | [amin1221/enrechirprompt](https://huggingface.co/spaces/amin1221/enrechirprompt) |
| OSINT Search Engine | HF Space (Gradio) | [themedworld/searchcompany](https://huggingface.co/spaces/themedworld/searchcompany) |

---

## 🏗️ Deployed Services

| Service | URL |
|---|---|
| **Frontend** | [https://gestion-projets-front-zehe.vercel.app](https://gestion-projets-front-zehe.vercel.app) |
| **Backend API** | https://project-back-b865.onrender.com/api/v1 |
| **IT Task Duration** | https://taskhoursestimator.onrender.com |
| **IT Project Cost** | https://costestimator-1ro4.onrender.com |
| **Call Center Task Duration** | https://callcenter-task-duration-estimator.onrender.com |
| **Call Center Project Cost** | https://callcenter-project-cost-estimator.onrender.com |
| **Marketing Task Duration** | https://marketing-task-estimator-api.onrender.com |
| **Marketing Project Cost** | https://marketing-project-cost.onrender.com |
| **CV Parsing** | https://resume-parsing.onrender.com |
| **Candidate Scoring** | https://concditascore.onrender.com |
| **OSINT Search** | https://search-company-xc9u.onrender.com |
| **Domain to Companies** | https://domaintocompany.onrender.com |
| **Industry Prediction** | https://predict-indistry.onrender.com |
| **Image Generation** | https://imagegeneration-vwcn.onrender.com |

---

## 👤 How to Use the Platform

### Step 1 — Open the app
Go to **[https://gestion-projets-front-zehe.vercel.app](https://gestion-projets-front-zehe.vercel.app)**

### Step 2 — Login with your role

The platform has 9 roles. Each role has its own dashboard and features:

| Role | What you can do |
|---|---|
| **Super Admin** | Create companies, manage all users across all companies, view global stats |
| **Admin Company** | Manage users within your company, assign roles |
| **Manager** | Create projects (IT / Call Center / Marketing), assign to Project Managers |
| **Project Manager** | Create sprints, add tasks, assign to team members, view ML cost & duration estimates |
| **HR Manager** | View employee scores, analyze HR departures, post job offers, review candidates |
| **Commercial** | Run OSINT scraping on target companies, get industry recommendations |
| **Marketing Agent** | Generate marketing images using AI (Simple or Enriched mode) |
| **Employee** | View your assigned tasks, check your score and training recommendations |
| **Candidate** | Browse job offers, submit your CV, receive your compatibility score |

### Step 3 — Navigate to your module

Each role sees only the modules relevant to them. Here is a full overview:

---

## ✨ Modules

### Module 1 — Multi-Domain Project Management
**Who uses it:** Manager, Project Manager, Employee

- Manager creates a project and selects the domain: **IT**, **Call Center**, or **Marketing**
- Project Manager structures the project into sprints and tasks
- Each task is assigned to a team member with a deadline and complexity level
- The platform automatically calculates sprint progress and detects delayed tasks
- ML estimates task duration and project cost in real time

### Module 2 — Employee Scoring & HR Analytics
**Who uses it:** HR Manager, Employee

- Each employee receives an automatic score (0–120) based on:
  - Delivery delay (adjusted for rejections)
  - Number of rejections by the Project Manager
  - Quality of first render
- Grades from **A+** (≥110) to **F** (<35)
- HR Manager can add a manual note per employee
- Statistical analysis of HR departures (churn): distribution, correlations, synthetic risk profiles
- Employees with high average delays receive automatic training recommendations

### Module 3 — ML-Based Duration & Cost Estimation
**Who uses it:** Project Manager

- 6 independent models: **3 domains × 2 estimators** (task duration + project cost)
- Input the task parameters → get an estimated duration in hours
- The platform aggregates all task estimates to compute the total project cost and duration

| Domain | Estimator | Algorithm | R² |
|---|---|---|---|
| Call Center | Task Duration | XGBoost | 0.9912 |
| Call Center | Project Cost | XGBoost | 0.9953 |
| Marketing | Task Duration | XGBoost | 0.9943 |
| Marketing | Project Cost | XGBoost | 0.9995 |
| IT | Task Duration | Random Forest | 0.9874 |
| IT | Project Cost | XGBoost | 0.9954 |

### Module 4 — Intelligent Recruitment
**Who uses it:** HR Manager, Candidate

- HR Manager posts a job offer with required skills and experience
- Candidate submits their CV (PDF format)
- The platform automatically extracts: years of experience, technical skills, soft skills, education level
- A compatibility score is calculated across 4 dimensions:
  - Experience (35%) + Skills (30%) + Education (20%) + Level (15%)
- Candidates are ranked by score in the HR dashboard
- Candidates with score ≥ 70 are flagged as highly compatible

### Module 5 — OSINT Scraping & Commercial Prospecting
**Who uses it:** Commercial

- Enter a company name (and optionally target roles)
- The platform automatically:
  1. Finds the official domain
  2. Scrapes social media links (LinkedIn, Facebook, Instagram)
  3. Extracts emails and phone numbers from the website
  4. Discovers employee LinkedIn profiles
  5. Validates emails via MX record verification
  6. Confirms employee profiles via CrossEncoder semantic scoring
- Results include employees with reliability-scored emails (color coded: green ≥ 80, orange ≥ 60, red < 60)

### Module 6 — Industry Recommendation
**Who uses it:** Commercial

- **Industry Prediction tab**: enter a service description → get Top-3 most compatible industries with confidence scores
- **Company Finder tab**: enter an activity domain + country → get a list of matching LinkedIn companies

### Module 7 — Marketing Agent
**Who uses it:** Marketing Agent

- **Simple mode**: enter a short prompt → image generated directly by FLUX.1-schnell
- **Enriched mode**: the prompt is first enhanced by the fine-tuned GPT-2 model, then sent to FLUX.1-schnell
- Both images are displayed side by side for comparison
- Download the final image directly from the interface

---

## 🛠️ Local Installation

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL
- MongoDB

---

### 1. Frontend (Next.js)

```bash
git clone https://github.com/themedworld/gestion-projets-front.git
cd gestion-projets-front
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_NEST_API_URL=https://project-back-b865.onrender.com/api/v1
NEXT_PUBLIC_AI_task_DURATION_API_URL=https://taskhoursestimator.onrender.com
NEXT_PUBLIC_AI_Industry_Estimator_API_URL=https://predict-indistry.onrender.com/predict-service
NEXT_PUBLIC_COST_ESTIMATION_API_URL=https://costestimator-1ro4.onrender.com
NEXT_PUBLIC_API_Company_searsh_URL=https://search-company-xc9u.onrender.com
NEXT_PUBLIC_API_Image_generation_URL=https://imagegeneration-vwcn.onrender.com/generate-image
NEXT_PUBLIC_AI_Indistry_Company_API_URL=https://domaintocompany.onrender.com/find-companies
NEXT_PUBLIC_AI_MARKETING_URL=https://marketing-task-estimator-api.onrender.com/predict
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GOOGLE_SERVICE_ACCOUNT_KEY=your_base64_google_service_account_key
```

```bash
npm run dev
# → http://localhost:3000
```

---

### 2. Backend (NestJS)

```bash
git clone https://github.com/themedworld/project_back.git
cd project_back
npm install
```

Create `.env`:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
ACCESS_TOKEN_SECRET_KEY=your_jwt_secret
ACCESS_TOKEN_EXPIRE_TIME=7d
REDIS_PORT=6379
REDIS_HOST=localhost
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
```

```bash
npm run start:dev
# → http://localhost:3001
```

---

### 3. API Microservices (FastAPI)

Each microservice is independent. Example with CV parsing:

```bash
git clone https://github.com/themedworld/Resume_parsing.git
cd Resume_parsing
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Repeat for each microservice on a different port.

---

## 📁 Repository Structure

```
DataPilote/
│
├── gestion-projets-front/                   # Next.js 14+ Frontend
├── backend-gestion-projets/                 # NestJS Backend
│
└── API/
    ├── cv_parsing_microservice/             # PDF → structured profile
    ├── candidate_scoring_microservice/      # CV × job offer semantic score
    ├── search_company_info_employees/       # OSINT scraping
    ├── search_companies_by_domain/          # LinkedIn company finder
    ├── predict_industry_for_service/        # Industry recommendation
    ├── image_generation_microservice/       # FLUX.1-schnell image gen
    ├── it_task_duration_estimator/          # Random Forest
    ├── it_project_cost_estimator/           # XGBoost
    ├── callcenter_task_duration_estimator/  # XGBoost
    ├── callcenter_project_cost_estimator/   # XGBoost
    ├── marketing_task_duration_estimator/   # XGBoost
    └── marketing_project_cost_model/        # XGBoost
```

---

## 🔐 Security & Multi-Tenancy

- Authentication via **JWT** (stored in HTTP-only cookies)
- **RBAC** — each role sees only its own modules and data
- **Multi-tenant isolation** — every entity is scoped to a `company_id`
- `TenantGuard` in NestJS automatically injects `company_id` on every request
- Cross-tenant access returns HTTP 403

---

## ⚠️ Important Notes

- The platform is hosted on **Render free tier** — microservices may take **30–60 seconds to wake up** on first request after inactivity. This is normal behavior.
- The frontend is hosted on **Vercel** and is always available instantly.
- All AI features (scoring, image generation, OSINT) depend on the microservices being awake. If a feature seems slow on first use, wait a moment and retry.

---

## 🎓 Academic Context

| | |
|---|---|
| **Author** | Mohamed Amin Traii |
| **Degree** | Mastère Professionnel — Data Science |
| **Institution** | ISLAIB — Université de Jendouba |
| **Academic Supervisor** | M. Mohamed Kharrat |
| **Professional Supervisor** | Mme. Lilia Aouani |
| **Host Organization** | 3LM Solutions, Tunis, Tunisia |
| **Academic Year** | 2025 – 2026 |

---

## 📄 License

This project is licensed under the MIT License.
