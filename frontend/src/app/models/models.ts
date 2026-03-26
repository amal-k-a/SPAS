export interface Student {
  _id: string;
  studentId: string;
  name: string;
  marks: Record<string, number>;
  attendance: number;
  remarks: string;
  average?: number;
  status?: 'Excellent' | 'Good' | 'Average' | 'At Risk';
  grade?: string;
}

export interface DashboardData {
  totalStudents: number;
  atRisk: number;
  classAverage: number;
  avgAttendance: number;
  gradeDistribution: Record<string, number>;
  subjectAverages: Record<string, number>;
  statusDistribution: Record<string, number>;
  topStudents: Student[];
  atRiskStudents: Student[];
}

export interface StudentAnalytics {
  student: Student;
  classAverage: number;
  subjectClassAverages: Record<string, number>;
  rank: number;
  totalStudents: number;
  percentile: number;
}

export interface AuthResponse {
  token: string;
  name: string;
  role: string;
  email: string;
  isFirstLogin: boolean;
}

export interface VerificationCodeResponse {
  message: string;
  expiresInMinutes: number;
  debugCode?: string;
}

export interface UploadResponse {
  message: string;
  inserted: number;
  updated: number;
  errors: string[];
}
