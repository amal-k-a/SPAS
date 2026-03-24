# Student Performance Analytics System

A full-stack web application for tracking and analyzing student academic performance.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17 + Tailwind CSS |
| Backend | Python 3.11 + Flask |
| Database | MongoDB 7 |
| Containerization | Docker + Docker Compose |
| Web Server | Nginx (production) |

## Features

- **Authentication** — JWT-based login for teachers and admins
- **Dashboard** — Visual analytics: grade distribution, subject averages, at-risk alerts
- **Student Management** — Full CRUD with search and status filtering
- **Bulk Upload** — Import students via Excel (.xlsx) or CSV files
- **Performance Analysis** — Per-student comparison vs class averages, percentile, rank
- **PDF Reports** — Downloadable performance reports with charts and teacher remarks
- **At-Risk Detection** — Auto-flags students with avg < 40% or attendance < 75%

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Ports 80, 5000, 27017 available

### Run with Docker Compose

```bash
# Clone / navigate to project
cd student-analytics

# Build and start all services
docker-compose up --build

# App will be available at:
# Frontend: http://localhost
# Backend API: http://localhost:5000/api
```

### Demo Login
| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher@school.com | anypassword |
| Admin | admin@school.com | anypassword |

> First login auto-creates the account.

## Project Structure

```
student-analytics/
├── backend/
│   ├── app.py              # Flask app factory
│   ├── config.py           # Configuration
│   ├── database.py         # MongoDB connection
│   ├── routes/
│   │   ├── auth.py         # Login/verify endpoints
│   │   ├── students.py     # CRUD + file upload
│   │   ├── analytics.py    # Dashboard & student analytics
│   │   └── reports.py      # PDF report generation
│   ├── utils/
│   │   └── auth_middleware.py  # JWT decorator
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── pages/
│   │       │   ├── login/          # Login page
│   │       │   ├── dashboard/      # Analytics dashboard
│   │       │   ├── students/       # Student list + CRUD
│   │       │   ├── student-detail/ # Individual profile
│   │       │   └── upload/         # File upload
│   │       ├── components/
│   │       │   └── sidebar/        # Navigation sidebar
│   │       ├── services/
│   │       │   ├── auth.service.ts
│   │       │   ├── student.service.ts
│   │       │   └── auth.interceptor.ts
│   │       └── models/models.ts
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml
├── sample_data.csv         # Test data to upload
└── README.md
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login with email/password |
| GET | /api/auth/verify | Verify JWT token |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/students/ | List all students (filterable) |
| POST | /api/students/ | Create student |
| GET | /api/students/:id | Get student by ID |
| PUT | /api/students/:id | Update student |
| DELETE | /api/students/:id | Delete student |
| POST | /api/students/upload | Upload CSV/Excel file |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/dashboard | Class-wide analytics |
| GET | /api/analytics/student/:id | Individual student analytics |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports/student/:id/pdf | Download PDF report |

## CSV/Excel Format

```csv
student_id,name,attendance,math,science,english,remarks
STU001,Alice,92,88,76,91,Great student
STU002,Bob,70,55,60,65,
```

- `student_id` and `name` are **required**
- `attendance` is a percentage (0-100)
- Any column that isn't `student_id`, `name`, `attendance`, or `remarks` is treated as a **subject**
- Existing students are **updated** on re-upload (matched by `student_id`)

## At-Risk Rules

A student is flagged as **At Risk** if:
- Average marks < 40%, OR
- Attendance < 75%

## Development (without Docker)

### Backend
```bash
cd backend
pip install -r requirements.txt
MONGO_URI=mongodb://localhost:27017/student_analytics python app.py
```

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
ng serve
# Visit http://localhost:4200
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| MONGO_URI | mongodb://mongo:27017/student_analytics | MongoDB connection string |
| SECRET_KEY | (dev key) | JWT signing secret — **change in production** |
| FLASK_ENV | production | Flask environment |
