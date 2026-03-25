import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { StudentService } from '../../services/student.service';
import { StudentAnalytics } from '../../models/models';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, BaseChartDirective],
  template: `
    <div class="flex min-h-screen bg-[#F3F4F6] relative overflow-hidden">
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-yellow-100/40 blur-[100px] rounded-full"></div>

      <app-sidebar [collapsed]="sidebarCollapsed" (toggleCollapsed)="sidebarCollapsed = !sidebarCollapsed"></app-sidebar>

      <main [class]="'flex-1 transition-all duration-300 relative z-10 ' + (sidebarCollapsed ? 'ml-16' : 'ml-64')">
        <div class="p-8">
          <div class="flex items-center gap-4 mb-10">
            <a routerLink="/students" class="w-10 h-10 flex items-center justify-center bg-white rounded-2xl text-[#1C1C1C] hover:bg-gray-50 transition-all shadow-sm border border-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
              </svg>
            </a>
            <div>
              <h1 class="text-3xl font-bold text-[#1C1C1C]">Student Profile</h1>
              <p class="text-gray-500 text-sm font-medium">Performance insights & analytics</p>
            </div>
          </div>

          <div *ngIf="loading" class="flex items-center justify-center h-64">
            <div class="w-8 h-8 border-4 border-[#1C1C1C]/10 border-t-[#1C1C1C] rounded-full animate-spin"></div>
          </div>

          <ng-container *ngIf="!loading && analytics">
            <div class="card p-8 mb-6 border-none">
              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div class="w-20 h-20 rounded-[2rem] bg-[#1C1C1C] flex items-center justify-center flex-shrink-0 shadow-xl shadow-black/5">
                  <span class="text-yellow-400 text-3xl font-bold">{{ getStudentName().charAt(0) }}</span>
                </div>

                <div class="flex-1">
                  <div class="flex flex-wrap items-center gap-3">
                    <h2 class="text-2xl font-bold text-[#1C1C1C]">{{ getStudentName() }}</h2>
                    <span [class]="getStatusClass(getStudentStatus())">{{ getStudentStatus() }}</span>
                    <span class="bg-gray-100 text-[#1C1C1C] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-gray-200">
                      Grade: {{ getStudentGrade() }}
                    </span>
                  </div>
                  <p class="text-gray-400 font-bold text-xs mt-2 uppercase tracking-tighter">Student ID: {{ getStudentId() }}</p>
                </div>

                <div class="flex flex-wrap gap-3">
                  <button (click)="toggleEditMode()" class="btn-secondary text-xs uppercase tracking-widest px-6">
                    {{ editMode ? 'Cancel' : 'Edit Profile' }}
                  </button>
                  <button (click)="downloadReport()" [disabled]="downloading" class="btn-primary text-xs uppercase tracking-widest px-6">
                    <span *ngIf="downloading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {{ downloading ? 'Generating...' : 'Download PDF' }}
                  </button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div class="card p-6 text-center border-none">
                <p class="text-4xl font-light text-[#1C1C1C]">{{ getStudentAverage() }}<span class="text-lg font-bold text-gray-400">%</span></p>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Overall Average</p>
              </div>
              <div class="card p-6 text-center border-none">
                <p class="text-4xl font-light text-[#1C1C1C]">{{ getStudentAttendance() }}<span class="text-lg font-bold text-gray-400">%</span></p>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Attendance</p>
              </div>
              <div class="card p-6 text-center border-none">
                <p class="text-4xl font-light text-[#1C1C1C]"><span class="text-xl text-gray-400">#</span>{{ getRank() }}</p>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Class Rank</p>
              </div>
              <div class="card p-6 text-center border-none bg-yellow-400">
                <p class="text-4xl font-bold text-[#1C1C1C]">{{ getPercentile() }}<span class="text-lg">th</span></p>
                <p class="text-[10px] font-bold text-[#1C1C1C]/60 uppercase tracking-widest mt-2">Percentile</p>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="card p-8 border-none">
                <div class="flex items-start justify-between mb-6">
                  <div>
                    <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Subject Performance</h3>
                    <p class="text-sm text-gray-500 mt-2">Student scores vs class average across subjects</p>
                  </div>
                </div>
                <div class="h-[320px]">
                  <canvas
                    baseChart
                    [data]="subjectComparisonChartData"
                    [options]="subjectComparisonChartOptions"
                    [type]="'radar'">
                  </canvas>
                </div>
              </div>

              <div class="space-y-6">
                <div class="card p-8 border-none">
                  <div class="flex items-start justify-between mb-6">
                    <div>
                      <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest">Performance Delta</h3>
                      <p class="text-sm text-gray-500 mt-2">Overall standing compared to class benchmarks</p>
                    </div>
                    <span [class]="getDiffClass()" class="text-lg font-black">
                      {{ getDiffSign() }}{{ getDiff() }}%
                    </span>
                  </div>
                  <div class="h-[250px]">
                    <canvas
                      baseChart
                      [data]="performanceGaugeChartData"
                      [options]="performanceGaugeChartOptions"
                      [type]="'doughnut'">
                    </canvas>
                  </div>
                </div>

                <div class="card p-8 border-none overflow-hidden relative">
                  <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                    {{ editMode ? 'Edit Student Details' : 'Teacher Remarks' }}
                  </h3>

                  <div *ngIf="!editMode">
                    <p class="text-sm text-gray-600 leading-relaxed italic">
                      "{{ getStudentRemarks() || 'No remarks added yet.' }}"
                    </p>
                  </div>

                  <div *ngIf="editMode" class="space-y-4">
                    <div>
                      <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Student Name</label>
                      <input type="text" [(ngModel)]="editName" class="input-field" placeholder="Enter student name">
                    </div>

                    <textarea [(ngModel)]="editRemarks" class="input-field" rows="3"
                      placeholder="Enter teacher remarks..."></textarea>

                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <label class="block text-[10px] font-bold text-gray-400 uppercase">Subject Marks</label>
                        <button type="button" (click)="addSubjectField()" class="text-[10px] font-bold uppercase tracking-widest text-yellow-600">
                          Add Subject
                        </button>
                      </div>

                      <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
                        <div *ngFor="let mark of editMarks; let i = index" class="flex gap-2 items-center">
                          <input type="text" [(ngModel)]="mark.key" class="input-field flex-1" placeholder="Subject">
                          <input type="number" [(ngModel)]="mark.value" class="input-field w-24" min="0" max="100" placeholder="0">
                          <button type="button" (click)="removeSubjectField(i)" class="px-3 py-3 rounded-2xl bg-rose-50 text-rose-600 text-xs font-bold">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="flex gap-4">
                      <div class="flex-1">
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Attendance %</label>
                        <input type="number" [(ngModel)]="editAttendance" class="input-field" min="0" max="100">
                      </div>
                      <div class="flex items-end">
                        <button (click)="saveChanges()" [disabled]="saving" class="btn-primary w-full py-3">
                          {{ saving ? 'Saving...' : 'Save' }}
                        </button>
                      </div>
                    </div>

                    <p *ngIf="saveSuccess" class="text-emerald-600 text-[10px] font-bold uppercase text-center">Update Successful</p>
                  </div>

                  <div class="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl"></div>
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
  editName = '';
  editRemarks = '';
  editAttendance = 0;
  editMarks: { key: string; value: number }[] = [];
  saving = false;
  saveSuccess = false;
  downloading = false;

  subjectComparisonChartOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 18,
          color: '#6B7280',
          font: { family: 'Inter', size: 12, weight: 600 }
        }
      }
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent',
          color: '#9CA3AF',
          font: { family: 'Inter', size: 10 }
        },
        angleLines: { color: 'rgba(28, 28, 28, 0.08)' },
        grid: { color: 'rgba(28, 28, 28, 0.08)' },
        pointLabels: {
          color: '#4B5563',
          font: { family: 'Inter', size: 11, weight: 600 }
        }
      }
    }
  };

  performanceGaugeChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    rotation: -90,
    circumference: 180,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 18,
          color: '#6B7280',
          font: { family: 'Inter', size: 12, weight: 600 }
        }
      }
    }
  };

  constructor(private route: ActivatedRoute, private studentService: StudentService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.studentService.getStudentAnalytics(id).subscribe({
      next: (data) => {
        this.analytics = data;
        this.resetEditState(data);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode && this.analytics) {
      this.resetEditState(this.analytics);
    }
  }

  resetEditState(data: StudentAnalytics) {
    this.editName = data.student.name;
    this.editRemarks = data.student.remarks;
    this.editAttendance = data.student.attendance;
    this.editMarks = this.toEditableMarks(data.student.marks);
  }

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

  get subjectComparisonChartData(): ChartData<'radar'> {
    const entries = this.getMarkEntries();

    return {
      labels: entries.map(entry => this.formatSubjectLabel(entry.key)),
      datasets: [
        {
          label: 'Student',
          data: entries.map(entry => entry.value),
          backgroundColor: 'rgba(250, 204, 21, 0.22)',
          borderColor: '#FACC15',
          pointBackgroundColor: '#FACC15',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#EAB308',
          borderWidth: 2
        },
        {
          label: 'Class Average',
          data: entries.map(entry => this.getClassAvg(entry.key)),
          backgroundColor: 'rgba(28, 28, 28, 0.10)',
          borderColor: '#1C1C1C',
          pointBackgroundColor: '#1C1C1C',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#111827',
          borderWidth: 2
        }
      ]
    };
  }

  get performanceGaugeChartData(): ChartData<'doughnut'> {
    const studentAverage = this.getStudentAverage();
    const classAverage = this.getClassAverage();
    const remainder = Math.max(0, 100 - Math.max(studentAverage, classAverage));

    return {
      labels: ['Student Average', 'Class Average', 'Remaining'],
      datasets: [
        {
          data: [studentAverage, classAverage, remainder],
          backgroundColor: ['#FACC15', '#1C1C1C', '#E5E7EB'],
          hoverBackgroundColor: ['#EAB308', '#111827', '#D1D5DB'],
          borderWidth: 0
        }
      ]
    };
  }

  getClassAvg(subject: string): number {
    return this.analytics?.subjectClassAverages[subject] ?? 0;
  }

  formatSubjectLabel(subject: string): string {
    return subject
      .split(/[\s_-]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Excellent': 'badge-excellent',
      'Good': 'badge-good',
      'Average': 'badge-average',
      'At Risk': 'badge-risk'
    };
    return map[status] || 'badge-average';
  }

  toEditableMarks(marks: Record<string, number>) {
    return Object.entries(marks).map(([key, value]) => ({ key, value }));
  }

  addSubjectField() {
    this.editMarks.push({ key: '', value: 0 });
  }

  removeSubjectField(index: number) {
    this.editMarks.splice(index, 1);
  }

  saveChanges() {
    if (!this.analytics) return;

    const marks = this.editMarks.reduce((acc, item) => {
      const key = item.key.trim().toLowerCase();
      if (key) {
        acc[key] = Number(item.value) || 0;
      }
      return acc;
    }, {} as Record<string, number>);

    this.saving = true;
    this.studentService.updateStudent(this.analytics.student._id, {
      name: this.editName.trim(),
      remarks: this.editRemarks,
      attendance: this.editAttendance,
      marks
    }).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;

        if (this.analytics) {
          this.analytics.student.name = this.editName.trim();
          this.analytics.student.remarks = this.editRemarks;
          this.analytics.student.attendance = this.editAttendance;
          this.analytics.student.marks = marks;
        }

        setTimeout(() => {
          this.saveSuccess = false;
          this.editMode = false;
        }, 2000);
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
