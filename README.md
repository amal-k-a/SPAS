# Student Performance Analytics System

A full-stack web application for tracking, managing, and visualizing student academic performance.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 17 + Tailwind CSS |
| Backend | Python 3.11 + Flask |
| Database | MongoDB 7 |
| Charts | Chart.js + ng2-charts |
| Containerization | Docker + Docker Compose |
| Web Server | Nginx (production) |

## Features

- JWT-based faculty login
- Domain-restricted authentication for `@kristujayanti.com`
- First-login password change flow using `isFirstLogin`
- Dashboard charts for class average, subject-wise averages, top performers, and at-risk students
- Student directory with search, filtering, and CRUD operations
- Individual student analytics with visualizations
- CSV/Excel upload for bulk student data import
- PDF report generation
- At-risk detection based on marks and attendance

## Authentication Flow

There is no public signup flow.

Users must already exist in MongoDB in the `users` collection.

Each user document should include fields like:

```json
{
  "email": "faculty@kristujayanti.com",
  "password": "<bcrypt hash>",
  "role": "teacher",
  "isFirstLogin": true,
  "name": "Faculty Name"
}
```

Rules:

- Only users with emails ending in `@kristujayanti.com` are allowed to log in
- A default first-login password such as `welcome123` can be used when the stored hash matches it
- If `isFirstLogin` is `true`, the user is redirected to change their password before continuing
- After a successful password change, `isFirstLogin` is set to `false`
- Logged-in users can also change their password later from the sidebar

## Creating a User

Use the helper script to create or update a faculty user:

```bash
cd backend
python scripts/seed_user.py --email someone@kristujayanti.com --name "Someone" --role teacher --password welcome123 --first-login
```

Available roles:

- `teacher`
- `admin`

## Quick Start

### Prerequisites

- Docker and Docker Compose installed, or
- Python 3.11+, Node.js, npm, and MongoDB installed locally

### Run With Docker Compose

```bash
cd student-analytics
docker-compose up --build
```

Services:

- Frontend: `http://localhost`
- Backend API: `http://localhost:5000/api`
- MongoDB: `mongodb://localhost:27017/student_analytics`

## Development Without Docker

### Backend

```bash
cd backend
pip install -r requirements.txt
MONGO_URI=mongodb://localhost:27017/student_analytics PORT=5001 python app.py
```

Notes:

- The Flask app reads the port from `PORT`
- Local development is configured to use port `5001`
- This helps avoid conflicts with stale services already bound to `5000`

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

Then open:

- Frontend: `http://localhost:4200`

In local development, Angular uses:

- API base URL: `http://localhost:5001/api`

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email and password |
| POST | `/api/auth/change-password` | Change the current user's password |
| GET | `/api/auth/verify` | Verify JWT token |

### Students

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students/` | List all students with optional filters |
| POST | `/api/students/` | Create a student |
| GET | `/api/students/:id` | Get student by ID |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
| POST | `/api/students/upload` | Upload CSV or Excel file |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Class-wide analytics |
| GET | `/api/analytics/student/:id` | Individual student analytics |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/student/:id/pdf` | Download PDF report |

## CSV/Excel Format

```csv
student_id,name,attendance,math,science,english,remarks
STU001,Alice,92,88,76,91,Great student
STU002,Bob,70,55,60,65,
```

Rules:

- `student_id` and `name` are required
- `attendance` should be a percentage from 0 to 100
- Any extra subject columns are treated as marks
- Re-uploading an existing student updates that record

## At-Risk Rules

A student is marked as `At Risk` if:

- average marks are below `40`, or
- attendance is below `75`

## Project Structure

```text
student-analytics/
|-- backend/
|   |-- app.py
|   |-- config.py
|   |-- database.py
|   |-- routes/
|   |   |-- auth.py
|   |   |-- students.py
|   |   |-- analytics.py
|   |   `-- reports.py
|   |-- scripts/
|   |   `-- seed_user.py
|   |-- utils/
|   |   `-- auth_middleware.py
|   |-- requirements.txt
|   `-- Dockerfile
|-- frontend/
|   |-- src/
|   |   `-- app/
|   |       |-- components/
|   |       |-- guards/
|   |       |-- models/
|   |       |-- pages/
|   |       |   |-- login/
|   |       |   |-- change-password/
|   |       |   |-- dashboard/
|   |       |   |-- students/
|   |       |   |-- student-detail/
|   |       |   `-- upload/
|   |       `-- services/
|   |-- src/environments/
|   |-- nginx.conf
|   `-- Dockerfile
|-- docker-compose.yml
|-- sample_data.csv
`-- README.md
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://mongo:27017/student_analytics` | MongoDB connection string |
| `PORT` | `5000` | Flask server port |
| `SECRET_KEY` | development fallback key | JWT signing secret |
| `FLASK_ENV` | `production` | Flask environment |
