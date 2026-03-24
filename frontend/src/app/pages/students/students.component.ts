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
    <div class="flex min-h-screen bg-slate-100">
      <app-sidebar [collapsed]="sidebarCollapsed" (toggleCollapsed)="sidebarCollapsed = !sidebarCollapsed"></app-sidebar>

      <main [class]="'flex-1 transition-all duration-300 ' + (sidebarCollapsed ? 'ml-16' : 'ml-64')">
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Students</h1>
              <p class="text-gray-500 text-sm mt-1">Manage and view all student records</p>
            </div>
            <div class="flex gap-2">
              <a routerLink="/upload" class="btn-secondary text-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                Upload Data
              </a>
              <button (click)="showAddModal = true" class="btn-primary text-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add Student
              </button>
            </div>
          </div>

          <!-- Filters -->
          <div class="card mb-4">
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="relative flex-1">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="text" [(ngModel)]="search" (input)="onSearch()" placeholder="Search by name or ID..."
                  class="input-field pl-9">
              </div>
              <select [(ngModel)]="statusFilter" (change)="loadStudents()" class="input-field w-full sm:w-44">
                <option value="">All Status</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="At Risk">At Risk</option>
              </select>
            </div>
          </div>

          <!-- Loading -->
          <div *ngIf="loading" class="flex items-center justify-center h-64">
            <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <!-- Table -->
          <div *ngIf="!loading" class="card overflow-hidden p-0">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-100">
                    <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Average</th>
                    <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance</th>
                    <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr *ngFor="let s of students" class="hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span class="text-blue-700 text-xs font-bold">{{ s.name.charAt(0) }}</span>
                        </div>
                        <a [routerLink]="['/students', s._id]" class="text-sm font-medium text-gray-900 hover:text-blue-600">{{ s.name }}</a>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ s.studentId }}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-16 bg-gray-100 rounded-full h-1.5">
                          <div class="h-1.5 rounded-full" [class]="getBarColor(s.average || 0)" [style.width]="(s.average || 0) + '%'"></div>
                        </div>
                        <span class="text-sm font-medium text-gray-700">{{ s.average }}%</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ s.attendance }}%</td>
                    <td class="px-4 py-3">
                      <span [class]="getStatusClass(s.status || '')">{{ s.status }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-1">
                        <a [routerLink]="['/students', s._id]" class="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="View">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </a>
                        <button (click)="deleteStudent(s)" class="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Delete">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="students.length === 0">
                    <td colspan="6" class="text-center py-12 text-gray-400">
                      <svg class="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
                      </svg>
                      <p class="text-sm">No students found. <a routerLink="/upload" class="text-blue-600 hover:underline">Upload data</a> to get started.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
              Showing {{ students.length }} student{{ students.length !== 1 ? 's' : '' }}
            </div>
          </div>
        </div>
      </main>

      <!-- Add Student Modal -->
      <div *ngIf="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 class="text-lg font-semibold text-gray-900">Add New Student</h2>
            <button (click)="showAddModal = false" class="p-2 hover:bg-gray-100 rounded-lg">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Student ID*</label>
                <input type="text" [(ngModel)]="newStudent.studentId" class="input-field" placeholder="e.g. STU001">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Full Name*</label>
                <input type="text" [(ngModel)]="newStudent.name" class="input-field" placeholder="Student name">
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Attendance (%)</label>
              <input type="number" [(ngModel)]="newStudent.attendance" class="input-field" min="0" max="100">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">Subject Marks</label>
              <div class="space-y-2">
                <div *ngFor="let subj of subjects; let i = index" class="flex gap-2 items-center">
                  <input type="text" [(ngModel)]="subjects[i].name" class="input-field flex-1" placeholder="Subject name">
                  <input type="number" [(ngModel)]="subjects[i].score" class="input-field w-24" min="0" max="100" placeholder="Score">
                  <button (click)="removeSubject(i)" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                <button (click)="addSubject()" class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Add Subject
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Remarks (optional)</label>
              <textarea [(ngModel)]="newStudent.remarks" class="input-field" rows="2" placeholder="Teacher remarks..."></textarea>
            </div>
          </div>
          <div class="flex gap-2 px-6 py-4 border-t border-gray-100">
            <button (click)="showAddModal = false" class="btn-secondary flex-1 justify-center">Cancel</button>
            <button (click)="addStudent()" [disabled]="addLoading" class="btn-primary flex-1 justify-center">
              <span *ngIf="addLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ addLoading ? 'Saving...' : 'Save Student' }}
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
