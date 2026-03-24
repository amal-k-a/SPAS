import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student, DashboardData, StudentAnalytics, UploadResponse } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStudents(search = '', status = ''): Observable<Student[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<Student[]>(`${this.apiUrl}/students/`, { params });
  }

  getStudent(id: string): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/students/${id}`);
  }

  createStudent(student: Partial<Student>): Observable<Student> {
    return this.http.post<Student>(`${this.apiUrl}/students/`, student);
  }

  updateStudent(id: string, data: Partial<Student>): Observable<any> {
    return this.http.put(`${this.apiUrl}/students/${id}`, data);
  }

  deleteStudent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/students/${id}`);
  }

  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${this.apiUrl}/students/upload`, formData);
  }

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/analytics/dashboard`);
  }

  getStudentAnalytics(id: string): Observable<StudentAnalytics> {
    return this.http.get<StudentAnalytics>(`${this.apiUrl}/analytics/student/${id}`);
  }

  downloadReport(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reports/student/${id}/pdf`, { responseType: 'blob' });
  }
}
