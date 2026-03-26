import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4 relative overflow-hidden">
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-yellow-100/50 blur-[100px] rounded-full"></div>
      <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-gray-200/50 blur-[100px] rounded-full"></div>

      <div class="w-full max-w-md relative z-10">
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-[#1C1C1C] rounded-[2.5rem] mb-6 shadow-xl shadow-black/10">
            <svg class="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <h1 class="text-4xl font-black text-[#1C1C1C] tracking-tight">Student Analytics</h1>
          <p class="text-gray-500 mt-2 text-sm font-medium italic">Faculty portal for performance management</p>
        </div>

        <div class="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-10">
          <div class="flex bg-gray-50 rounded-2xl p-1 mb-8">
            <button
              type="button"
              (click)="setMode('login')"
              [class]="mode === 'login' ? activeTabClass : inactiveTabClass"
            >
              Sign In
            </button>
            <button
              type="button"
              (click)="setMode('activate')"
              [class]="mode === 'activate' ? activeTabClass : inactiveTabClass"
            >
              First-Time Access
            </button>
          </div>

          <h2 class="text-2xl font-bold text-[#1C1C1C] mb-8">
            {{ mode === 'login' ? 'Sign In' : 'Verify Email & Activate' }}
          </h2>

          <div *ngIf="error" class="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-red-600 text-sm flex items-center gap-3">
            <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
            </svg>
            <span class="font-medium">{{ error }}</span>
          </div>

          <div *ngIf="success" class="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 text-emerald-700 text-sm">
            <span class="font-medium">{{ success }}</span>
          </div>

          <div *ngIf="mode === 'login'" class="space-y-6">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Email Address</label>
              <input type="email" [(ngModel)]="loginEmail" placeholder="faculty@kristujayanti.com"
                class="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-300"
                (keyup.enter)="login()">
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Password</label>
              <input type="password" [(ngModel)]="loginPassword" placeholder="Enter your password"
                class="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-300"
                (keyup.enter)="login()">
            </div>

            <button (click)="login()" [disabled]="loading"
              class="w-full bg-[#1C1C1C] hover:bg-black disabled:opacity-50 text-white font-bold py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 mt-4 shadow-lg shadow-black/5 hover:shadow-black/10 hover:scale-[1.01] active:scale-[0.98]">
              <span *ngIf="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ loading ? 'Authenticating...' : 'Sign In' }}
            </button>
          </div>

          <div *ngIf="mode === 'activate'" class="space-y-6">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Faculty Name</label>
              <input type="text" [(ngModel)]="activationName" placeholder="Enter your name"
                class="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-300">
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Email Address</label>
              <input type="email" [(ngModel)]="activationEmail" placeholder="faculty@kristujayanti.com"
                class="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-300">
            </div>

            <button (click)="requestCode()" [disabled]="sendingCode"
              class="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-[#1C1C1C] font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3">
              <span *ngIf="sendingCode" class="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
              {{ sendingCode ? 'Sending Code...' : 'Send Verification Code' }}
            </button>

            <div *ngIf="debugCode" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Debug verification code: <span class="font-bold">{{ debugCode }}</span>
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Verification Code</label>
              <input type="text" [(ngModel)]="verificationCode" placeholder="6-digit code"
                class="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm tracking-[0.3em] focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-300">
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Create Password</label>
              <input type="password" [(ngModel)]="activationPassword" placeholder="Minimum 8 characters"
                class="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-300"
                (keyup.enter)="activateAccount()">
            </div>

            <button (click)="activateAccount()" [disabled]="activating"
              class="w-full bg-[#1C1C1C] hover:bg-black disabled:opacity-50 text-white font-bold py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 mt-4 shadow-lg shadow-black/5 hover:shadow-black/10 hover:scale-[1.01] active:scale-[0.98]">
              <span *ngIf="activating" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ activating ? 'Activating...' : 'Verify & Continue' }}
            </button>
          </div>

          <div class="mt-10 p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
            <p class="text-[10px] font-black text-[#1C1C1C] uppercase tracking-widest mb-3">Access Rules</p>
            <div class="space-y-2 text-xs text-gray-500">
              <p>Only users with a <span class="font-semibold text-[#1C1C1C]">&#64;kristujayanti.com</span> email can sign in.</p>
              <p>First-time users must verify their email and set a personal password before accessing the dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  mode: 'login' | 'activate' = 'login';
  loginEmail = '';
  loginPassword = '';
  activationName = '';
  activationEmail = '';
  verificationCode = '';
  activationPassword = '';
  loading = false;
  sendingCode = false;
  activating = false;
  error = '';
  success = '';
  debugCode = '';
  readonly activeTabClass = 'w-1/2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#1C1C1C] shadow-sm transition-all';
  readonly inactiveTabClass = 'w-1/2 rounded-xl px-4 py-3 text-sm font-bold text-gray-500 transition-all';

  constructor(private authService: AuthService, private router: Router) {}

  setMode(mode: 'login' | 'activate') {
    this.mode = mode;
    this.error = '';
    this.success = '';
  }

  login() {
    if (!this.loginEmail || !this.loginPassword) {
      this.error = 'Please enter email and password';
      return;
    }

    if (!this.isAllowedEmail(this.loginEmail)) {
      this.error = 'Please use your @kristujayanti.com email address';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.login(this.loginEmail, this.loginPassword).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Login failed. Please try again.';
      }
    });
  }

  requestCode() {
    if (!this.activationEmail) {
      this.error = 'Please enter your email address';
      return;
    }

    if (!this.isAllowedEmail(this.activationEmail)) {
      this.error = 'Please use your @kristujayanti.com email address';
      return;
    }

    this.sendingCode = true;
    this.error = '';
    this.success = '';
    this.debugCode = '';

    this.authService.requestVerificationCode(this.activationEmail).subscribe({
      next: (res) => {
        this.sendingCode = false;
        this.success = `${res.message} It expires in ${res.expiresInMinutes} minutes.`;
        this.debugCode = res.debugCode || '';
      },
      error: (err) => {
        this.sendingCode = false;
        this.error = err.error?.error || 'Could not send verification code.';
      }
    });
  }

  activateAccount() {
    if (!this.activationEmail || !this.verificationCode || !this.activationPassword) {
      this.error = 'Please enter your email, verification code, and new password';
      return;
    }

    if (!this.isAllowedEmail(this.activationEmail)) {
      this.error = 'Please use your @kristujayanti.com email address';
      return;
    }

    if (this.activationPassword.length < 8) {
      this.error = 'Password must be at least 8 characters long';
      return;
    }

    this.activating = true;
    this.error = '';
    this.success = '';

    this.authService.activateAccount(
      this.activationEmail,
      this.verificationCode,
      this.activationPassword,
      this.activationName
    ).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.activating = false;
        this.error = err.error?.error || 'Activation failed. Please try again.';
      }
    });
  }

  private isAllowedEmail(email: string): boolean {
    return email.toLowerCase().endsWith('@kristujayanti.com');
  }
}
