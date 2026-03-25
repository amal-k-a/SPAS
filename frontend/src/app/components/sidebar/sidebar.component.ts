import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styles: [`
    .nav-link { transition: all 0.2s ease; }
    .nav-link:hover .nav-icon { transform: scale(1.1); }
    .nav-link.active-link { background: rgba(250,204,21,0.12); color: #fff; }
    .nav-link.active-link .nav-label { color: #facc15; }
    .nav-link.active-link .active-bar { opacity: 1; }
    .active-bar { opacity: 0; transition: opacity 0.2s; }
    .logout-btn { transition: all 0.2s; }
    .logout-btn:hover { background: rgba(239,68,68,0.15); color: #f87171; }
    .user-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); }
    .logo-glow { box-shadow: 0 0 20px rgba(250,204,21,0.3); }
    .toggle-btn { transition: all 0.2s; }
    .toggle-btn:hover { background: #333; }
    :host { font-family: 'DM Sans', sans-serif; }
  `],
  template: `
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

    <aside [class]="'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-500 ' + (collapsed ? 'w-[72px]' : 'w-64')"
      style="background: linear-gradient(180deg, #141414 0%, #1a1a1a 100%); border-right: 1px solid rgba(255,255,255,0.06);">

      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 pt-7 pb-6" [class.justify-center]="collapsed">
        <div class="logo-glow w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-[#141414]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <div *ngIf="!collapsed">
          <p style="font-family:'DM Sans',sans-serif; font-weight:700; font-size:15px; color:#fff; line-height:1.2; letter-spacing:-0.3px;">Student</p>
          <p style="font-family:'DM Sans',sans-serif; font-weight:500; font-size:12px; color:rgba(255,255,255,0.35); letter-spacing:0.5px; text-transform:uppercase;">Analytics</p>
        </div>
      </div>

      <!-- Collapse toggle -->
      <button (click)="toggleCollapsed.emit()" class="toggle-btn absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center z-50"
        style="background:#1a1a1a; border: 1px solid rgba(255,255,255,0.1);">
        <svg class="w-3 h-3 text-gray-400 transition-transform duration-300" [class.rotate-180]="collapsed"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Section label -->
      <p *ngIf="!collapsed" style="font-size:10px; font-weight:600; color:rgba(255,255,255,0.2); letter-spacing:1.2px; text-transform:uppercase; padding: 0 20px 10px; font-family:'DM Sans',sans-serif;">
        MENU
      </p>

      <!-- Nav -->
      <nav class="flex-1 px-3 space-y-1">
        <a *ngFor="let item of navItems"
          [routerLink]="item.path"
          routerLinkActive="active-link"
          class="nav-link relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/5"
          [class.justify-center]="collapsed"
          [title]="collapsed ? item.label : ''">
          <!-- Active bar -->
          <span class="active-bar absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-yellow-400 rounded-r-full" style="left: -4px;"></span>
          <span class="nav-icon flex-shrink-0 w-[18px] h-[18px]">
            <svg *ngIf="item.icon === 'dashboard'" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z"/>
            </svg>
            <svg *ngIf="item.icon === 'students'" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <svg *ngIf="item.icon === 'upload'" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
          </span>
          <span *ngIf="!collapsed" class="nav-label" style="font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500;">
            {{ item.label }}
          </span>
          <!-- Active dot for collapsed -->
          <span *ngIf="collapsed" class="active-bar absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-400" style="top:auto; transform:translateX(-50%); left:50%;"></span>
        </a>
      </nav>

      <!-- Divider -->
      <div class="mx-4 my-3" style="height:1px; background: rgba(255,255,255,0.05);"></div>

      <!-- User card -->
      <div class="p-3 pb-5">
        <div class="user-card rounded-2xl p-3" [class.flex]="collapsed" [class.justify-center]="collapsed">
          <div class="flex items-center gap-3">
            <div class="relative flex-shrink-0">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center text-[#141414] font-bold text-sm"
                style="background: linear-gradient(135deg, #facc15, #fde68a);">
                {{ userName.charAt(0) }}
              </div>
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#1a1a1a]"></span>
            </div>
            <div *ngIf="!collapsed" class="flex-1 min-w-0">
              <p style="font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ userName }}</p>
              <p style="font-family:'DM Sans',sans-serif; font-size:10px; font-weight:500; color:rgba(255,255,255,0.3); letter-spacing:0.8px; text-transform:uppercase;">{{ role }}</p>
            </div>
          </div>

          <button *ngIf="!collapsed" (click)="goToChangePassword()" class="logout-btn w-full flex items-center justify-center gap-2 mt-3 px-3 py-2 rounded-xl text-gray-500"
            style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500;">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a5 5 0 00-10 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2zm3-10V9a3 3 0 116 0v2H9z"/>
            </svg>
            Change Password
          </button>

          <button *ngIf="!collapsed" (click)="logout()" class="logout-btn w-full flex items-center justify-center gap-2 mt-3 px-3 py-2 rounded-xl text-gray-500"
            style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500;">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggleCollapsed = new EventEmitter<void>();

  navItems = [
    {
      path: '/dashboard', label: 'Dashboard',
      icon: 'dashboard'
    },
    {
      path: '/students', label: 'Students',
      icon: 'students'
    },
    {
      path: '/upload', label: 'Upload Data',
      icon: 'upload'
    },
  ];

  get userName() { return localStorage.getItem('userName') || 'Teacher'; }
  get role() { return localStorage.getItem('userRole') || 'Teacher'; }

  constructor(private authService: AuthService, private router: Router) {}

  goToChangePassword() {
    this.router.navigate(['/change-password']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
