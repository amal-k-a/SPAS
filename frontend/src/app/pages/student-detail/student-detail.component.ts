import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { StudentService } from '../../services/student.service';
import { StudentAnalytics } from '../../models/models';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-slate-100">
      <app-sidebar [collapsed]="sidebarCollapsed" (toggleCollapsed)="sidebarCollapsed = !sidebarCollapsed"></app-sidebar>

      <main [class]="'flex-1 transition-all duration-300 ' + (sidebarCollapsed ? 'ml-16' : 'ml-64')">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-6">
            <a routerLink="/students" class="p-2 hover:bg-white rounded-lg text-gray-500 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </a>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Student Profile</h1>
              <p class="text-gray-500 text-sm">Detailed performance analysis</p>
            </div>
          </div>

          <div *ngIf="loading" class="flex items-center justify-center h-64">
            <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <ng-container *ngIf="!loading && analytics">
            <!-- Profile Header -->
            <div class="card mb-4">
              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <span class="text-white text-2xl font-bold">{{ getStudentName().charAt(0) }}</span>
                </div>
                <div class="flex-1">
                  <div class="flex flex-wrap items-center gap-3">
                    <h2 class="text-xl font-bold text-gray-900">{{ getStudentName() }}</h2>
                    <span [class]="getStatusClass(getStudentStatus())">{{ getStudentStatus() }}</span>
                    <span class="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">Grade: {{ getStudentGrade() }}</span>
                  </div>
                  <p class="text-gray-500 text-sm mt-1">ID: {{ getStudentId() }}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button (click)="editMode = !editMode" class="btn-secondary text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    {{ editMode ? 'Cancel' : 'Edit' }}
                  </button>
                  <button (click)="downloadReport()" [disabled]="downloading" class="btn-primary text-sm">
                    <span *ngIf="downloading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <svg *ngIf="!downloading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    {{ downloading ? 'Generating...' : 'Download PDF' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Stats Row -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div class="card text-center">
                <p class="text-3xl font-bold text-blue-600">{{ getStudentAverage() }}%</p>
                <p class="text-xs text-gray-500 mt-1">Overall Average</p>
              </div>
              <div class="card text-center">
                <p class="text-3xl font-bold text-gray-800">{{ getStudentAttendance() }}%</p>
                <p class="text-xs text-gray-500 mt-1">Attendance</p>
              </div>
              <div class="card text-center">
                <p class="text-3xl font-bold text-indigo-600">#{{ getRank() }}</p>
                <p class="text-xs text-gray-500 mt-1">Class Rank</p>
              </div>
              <div class="card text-center">
                <p class="text-3xl font-bold text-green-600">{{ getPercentile() }}th</p>
                <p class="text-xs text-gray-500 mt-1">Percentile</p>
              </div>
            </div>

            <!-- Main Content -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <!-- Subject Marks -->
              <div class="card">
                <h3 class="text-base font-semibold text-gray-800 mb-4">Subject Performance</h3>
                <div class="space-y-4">
                  <ng-container *ngFor="let entry of getMarkEntries()">
                    <div>
                      <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-700 font-medium capitalize">{{ entry.key | titlecase }}</span>
                        <div class="flex items-center gap-2">
                          <span class="text-xs text-gray-400">Class: {{ getClassAvg(entry.key) }}%</span>
                          <span class="font-semibold" [class]="entry.value >= 60 ? 'text-gray-900' : 'text-red-600'">{{ entry.value }}%</span>
                        </div>
                      </div>
                      <div class="w-full bg-gray-100 rounded-full h-2.5 relative">
                        <div class="absolute top-0 h-2.5 w-0.5 bg-gray-400 rounded-full z-10"
                          [style.left]="getClassAvg(entry.key) + '%'"></div>
                        <div class="h-2.5 rounded-full transition-all duration-700"
                          [style.width]="entry.value + '%'"
                          [class]="getBarColor(entry.value)">
                        </div>
                      </div>
                      <p class="text-xs text-gray-400 mt-0.5">{{ getPerformanceLabel(entry.value) }}</p>
                    </div>
                  </ng-container>
                  <p *ngIf="getMarkEntries().length === 0" class="text-gray-400 text-sm text-center py-4">No mark data</p>
                </div>
              </div>

              <!-- Comparison + Remarks -->
              <div class="space-y-4">
                <!-- vs Class Avg -->
                <div class="card">
                  <h3 class="text-base font-semibold text-gray-800 mb-3">vs Class Average</h3>
                  <div class="flex items-center gap-4">
                    <div class="flex-1">
                      <div class="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Student</span>
                        <span>{{ getStudentAverage() }}%</span>
                      </div>
                      <div class="w-full bg-gray-100 rounded-full h-3">
                        <div class="h-3 bg-blue-500 rounded-full" [style.width]="getStudentAverage() + '%'"></div>
                      </div>
                    </div>
                    <div class="text-center px-2">
                      <span [class]="getDiffClass()" class="text-sm font-bold">
                        {{ getDiffSign() }}{{ getDiff() }}%
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-4 mt-2">
                    <div class="flex-1">
                      <div class="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Class Avg</span>
                        <span>{{ getClassAverage() }}%</span>
                      </div>
                      <div class="w-full bg-gray-100 rounded-full h-3">
                        <div class="h-3 bg-gray-400 rounded-full" [style.width]="getClassAverage() + '%'"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Remarks -->
                <div class="card">
                  <h3 class="text-base font-semibold text-gray-800 mb-3">Teacher Remarks</h3>
                  <div *ngIf="!editMode">
                    <p class="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 min-h-[60px]">
                      {{ getStudentRemarks() || 'No remarks added yet.' }}
                    </p>
                  </div>
                  <div *ngIf="editMode" class="space-y-3">
                    <textarea [(ngModel)]="editRemarks" class="input-field" rows="4"
                      placeholder="Enter teacher remarks..."></textarea>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">Attendance</label>
                        <input type="number" [(ngModel)]="editAttendance" class="input-field" min="0" max="100">
                      </div>
                    </div>
                    <button (click)="saveChanges()" [disabled]="saving" class="btn-primary w-full justify-center text-sm">
                      <span *ngIf="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      {{ saving ? 'Saving...' : 'Save Changes' }}
                    </button>
                    <p *ngIf="saveSuccess" class="text-green-600 text-xs text-center">Saved successfully!</p>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </main>
    </div>
  `
})
export class StudentDetailComponent implements OnInit {
  analytics: StudentAnalytics | null = null;
  loading = true;
  sidebarCollapsed = false;
  editMode = false;
  editRemarks = '';
  editAttendance = 0;
  saving = false;
  saveSuccess = false;
  downloading = false;

  constructor(private route: ActivatedRoute, private studentService: StudentService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.studentService.getStudentAnalytics(id).subscribe({
      next: (data) => {
        this.analytics = data;
        this.editRemarks = data.student.remarks;
        this.editAttendance = data.student.attendance;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // Safe getter methods - no null issues in templates
  getStudentName(): string { return this.analytics?.student.name ?? ''; }
  getStudentId(): string { return this.analytics?.student.studentId ?? ''; }
  getStudentStatus(): string { return this.analytics?.student.status ?? ''; }
  getStudentGrade(): string { return this.analytics?.student.grade ?? ''; }
  getStudentAverage(): number { return this.analytics?.student.average ?? 0; }
  getStudentAttendance(): number { return this.analytics?.student.attendance ?? 0; }
  getStudentRemarks(): string { return this.analytics?.student.remarks ?? ''; }
  getRank(): number { return this.analytics?.rank ?? 0; }
  getPercentile(): number { return this.analytics?.percentile ?? 0; }
  getClassAverage(): number { return this.analytics?.classAverage ?? 0; }

  getDiff(): string {
    return Math.abs(this.getStudentAverage() - this.getClassAverage()).toFixed(1);
  }
  getDiffSign(): string {
    return this.getStudentAverage() >= this.getClassAverage() ? '+' : '-';
  }
  getDiffClass(): string {
    return this.getStudentAverage() >= this.getClassAverage() ? 'text-green-600' : 'text-red-500';
  }

  getMarkEntries() {
    if (!this.analytics) return [];
    return Object.entries(this.analytics.student.marks).map(([key, value]) => ({ key, value }));
  }

  getClassAvg(subject: string): number {
    return this.analytics?.subjectClassAverages[subject] ?? 0;
  }

  getBarColor(v: number): string {
    if (v >= 75) return 'bg-green-500';
    if (v >= 60) return 'bg-blue-500';
    if (v >= 45) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getPerformanceLabel(v: number): string {
    if (v >= 80) return 'Excellent';
    if (v >= 60) return 'Good';
    if (v >= 40) return 'Needs Improvement';
    return 'Critical';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Excellent': 'badge-excellent', 'Good': 'badge-good',
      'Average': 'badge-average', 'At Risk': 'badge-risk'
    };
    return map[status] || 'badge-average';
  }

  saveChanges() {
    if (!this.analytics) return;
    this.saving = true;
    this.studentService.updateStudent(this.analytics.student._id, {
      remarks: this.editRemarks,
      attendance: this.editAttendance,
      marks: this.analytics.student.marks
    }).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;
        if (this.analytics) {
          this.analytics.student.remarks = this.editRemarks;
          this.analytics.student.attendance = this.editAttendance;
        }
        setTimeout(() => { this.saveSuccess = false; this.editMode = false; }, 2000);
      },
      error: () => { this.saving = false; }
    });
  }

  downloadReport() {
    if (!this.analytics) return;
    this.downloading = true;
    const studentId = this.analytics.student._id;
    const studentFileId = this.analytics.student.studentId;
    this.studentService.downloadReport(studentId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${studentFileId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading = false;
      },
      error: () => { this.downloading = false; }
    });
  }
}
