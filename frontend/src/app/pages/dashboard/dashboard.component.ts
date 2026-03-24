import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { StudentService } from '../../services/student.service';
import { DashboardData } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-slate-100">
      <app-sidebar [collapsed]="sidebarCollapsed" (toggleCollapsed)="sidebarCollapsed = !sidebarCollapsed"></app-sidebar>

      <main [class]="'flex-1 transition-all duration-300 ' + (sidebarCollapsed ? 'ml-16' : 'ml-64')">
        <div class="p-6">
          <!-- Header -->
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p class="text-gray-500 text-sm mt-1">Overview of student performance analytics</p>
          </div>

          <!-- Loading -->
          <div *ngIf="loading" class="flex items-center justify-center h-64">
            <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <ng-container *ngIf="!loading && data">
            <!-- Stat Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div class="card">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Total Students</p>
                    <p class="text-3xl font-bold text-gray-900 mt-1">{{ data.totalStudents }}</p>
                  </div>
                  <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Class Average</p>
                    <p class="text-3xl font-bold text-gray-900 mt-1">{{ data.classAverage }}%</p>
                  </div>
                  <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Avg Attendance</p>
                    <p class="text-3xl font-bold text-gray-900 mt-1">{{ data.avgAttendance }}%</p>
                  </div>
                  <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="card border-red-200">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">At-Risk Students</p>
                    <p class="text-3xl font-bold text-red-600 mt-1">{{ data.atRisk }}</p>
                  </div>
                  <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <!-- Subject Averages -->
              <div class="card">
                <h3 class="text-base font-semibold text-gray-800 mb-4">Subject-wise Averages</h3>
                <div class="space-y-3">
                  <ng-container *ngFor="let subject of getSubjectEntries()">
                    <div>
                      <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-600 capitalize">{{ subject.key | titlecase }}</span>
                        <span class="font-medium text-gray-900">{{ subject.value }}%</span>
                      </div>
                      <div class="w-full bg-gray-100 rounded-full h-2">
                        <div class="h-2 rounded-full transition-all duration-500"
                          [style.width]="subject.value + '%'"
                          [class]="getBarColor(subject.value)">
                        </div>
                      </div>
                    </div>
                  </ng-container>
                  <p *ngIf="getSubjectEntries().length === 0" class="text-gray-400 text-sm text-center py-4">No subject data available</p>
                </div>
              </div>

              <!-- Grade Distribution -->
              <div class="card">
                <h3 class="text-base font-semibold text-gray-800 mb-4">Grade Distribution</h3>
                <div class="space-y-3">
                  <ng-container *ngFor="let grade of getGradeEntries()">
                    <div class="flex items-center gap-3">
                      <span class="w-8 text-sm font-bold text-gray-700">{{ grade.key }}</span>
                      <div class="flex-1 bg-gray-100 rounded-full h-4">
                        <div class="h-4 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                          [style.width]="getGradeWidth(grade.value) + '%'"
                          [class]="getGradeColor(grade.key)">
                          <span class="text-white text-xs font-medium">{{ grade.value }}</span>
                        </div>
                      </div>
                    </div>
                  </ng-container>
                  <p *ngIf="getGradeEntries().length === 0" class="text-gray-400 text-sm text-center py-4">No grade data available</p>
                </div>
              </div>
            </div>

            <!-- Tables Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <!-- Top Students -->
              <div class="card">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-base font-semibold text-gray-800">Top Performers</h3>
                  <a routerLink="/students" class="text-sm text-blue-600 hover:underline">View all</a>
                </div>
                <div class="space-y-3">
                  <div *ngFor="let s of data.topStudents; let i = index"
                    class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <span class="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                      [class]="i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'">
                      {{ i + 1 }}
                    </span>
                    <div class="flex-1 min-w-0">
                      <a [routerLink]="['/students', s._id]" class="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">{{ s.name }}</a>
                      <p class="text-xs text-gray-500">ID: {{ s.studentId }}</p>
                    </div>
                    <span class="text-sm font-semibold text-gray-900">{{ s.average }}%</span>
                  </div>
                  <p *ngIf="!data.topStudents.length" class="text-gray-400 text-sm text-center py-4">No students yet</p>
                </div>
              </div>

              <!-- At-Risk Students -->
              <div class="card">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    At-Risk Students
                  </h3>
                  <a routerLink="/students" [queryParams]="{status: 'At Risk'}" class="text-sm text-blue-600 hover:underline">View all</a>
                </div>
                <div class="space-y-3">
                  <div *ngFor="let s of data.atRiskStudents"
                    class="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span class="text-red-700 text-xs font-bold">{{ s.name.charAt(0) }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <a [routerLink]="['/students', s._id]" class="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">{{ s.name }}</a>
                      <p class="text-xs text-red-600">Avg: {{ s.average }}% | Att: {{ s.attendance }}%</p>
                    </div>
                    <span class="badge-risk">At Risk</span>
                  </div>
                  <p *ngIf="!data.atRiskStudents.length" class="text-gray-400 text-sm text-center py-4">
                    <svg class="w-8 h-8 mx-auto mb-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    No at-risk students
                  </p>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  data: DashboardData | null = null;
  loading = true;
  sidebarCollapsed = false;

  constructor(private studentService: StudentService) {}

  ngOnInit() {
    this.studentService.getDashboard().subscribe({
      next: (d) => { this.data = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getSubjectEntries() {
    if (!this.data) return [];
    return Object.entries(this.data.subjectAverages).map(([key, value]) => ({ key, value }));
  }

  getGradeEntries() {
    if (!this.data) return [];
    const order = ['A+', 'A', 'B', 'C', 'D', 'F'];
    return order
      .filter(g => this.data!.gradeDistribution[g])
      .map(g => ({ key: g, value: this.data!.gradeDistribution[g] }));
  }

  getGradeWidth(count: number): number {
    const max = Math.max(...Object.values(this.data?.gradeDistribution || {}));
    return max ? (count / max) * 100 : 0;
  }

  getBarColor(value: number): string {
    if (value >= 75) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 45) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getGradeColor(grade: string): string {
    const map: Record<string, string> = {
      'A+': 'bg-emerald-500', 'A': 'bg-green-500', 'B': 'bg-blue-500',
      'C': 'bg-yellow-500', 'D': 'bg-orange-500', 'F': 'bg-red-500'
    };
    return map[grade] || 'bg-gray-500';
  }
}
