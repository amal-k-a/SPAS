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
- Email verification for first-time account activation
- Password change support using `isFirstLogin`
- Dashboard charts for class average, subject-wise averages, top performers, and at-risk students
- Student directory with search, filtering, and CRUD operations
- Individual student analytics with visualizations
- CSV/Excel upload for bulk student data import
- PDF report generation
- At-risk detection based on marks and attendance

## Authentication Flow

There are two access paths:

1. Existing faculty can sign in with their email and password.
2. First-time faculty can verify their `@kristujayanti.com` email, enter the OTP, and create their own password.

Each user document in MongoDB looks like:

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
- New users must request a verification code before an account is created or activated
- The verification code is time-limited and stored hashed in MongoDB
- OTP emails are sent through SMTP using the sender account configured in the project `.env`
- If `isFirstLogin` is `true`, the user is redirected to change their password before continuing
- After a successful password change, `isFirstLogin` is set to `false`
- Logged-in users can also change their password later from the sidebar

## Creating a User

Use the helper script to create or update a faculty user manually:

```bash
cd backend
python scripts/seed_user.py --email someone@kristujayanti.com --name "Someone" --role teacher --password "ChooseAStrongPassword123!"
```

Available roles:

- `teacher`
- `admin`

## Quick Start

### Prerequisites

- Docker and Docker Compose installed, or
- Python 3.11+, Node.js, npm, and MongoDB installed locally

### Run With Docker Compose

1. Create a root `.env` file with your SMTP credentials.
2. Start the containers.

```bash
cd student-analytics
docker-compose up --build
```

Services:

- Frontend: `http://localhost`
- Backend API: `http://localhost:5000/api`
- MongoDB: `mongodb://localhost:27017/student_analytics`

### Test The OTP Flow

1. Open the frontend at `http://localhost`
2. Go to `First-Time Access`
3. Enter a valid `@kristujayanti.com` email
4. Click `Send Verification Code`
5. Open that inbox and use the OTP received by email
6. Set a new password and complete activation

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
- The backend loads SMTP values from the project root `.env` file when present

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
| POST | `/api/auth/request-verification-code` | Send an OTP to the faculty email address |
| POST | `/api/auth/activate-account` | Verify OTP and create the password for first-time access |
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
| `SMTP_HOST` | empty | SMTP host for verification emails |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USERNAME` | empty | SMTP username |
| `SMTP_PASSWORD` | empty | SMTP password |
| `SMTP_FROM_EMAIL` | empty | Sender email used for OTP mails |
| `SMTP_USE_TLS` | `true` | Enable TLS for SMTP |
| `EMAIL_DEBUG` | `false` | When `true`, OTP is returned in the API response for local testing only |
| `VERIFICATION_TTL_MINUTES` | `10` | OTP validity duration in minutes |
| `FLASK_ENV` | `production` | Flask environment |

### SMTP Setup Example

Create a root `.env` file like:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_USE_TLS=true
EMAIL_DEBUG=false
VERIFICATION_TTL_MINUTES=10
```

If you use Gmail, use an App Password, not your normal Gmail password.

Recommended Gmail setup:

1. Enable `2-Step Verification` on the Gmail account
2. Generate a Gmail `App Password`
3. Use that App Password as `SMTP_PASSWORD`
4. Keep `EMAIL_DEBUG=false` for real email delivery
