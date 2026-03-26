import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4 relative overflow-hidden">
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-yellow-100/50 blur-[100px] rounded-full"></div>
      <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-100/40 blur-[100px] rounded-full"></div>

      <div class="w-full max-w-lg relative z-10 bg-white rounded-[3rem] shadow-sm border border-gray-100 p-10">
        <div class="mb-8">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] mb-3"
            [class.text-yellow-600]="isFirstLogin"
            [class.text-[#1C1C1C]]="!isFirstLogin">
            {{ isFirstLogin ? 'First Login Required' : 'Account Security' }}
          </p>
          <h1 class="text-3xl font-black text-[#1C1C1C] tracking-tight">Change Your Password</h1>
          <p class="text-sm text-gray-500 mt-3 leading-6">
            {{ isFirstLogin
              ? 'Your account still needs a password update before you can continue into the portal.'
              : 'Update your current password any time to keep your account secure.' }}
          </p>
        </div>

        <div *ngIf="error" class="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-red-600 text-sm">
          {{ error }}
        </div>

        <div *ngIf="success" class="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 text-emerald-700 text-sm">
          Password changed successfully. Redirecting to dashboard...
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Current Password</label>
            <input type="password" [(ngModel)]="currentPassword" [placeholder]="isFirstLogin ? 'Enter your current temporary password' : 'Enter current password'"
              class="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-300">
          </div>

          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">New Password</label>
            <input type="password" [(ngModel)]="newPassword" placeholder="Enter a new secure password"
              class="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-300">
          </div>

          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Confirm New Password</label>
            <input type="password" [(ngModel)]="confirmPassword" placeholder="Re-enter the new password"
              class="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-yellow-400 transition-all placeholder:text-gray-300"
              (keyup.enter)="changePassword()">
          </div>

          <button (click)="changePassword()" [disabled]="loading"
            class="w-full bg-[#1C1C1C] hover:bg-black disabled:opacity-50 text-white font-bold py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 mt-2 shadow-lg shadow-black/5">
            <span *ngIf="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ loading ? 'Updating Password...' : 'Save New Password' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ChangePasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error = '';
  success = false;
  isFirstLogin = false;

  constructor(private authService: AuthService, private router: Router) {
    this.isFirstLogin = this.authService.isFirstLogin();
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.error = 'Please fill in all password fields';
      return;
    }

    if (this.newPassword.length < 8) {
      this.error = 'New password must be at least 8 characters long';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'New password and confirm password do not match';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.isFirstLogin = false;
        setTimeout(() => this.router.navigate(['/dashboard']), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Unable to change password. Please try again.';
      }
    });
  }
}
