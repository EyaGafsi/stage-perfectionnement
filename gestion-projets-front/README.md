# DataPilote - Frontend (Next.js)

This is the frontend application for the DataPilote platform, built with [Next.js](https://nextjs.org/) (App Router), React, and TailwindCSS. It provides a multi-tenant dashboard tailored to 9 different organizational roles.

## 🚀 Running with Docker (Recommended)

The easiest way to run the frontend along with the entire backend and microservices stack is using Docker Compose from the root directory:

```bash
cd ..
docker-compose up -d --build frontend
```
The application will be accessible at `http://localhost:3000`.

## 💻 Running Locally (Development Mode)

If you wish to run the frontend locally using Node.js for development:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your `.env` file (see Environment Variables section below).
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Environment Variables

Create a `.env` file in the root of this directory. When running locally via Docker, these should point to the localhost ports of your Docker containers:

```env
# Local Backend API
NEXT_PUBLIC_NEST_API_URL=http://localhost:3001/api/v1

# Local Python Microservices
NEXT_PUBLIC_AI_task_DURATION_API_URL=http://localhost:8013
NEXT_PUBLIC_AI_DELAY_PREDICTION_API_URL=http://localhost:8006
NEXT_PUBLIC_COST_ESTIMATION_API_URL=http://localhost:8005
NEXT_PUBLIC_AI_Industry_Estimator_API_URL=http://localhost:8011/predict-service
NEXT_PUBLIC_API_Company_searsh_URL=http://localhost:8012
NEXT_PUBLIC_API_Image_generation_URL=http://localhost:8008/generate-image
NEXT_PUBLIC_AI_Indistry_Company_API_URL=http://localhost:8007/find-companies
NEXT_PUBLIC_AI_MARKETING_URL=http://localhost:8010/predict

# Cloudinary configuration (if testing image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 📂 Features
- **Role-Based Views**: Dashboards adapt to Super Admin, Manager, HR Manager, Commercial, Employee, etc.
- **Server-Side Rendering (SSR)** for fast loads and SEO optimization.
- **Real-Time Integration** with 13 independent ML microservices for task estimation, OSINT, and generative AI.
