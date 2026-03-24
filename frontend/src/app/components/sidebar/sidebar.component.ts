import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside [class]="'fixed inset-y-0 left-0 z-50 flex flex-col bg-blue-900 transition-all duration-300 ' + (collapsed ? 'w-16' : 'w-64')">
      <!-- Brand -->
      <div class="flex items-center gap-3 px-4 py-5 border-b border-blue-800">
        <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <span *ngIf="!collapsed" class="text-white font-bold text-sm leading-tight">Student<br>Analytics</span>
      </div>

      <!-- Toggle -->
      <button (click)="toggleCollapsed.emit()" class="absolute -right-3 top-6 w-6 h-6 bg-blue-700 rounded-full border-2 border-white flex items-center justify-center hover:bg-blue-600 transition-colors">
        <svg class="w-3 h-3 text-white" [class.rotate-180]="collapsed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Nav -->
      <nav class="flex-1 px-2 py-4 space-y-1">
        <a *ngFor="let item of navItems" [routerLink]="item.path" routerLinkActive="bg-blue-700"
          class="flex items-center gap-3 px-3 py-2.5 text-blue-100 hover:bg-blue-800 rounded-lg transition-colors group"
          [title]="collapsed ? item.label : ''">
          <span class="flex-shrink-0 w-5 h-5" [innerHTML]="item.icon"></span>
          <span *ngIf="!collapsed" class="text-sm font-medium">{{ item.label }}</span>
        </a>
      </nav>

      <!-- User -->
      <div class="px-2 py-4 border-t border-blue-800">
        <div class="flex items-center gap-3 px-3 py-2">
          <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-white text-xs font-bold">{{ userName.charAt(0) }}</span>
          </div>
          <div *ngIf="!collapsed" class="flex-1 min-w-0">
            <p class="text-white text-xs font-medium truncate">{{ userName }}</p>
            <p class="text-blue-300 text-xs capitalize">{{ role }}</p>
          </div>
        </div>
        <button (click)="logout()" class="w-full flex items-center gap-3 px-3 py-2 text-blue-100 hover:bg-blue-800 rounded-lg transition-colors mt-1">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          <span *ngIf="!collapsed" class="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggleCollapsed = new EventEmitter<void>();

  navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>' },
    { path: '/students', label: 'Students', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>' },
    { path: '/upload', label: 'Upload Data', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>' },
  ];

  get userName() { return localStorage.getItem('userName') || 'User'; }
  get role() { return localStorage.getItem('userRole') || ''; }

  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
