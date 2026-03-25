import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { StudentService } from '../../services/student.service';
import { DashboardData } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, BaseChartDirective],
  template: `
    <div class="flex min-h-screen bg-[#F3F4F6] relative overflow-hidden">
      
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-yellow-100/50 blur-[100px] rounded-full"></div>

      <app-sidebar [collapsed]="sidebarCollapsed" (toggleCollapsed)="sidebarCollapsed = !sidebarCollapsed"></app-sidebar>

      <main [class]="'flex-1 transition-all duration-300 relative z-10 ' + (sidebarCollapsed ? 'ml-16' : 'ml-64')">
        <div class="p-8">
          <div class="mb-10">
            <h1 class="text-3xl font-bold text-[#1C1C1C]">Welcome to S.P.A.S</h1>
            <p class="text-gray-500 text-sm mt-1 font-medium">Overview of student performance analytics</p>
          </div>

          <div *ngIf="loading" class="flex items-center justify-center h-64">
            <div class="w-8 h-8 border-4 border-[#1C1C1C]/10 border-t-[#1C1C1C] rounded-full animate-spin"></div>
          </div>

          <ng-container *ngIf="!loading && data">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Students</p>
                    <p class="text-3xl font-bold text-[#1C1C1C] mt-1">{{ data.totalStudents }}</p>
                  </div>
                  <div class="w-12 h-12 bg-[#1C1C1C] rounded-2xl flex items-center justify-center shadow-lg">
                    <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Class Average</p>
                    <p class="text-3xl font-bold text-[#1C1C1C] mt-1">{{ data.classAverage }}%</p>
                  </div>
                  <div class="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-[#1C1C1C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">At Risk Students</p>
                    <p class="text-3xl font-bold text-rose-600 mt-1">{{ data.atRisk }}</p>
                  </div>
                  <div class="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.66 18h16.68a1 1 0 00.87-1.5l-7.5-13a1 1 0 00-1.74 0z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Average Attendance</p>
                    <p class="text-3xl font-bold text-[#1C1C1C] mt-1">{{ data.avgAttendance }}%</p>
                  </div>
                  <div class="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-[1.1fr_1.9fr] gap-6 mb-8">
              <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                <div class="flex items-start justify-between mb-6">
                  <div>
                    <h3 class="text-lg font-bold text-[#1C1C1C]">Class Average</h3>
                    <p class="text-sm text-gray-400 mt-1">Overall academic performance snapshot</p>
                  </div>
                  <span class="px-3 py-1 rounded-full bg-yellow-100 text-[#1C1C1C] text-[10px] font-bold uppercase tracking-widest">
                    {{ data.classAverage }}%
                  </span>
                </div>
                <div class="h-[260px]">
                  <canvas
                    baseChart
                    [data]="classAverageChartData"
                    [options]="classAverageChartOptions"
                    [type]="'doughnut'">
                  </canvas>
                </div>
              </div>

              <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                <div class="flex items-start justify-between mb-6">
                  <div>
                    <h3 class="text-lg font-bold text-[#1C1C1C]">Subject-wise Averages</h3>
                    <p class="text-sm text-gray-400 mt-1">Compare subject performance at a glance</p>
                  </div>
                </div>
                <div class="h-[260px]">
                  <canvas
                    baseChart
                    [data]="subjectAverageChartData"
                    [options]="subjectAverageChartOptions"
                    [type]="'bar'">
                  </canvas>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                <h3 class="text-lg font-bold text-[#1C1C1C] mb-6">Top Performers</h3>
                <div class="space-y-4">
                  <div *ngFor="let s of data.topStudents; let i = index"
                    class="flex items-center gap-4 p-4 rounded-3xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <span class="w-10 h-10 rounded-2xl bg-[#F3F4F6] text-[#1C1C1C] font-bold flex items-center justify-center">
                      {{ i + 1 }}
                    </span>
                    <div class="flex-1">
                      <p class="text-sm font-bold text-[#1C1C1C]">{{ s.name }}</p>
                      <p class="text-xs text-gray-400">ID: {{ s.studentId }}</p>
                    </div>
                    <span class="text-sm font-black text-[#1C1C1C]">{{ s.average }}%</span>
                  </div>
                </div>
              </div>

              <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-lg font-bold text-[#1C1C1C]">At Risk Students</h3>
                  <span class="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-widest">
                    {{ data.atRiskStudents.length }}
                  </span>
                </div>

                <div *ngIf="data.atRiskStudents.length; else noAtRiskStudents" class="space-y-4">
                  <div *ngFor="let s of data.atRiskStudents; let i = index"
                    class="flex items-center gap-4 p-4 rounded-3xl hover:bg-rose-50/60 transition-colors border border-transparent hover:border-rose-100">
                    <span class="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 font-bold flex items-center justify-center">
                      {{ i + 1 }}
                    </span>
                    <div class="flex-1">
                      <p class="text-sm font-bold text-[#1C1C1C]">{{ s.name }}</p>
                      <p class="text-xs text-gray-400">ID: {{ s.studentId }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-black text-rose-600">{{ s.average }}%</p>
                      <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">{{ s.attendance }}% attendance</p>
                    </div>
                  </div>
                </div>

                <ng-template #noAtRiskStudents>
                  <div class="rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-6 text-sm text-emerald-700">
                    No students are currently flagged as at risk.
                  </div>
                </ng-template>
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
  classAverageChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
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
      },
      tooltip: { enabled: true }
    }
  };
  subjectAverageChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#6B7280',
          font: { family: 'Inter', size: 11, weight: 600 }
        }
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          color: '#9CA3AF',
          font: { family: 'Inter', size: 11 }
        },
        grid: { color: 'rgba(28, 28, 28, 0.08)' },
        border: { display: false }
      }
    }
  };

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

  get classAverageChartData(): ChartData<'doughnut'> {
    const classAverage = this.data?.classAverage ?? 0;
    const remaining = Math.max(0, 100 - classAverage);

    return {
      labels: ['Class Average', 'Remaining'],
      datasets: [
        {
          data: [classAverage, remaining],
          backgroundColor: ['#FACC15', '#E5E7EB'],
          hoverBackgroundColor: ['#EAB308', '#D1D5DB'],
          borderWidth: 0
        }
      ]
    };
  }

  get subjectAverageChartData(): ChartData<'bar'> {
    const subjects = this.getSubjectEntries();

    return {
      labels: subjects.map(subject => subject.key),
      datasets: [
        {
          data: subjects.map(subject => subject.value),
          backgroundColor: [
            '#1C1C1C',
            '#FACC15',
            '#FB7185',
            '#38BDF8',
            '#34D399',
            '#A78BFA'
          ],
          borderRadius: 14,
          borderSkipped: false,
          maxBarThickness: 44
        }
      ]
    };
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
