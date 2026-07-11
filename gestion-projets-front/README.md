# DataPilote Frontend (Next.js)

## How to Run the Frontend

You can run this Next.js frontend either containerized using Docker (recommended) or manually.

### 🐳 Option 1: Docker (Recommended)

To run the frontend containerized and mapped to port `3000`:
1. Ensure the `./gestion-projets-front/.env` file is configured with the correct API URLs (see below).
2. From the project root directory, run:
   ```bash
   docker-compose up --build -d frontend
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 🛠️ Option 2: Manual Local Setup

To run the Next.js frontend on your local system:

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Configure Environment Variables
Create a `.env` file inside the `gestion-projets-front` directory. Depending on whether you want to point to local services (running in Docker/locally) or production Render URLs, populate the file:

```env
# Local NestJS Backend API
NEXT_PUBLIC_NEST_API_URL=http://localhost:3001/api/v1

# Local Python Microservices Ports (Match docker-compose mapping)
NEXT_PUBLIC_AI_task_DURATION_API_URL=http://localhost:8013
NEXT_PUBLIC_AI_DELAY_PREDICTION_API_URL=http://localhost:8006
NEXT_PUBLIC_COST_ESTIMATION_API_URL=http://localhost:8005
NEXT_PUBLIC_AI_Industry_Estimator_API_URL=http://localhost:8011/predict-service
NEXT_PUBLIC_API_Company_searsh_URL=http://localhost:8012
NEXT_PUBLIC_API_Image_generation_URL=http://localhost:8008/generate-image
NEXT_PUBLIC_AI_Indistry_Company_API_URL=http://localhost:8007/find-companies
NEXT_PUBLIC_AI_MARKETING_URL=http://localhost:8010/predict

# Cloudinary Credentials (Required for image upload features)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### Step 3: Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
