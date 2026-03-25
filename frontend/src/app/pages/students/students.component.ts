import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { StudentService } from '../../services/student.service';
import { Student } from '../../models/models';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-[#F3F4F6] relative overflow-hidden">
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-yellow-100/30 blur-[100px] rounded-full"></div>

      <app-sidebar [collapsed]="sidebarCollapsed" (toggleCollapsed)="sidebarCollapsed = !sidebarCollapsed"></app-sidebar>

      <main [class]="'flex-1 transition-all duration-500 relative z-10 ' + (sidebarCollapsed ? 'ml-16' : 'ml-64')">
        <div class="p-8">
          <div class="flex items-center justify-between mb-10">
            <div>
              <h1 class="text-3xl font-black text-[#1C1C1C] tracking-tight">Students</h1>
              <p class="text-gray-500 text-sm font-medium mt-1">Directory of all academic records</p>
            </div>
            <div class="flex gap-3">
              <a routerLink="/upload" class="btn-secondary text-[10px] uppercase tracking-widest font-bold px-6">
                Upload CSV
              </a>
              <button (click)="showAddModal = true" class="btn-primary text-[10px] uppercase tracking-widest font-bold px-6">
                Add Student
              </button>
            </div>
          </div>

          <div class="card mb-6 p-4 border-none flex flex-col sm:flex-row gap-4">
            <div class="relative flex-1">
              <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text" [(ngModel)]="search" (input)="onSearch()" placeholder="Search by name or ID..."
                class="input-field pl-11 bg-gray-50 border-none focus:ring-yellow-400">
            </div>
            <select [(ngModel)]="statusFilter" (change)="loadStudents()" class="input-field w-full sm:w-48 bg-gray-50 border-none font-bold text-[10px] uppercase tracking-widest">
              <option value="">All Status</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="At Risk">At Risk</option>
            </select>
          </div>

          <div *ngIf="loading" class="flex items-center justify-center h-64">
            <div class="w-8 h-8 border-4 border-[#1C1C1C]/10 border-t-[#1C1C1C] rounded-full animate-spin"></div>
          </div>

          <div *ngIf="!loading" class="card overflow-hidden p-0 border-none shadow-xl shadow-black/5">
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="bg-gray-50/50 border-b border-gray-100">
                    <th class="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Student</th>
                    <th class="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">ID</th>
                    <th class="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Average</th>
                    <th class="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Attendance</th>
                    <th class="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Status</th>
                    <th class="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr *ngFor="let s of students" class="group hover:bg-gray-50/80 transition-all duration-300">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-2xl bg-[#1C1C1C] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <span class="text-yellow-400 text-xs font-black">{{ s.name.charAt(0) }}</span>
                        </div>
                        <a [routerLink]="['/students', s._id]" class="text-sm font-bold text-[#1C1C1C] hover:text-yellow-600 transition-colors">{{ s.name }}</a>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-xs font-bold text-gray-400">{{ s.studentId }}</td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-20 bg-gray-100 rounded-full h-2">
                          <div class="h-2 rounded-full bg-[#1C1C1C]" [style.width]="(s.average || 0) + '%'"></div>
                        </div>
                        <span class="text-xs font-black text-[#1C1C1C]">{{ s.average }}%</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-xs font-bold text-[#1C1C1C]">{{ s.attendance }}%</td>
                    <td class="px-6 py-4">
                      <span [class]="getStatusClass(s.status || '')">{{ s.status }}</span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-end gap-2">
                        <a [routerLink]="['/students', s._id]" class="w-8 h-8 flex items-center justify-center hover:bg-white rounded-xl text-[#1C1C1C] shadow-sm border border-transparent hover:border-gray-200 transition-all" title="View Detail">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </a>
                        <button (click)="deleteStudent(s)" class="w-8 h-8 flex items-center justify-center hover:bg-rose-50 rounded-xl text-rose-500 transition-all" title="Delete">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="px-6 py-4 bg-gray-50/50 border-t border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Total Records: {{ students.length }}
            </div>
          </div>
        </div>
      </main>

      <div *ngIf="showAddModal" class="fixed inset-0 bg-[#1C1C1C]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
          <div class="px-8 py-6 flex items-center justify-between border-b border-gray-50">
            <h2 class="text-xl font-black text-[#1C1C1C]">New Enrollment</h2>
            <button (click)="showAddModal = false" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="px-8 py-6 space-y-5">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Student ID</label>
                <input type="text" [(ngModel)]="newStudent.studentId" class="input-field" placeholder="ID-001">
              </div>
              <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                <input type="text" [(ngModel)]="newStudent.name" class="input-field" placeholder="Enter name">
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Initial Attendance %</label>
              <input type="number" [(ngModel)]="newStudent.attendance" class="input-field">
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Academic Performance</label>
              <div class="max-h-40 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                <div *ngFor="let subj of subjects; let i = index" class="flex gap-2 items-center">
                  <input type="text" [(ngModel)]="subjects[i].name" class="input-field flex-1 text-xs" placeholder="Subject">
                  <input type="number" [(ngModel)]="subjects[i].score" class="input-field w-20 text-xs" placeholder="0">
                  <button (click)="removeSubject(i)" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
              <button (click)="addSubject()" class="mt-3 text-[10px] font-black text-yellow-600 uppercase tracking-widest hover:text-yellow-700 flex items-center gap-1">
                + Add Subject Field
              </button>
            </div>
          </div>
          <div class="px-8 py-6 bg-gray-50/50 flex gap-3">
            <button (click)="showAddModal = false" class="btn-secondary flex-1 py-4 text-[10px] uppercase tracking-widest">Discard</button>
            <button (click)="addStudent()" [disabled]="addLoading" class="btn-primary flex-1 py-4 text-[10px] uppercase tracking-widest shadow-xl shadow-black/10">
              {{ addLoading ? 'Processing...' : 'Confirm Enrollment' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentsComponent implements OnInit {
  students: Student[] = [];
  loading = true;
  sidebarCollapsed = false;
  search = '';
  statusFilter = '';
  showAddModal = false;
  addLoading = false;
  searchTimeout: any;

  newStudent = { studentId: '', name: '', attendance: 85, remarks: '' };
  subjects: { name: string; score: number | null }[] = [
    { name: 'Math', score: null },
    { name: 'Science', score: null },
    { name: 'English', score: null }
  ];

  constructor(private studentService: StudentService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['status']) this.statusFilter = params['status'];
      this.loadStudents();
    });
  }

  loadStudents() {
    this.loading = true;
    this.studentService.getStudents(this.search, this.statusFilter).subscribe({
      next: (data) => { this.students = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadStudents(), 400);
  }

  addSubject() {
    this.subjects.push({ name: '', score: null });
  }

  removeSubject(i: number) {
    this.subjects.splice(i, 1);
  }

  addStudent() {
    if (!this.newStudent.studentId || !this.newStudent.name) return;
    this.addLoading = true;
    const marks: Record<string, number> = {};
    this.subjects.filter(s => s.name && s.score !== null).forEach(s => {
      marks[s.name.toLowerCase()] = s.score as number;
    });
    const payload = { ...this.newStudent, marks };
    this.studentService.createStudent(payload).subscribe({
      next: () => {
        this.addLoading = false;
        this.showAddModal = false;
        this.loadStudents();
        this.newStudent = { studentId: '', name: '', attendance: 85, remarks: '' };
        this.subjects = [{ name: 'Math', score: null }, { name: 'Science', score: null }, { name: 'English', score: null }];
      },
      error: () => { this.addLoading = false; }
    });
  }

  deleteStudent(s: Student) {
    if (!confirm(`Delete ${s.name}?`)) return;
    this.studentService.deleteStudent(s._id).subscribe(() => this.loadStudents());
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Excellent': 'badge-excellent', 'Good': 'badge-good',
      'Average': 'badge-average', 'At Risk': 'badge-risk'
    };
    return map[status] || 'badge-average';
  }

  getBarColor(value: number): string {
    if (value >= 75) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 45) return 'bg-yellow-500';
    return 'bg-red-500';
  }
}
