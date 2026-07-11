# DataPilote - Backend (NestJS)

This is the backend API for the DataPilote platform, built with [NestJS](https://nestjs.com/). It handles authentication, role-based access control, database operations with PostgreSQL and MongoDB, and serves as the main orchestrator for the platform's frontend.

## 🚀 Running with Docker (Recommended)

The easiest way to run this backend along with its databases and microservices is from the root of the project using Docker Compose:

```bash
cd ..
docker-compose up -d --build backend
```
This will start the PostgreSQL, MongoDB, and NestJS backend automatically. The API will be available at `http://localhost:3001/api/v1`.

## 💻 Running Locally (Development Mode)

If you prefer to run the backend natively without Docker:

1. Ensure you have **PostgreSQL** and **MongoDB** running locally.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file (see below).
4. Run the development server:
   ```bash
   npm run start:dev
   ```

## ⚙️ Environment Variables

Create a `.env` file in the root of this directory:

```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/datapilote
MONGO_URI=mongodb://127.0.0.1:27017/datapilote
ACCESS_TOKEN_SECRET_KEY=your_jwt_secret_key
ACCESS_TOKEN_EXPIRE_TIME=7d
```

## 🔐 Security
- Authentication is handled via JWT (stored in HTTP-only cookies).
- Multi-tenancy is enforced via a `TenantGuard` which validates the user's `company_id`.
