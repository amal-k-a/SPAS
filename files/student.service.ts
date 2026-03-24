// Updated student service - REPLACE frontend/src/app/services/student.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student, DashboardData, StudentAnalytics, UploadResponse, Semester } from '../models/models';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private api = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // ── Students ──────────────────────────────
  getStudents(search = '', status = ''): Observable<Student[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<Student[]>(`${this.api}/students/`, { params });
  }

  getStudent(id: string): Observable<Student> {
    return this.http.get<Student>(`${this.api}/students/${id}`);
  }

  createStudent(data: Partial<Student>): Observable<Student> {
    return this.http.post<Student>(`${this.api}/students/`, data);
  }

  updateStudent(id: string, data: Partial<Student>): Observable<Student> {
    return this.http.put<Student>(`${this.api}/students/${id}`, data);
  }

  deleteStudent(id: string): Observable<any> {
    return this.http.delete(`${this.api}/students/${id}`);
  }

  // ── Semesters ─────────────────────────────
  getSemesters(studentId: string): Observable<{ semesters: Semester[]; cgpa: number; totalBacklogs: number; overallPercentage: number }> {
    return this.http.get<any>(`${this.api}/students/${studentId}/semesters`);
  }

  addSemester(studentId: string, semesterData: { semesterNumber: number; subjects: any[] }): Observable<Student> {
    return this.http.post<Student>(`${this.api}/students/${studentId}/semesters`, semesterData);
  }

  // ── Analytics ─────────────────────────────
  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.api}/analytics/dashboard`);
  }

  getStudentAnalytics(id: string): Observable<StudentAnalytics> {
    return this.http.get<StudentAnalytics>(`${this.api}/analytics/student/${id}`);
  }

  // ── Upload ────────────────────────────────
  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${this.api}/students/upload`, formData);
  }

  // ── Reports ───────────────────────────────
  downloadReport(id: string): Observable<Blob> {
    return this.http.get(`${this.api}/reports/${id}`, { responseType: 'blob' });
  }
}
