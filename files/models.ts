// Updated models - REPLACE frontend/src/app/models/models.ts

export interface Subject {
  subject_name: string;
  subject_code: string;
  marks: number;
  max_marks: number;
  credit: number;
  percentage?: number;
  grade?: string;
  grade_point?: number;
  result?: string;
}

export interface Semester {
  semesterNumber: number;
  subjects: Subject[];
  sgpa: number;
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  backlogs: number;
  subjectsCleared: number;
}

export interface Student {
  _id: string;
  studentId: string;
  name: string;
  attendance: number;
  remarks: string;
  marks: Record<string, number>;   // kept for backward compat
  average: number;
  grade: string;
  status: string;
  // Multi-semester fields
  semesters: Semester[];
  cgpa: number;
  totalBacklogs: number;
  overallPercentage: number;
}

export interface DashboardData {
  totalStudents: number;
  classAverage: number;
  avgAttendance: number;
  atRisk: number;
  avgCgpa: number;
  subjectAverages: Record<string, number>;
  gradeDistribution: Record<string, number>;
  topStudents: Partial<Student>[];
  atRiskStudents: Partial<Student>[];
}

export interface StudentAnalytics {
  student: Student;
  rank: number;
  percentile: number;
  classAverage: number;
  subjectClassAverages: Record<string, number>;
  sgpaTrend: { semester: number; sgpa: number }[];
}

export interface AuthResponse {
  token: string;
  name: string;
  role: string;
}

export interface UploadResponse {
  message: string;
  inserted: number;
  updated: number;
  errors: string[];
}
