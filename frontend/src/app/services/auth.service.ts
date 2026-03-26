import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { AuthResponse, VerificationCodeResponse } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  isLoggedIn$ = this.loggedIn.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => this.persistAuth(res))
    );
  }

  requestVerificationCode(email: string): Observable<VerificationCodeResponse> {
    return this.http.post<VerificationCodeResponse>(`${this.apiUrl}/request-verification-code`, { email });
  }

  activateAccount(email: string, code: string, password: string, name: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/activate-account`, { email, code, password, name }).pipe(
      tap(res => this.persistAuth(res))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/change-password`, { currentPassword, newPassword }).pipe(
      tap(res => this.persistAuth(res))
    );
  }

  logout(): void {
    localStorage.clear();
    this.loggedIn.next(false);
  }

  hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  getUserName(): string {
    return localStorage.getItem('userName') || 'User';
  }

  getRole(): string {
    return localStorage.getItem('userRole') || '';
  }

  isFirstLogin(): boolean {
    return localStorage.getItem('isFirstLogin') === 'true';
  }

  private persistAuth(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('userName', res.name);
    localStorage.setItem('userRole', res.role);
    localStorage.setItem('userEmail', res.email);
    localStorage.setItem('isFirstLogin', String(res.isFirstLogin));
    this.loggedIn.next(true);
  }
}
