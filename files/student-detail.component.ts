// Updated student detail page - REPLACE frontend/src/app/pages/student-detail/student-detail.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { StudentService } from '../../services/student.service';
import { StudentAnalytics, Semester, Subject } from '../../models/models';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-slate-100">
      <app-sidebar [collapsed]="sidebarCollapsed" (toggleCollapsed)="sidebarCollapsed = !sidebarCollapsed"></app-sidebar>

      <main [class]="'flex-1 transition-all duration-300 ' + (sidebarCollapsed ? 'ml-16' : 'ml-64')">
        <div class="p-6">

          <!-- Back + Title -->
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

          <!-- Loading -->
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
                    {{ editMode ? 'Cancel' : 'Edit' }}
                  </button>
                  <button (click)="showAddSemester = true" class="btn-secondary text-sm">
                    + Add Semester
                  </button>
                  <button (click)="downloadReport()" [disabled]="downloading" class="btn-primary text-sm">
                    <span *ngIf="downloading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-1"></span>
                    {{ downloading ? 'Generating...' : 'Download PDF' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Stats Row -->
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              <div class="card text-center">
                <p class="text-3xl font-bold text-blue-600">{{ getStudentAverage() }}%</p>
                <p class="text-xs text-gray-500 mt-1">Overall Avg</p>
              </div>
              <div class="card text-center">
                <p class="text-3xl font-bold text-indigo-600">{{ getCgpa() }}</p>
                <p class="text-xs text-gray-500 mt-1">CGPA</p>
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
                <p class="text-3xl font-bold" [class]="getTotalBacklogs() > 0 ? 'text-red-600' : 'text-green-600'">
                  {{ getTotalBacklogs() }}
                </p>
                <p class="text-xs text-gray-500 mt-1">Backlogs</p>
              </div>
            </div>

            <!-- Tab Navigation -->
            <div class="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm w-fit">
              <button (click)="activeTab = 'semesters'"
                [class]="activeTab === 'semesters' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Semesters
              </button>
              <button (click)="activeTab = 'overview'"
                [class]="activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Overview
              </button>
              <button (click)="activeTab = 'remarks'"
                [class]="activeTab === 'remarks' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Remarks
              </button>
            </div>

            <!-- ── SEMESTERS TAB ── -->
            <div *ngIf="activeTab === 'semesters'">

              <!-- No semesters message -->
              <div *ngIf="getSemesters().length === 0" class="card text-center py-12">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-gray-500 text-sm">No semester data yet.</p>
                <button (click)="showAddSemester = true" class="btn-primary text-sm mt-3">Add Semester 1</button>
              </div>

              <!-- SGPA Trend Chart -->
              <div *ngIf="getSemesters().length > 0" class="card mb-4">
                <h3 class="text-base font-semibold text-gray-800 mb-4">SGPA Trend</h3>
                <div class="flex items-end gap-3 h-32">
                  <ng-container *ngFor="let sem of getSemesters()">
                    <div class="flex flex-col items-center flex-1">
                      <span class="text-xs font-semibold text-gray-700 mb-1">{{ sem.sgpa }}</span>
                      <div class="w-full rounded-t-lg transition-all duration-700"
                        [style.height]="getSgpaBarHeight(sem.sgpa)"
                        [class]="getSgpaBarColor(sem.sgpa)">
                      </div>
                      <span class="text-xs text-gray-500 mt-1">Sem {{ sem.semesterNumber }}</span>
                    </div>
                  </ng-container>
                </div>
                <div class="flex justify-between mt-3 pt-3 border-t border-gray-100 text-sm">
                  <span class="text-gray-500">CGPA: <strong class="text-indigo-600">{{ getCgpa() }}</strong></span>
                  <span class="text-gray-500">Best SGPA: <strong class="text-green-600">{{ getBestSgpa() }}</strong></span>
                  <span class="text-gray-500">Total Backlogs: <strong [class]="getTotalBacklogs() > 0 ? 'text-red-600' : 'text-green-600'">{{ getTotalBacklogs() }}</strong></span>
                </div>
              </div>

              <!-- Semester selector tabs -->
              <div *ngIf="getSemesters().length > 0" class="flex gap-2 mb-4 flex-wrap">
                <button *ngFor="let sem of getSemesters()"
                  (click)="selectedSemester = sem.semesterNumber"
                  [class]="selectedSemester === sem.semesterNumber ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
                  class="px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors border border-gray-200">
                  Semester {{ sem.semesterNumber }}
                  <span *ngIf="sem.backlogs > 0" class="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{{ sem.backlogs }}</span>
                </button>
              </div>

              <!-- Selected Semester Detail -->
              <ng-container *ngIf="getSelectedSemester() as sem">
                <!-- Semester summary cards -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div class="card text-center">
                    <p class="text-2xl font-bold text-indigo-600">{{ sem.sgpa }}</p>
                    <p class="text-xs text-gray-500 mt-1">SGPA</p>
                  </div>
                  <div class="card text-center">
                    <p class="text-2xl font-bold text-blue-600">{{ sem.percentage }}%</p>
                    <p class="text-xs text-gray-500 mt-1">Percentage</p>
                  </div>
                  <div class="card text-center">
                    <p class="text-2xl font-bold text-gray-800">{{ sem.totalMarks }}/{{ sem.totalMaxMarks }}</p>
                    <p class="text-xs text-gray-500 mt-1">Total Marks</p>
                  </div>
                  <div class="card text-center">
                    <p class="text-2xl font-bold" [class]="sem.backlogs > 0 ? 'text-red-600' : 'text-green-600'">
                      {{ sem.backlogs }}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">Backlogs</p>
                  </div>
                </div>

                <!-- Subject table (university result style) -->
                <div class="card overflow-hidden p-0">
                  <div class="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 class="font-semibold text-gray-800 text-sm">
                      Semester {{ sem.semesterNumber }} — Subject Results
                      <span class="ml-2 text-xs text-gray-500">({{ sem.subjectsCleared }}/{{ sem.subjects.length }} cleared)</span>
                    </h3>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="bg-gray-50 border-b border-gray-100">
                          <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                          <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                          <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Marks</th>
                          <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Credits</th>
                          <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">%</th>
                          <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                          <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                          <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Result</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-50">
                        <tr *ngFor="let subj of sem.subjects" class="hover:bg-gray-50 transition-colors">
                          <td class="px-4 py-3 font-medium text-gray-900">{{ subj.subject_name }}</td>
                          <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ subj.subject_code }}</td>
                          <td class="px-4 py-3 text-center text-gray-700">{{ subj.marks }}/{{ subj.max_marks }}</td>
                          <td class="px-4 py-3 text-center text-gray-700">{{ subj.credit }}</td>
                          <td class="px-4 py-3 text-center">
                            <span [class]="subj.percentage >= 60 ? 'text-gray-900' : 'text-red-600'" class="font-medium">
                              {{ subj.percentage }}%
                            </span>
                          </td>
                          <td class="px-4 py-3 text-center">
                            <span [class]="getGradeBadgeClass(subj.grade || '')"
                              class="px-2 py-0.5 rounded text-xs font-bold">
                              {{ subj.grade }}
                            </span>
                          </td>
                          <td class="px-4 py-3 text-center text-gray-700">{{ subj.grade_point }}</td>
                          <td class="px-4 py-3 text-center">
                            <span [class]="subj.result === 'Pass' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'"
                              class="px-2 py-0.5 rounded text-xs font-semibold">
                              {{ subj.result }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr class="bg-indigo-50 border-t-2 border-indigo-200">
                          <td colspan="2" class="px-4 py-3 font-bold text-gray-800">TOTAL / SGPA</td>
                          <td class="px-4 py-3 text-center font-bold text-gray-800">{{ sem.totalMarks }}/{{ sem.totalMaxMarks }}</td>
                          <td class="px-4 py-3 text-center font-bold text-gray-800">{{ getTotalCredits(sem) }}</td>
                          <td class="px-4 py-3 text-center font-bold text-gray-800">{{ sem.percentage }}%</td>
                          <td colspan="2" class="px-4 py-3 text-center font-bold text-indigo-700 text-lg">{{ sem.sgpa }}</td>
                          <td class="px-4 py-3 text-center font-bold" [class]="sem.backlogs > 0 ? 'text-red-600' : 'text-green-600'">
                            {{ sem.backlogs > 0 ? sem.backlogs + ' Backlog(s)' : 'All Clear' }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </ng-container>
            </div>

            <!-- ── OVERVIEW TAB ── -->
            <div *ngIf="activeTab === 'overview'">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Subject marks (legacy) -->
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
                            [class]="getBarColor(entry.value)"></div>
                        </div>
                      </div>
                    </ng-container>
                    <p *ngIf="getMarkEntries().length === 0" class="text-gray-400 text-sm text-center py-4">No mark data</p>
                  </div>
                </div>

                <!-- vs Class average -->
                <div class="card">
                  <h3 class="text-base font-semibold text-gray-800 mb-3">vs Class Average</h3>
                  <div class="flex items-center gap-4 mb-3">
                    <div class="flex-1">
                      <div class="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Student</span><span>{{ getStudentAverage() }}%</span>
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
                  <div class="flex items-center gap-4">
                    <div class="flex-1">
                      <div class="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Class Avg</span><span>{{ getClassAverage() }}%</span>
                      </div>
                      <div class="w-full bg-gray-100 rounded-full h-3">
                        <div class="h-3 bg-gray-400 rounded-full" [style.width]="getClassAverage() + '%'"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── REMARKS TAB ── -->
            <div *ngIf="activeTab === 'remarks'" class="card">
              <h3 class="text-base font-semibold text-gray-800 mb-3">Teacher Remarks</h3>
              <div *ngIf="!editMode">
                <p class="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 min-h-[60px]">
                  {{ getStudentRemarks() || 'No remarks added yet.' }}
                </p>
                <button (click)="editMode = true" class="btn-secondary text-sm mt-3">Edit Remarks</button>
              </div>
              <div *ngIf="editMode" class="space-y-3">
                <textarea [(ngModel)]="editRemarks" class="input-field" rows="4" placeholder="Enter teacher remarks..."></textarea>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Attendance (%)</label>
                  <input type="number" [(ngModel)]="editAttendance" class="input-field w-32" min="0" max="100">
                </div>
                <div class="flex gap-2">
                  <button (click)="saveChanges()" [disabled]="saving" class="btn-primary text-sm">
                    <span *ngIf="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-1"></span>
                    {{ saving ? 'Saving...' : 'Save Changes' }}
                  </button>
                  <button (click)="editMode = false" class="btn-secondary text-sm">Cancel</button>
                </div>
                <p *ngIf="saveSuccess" class="text-green-600 text-xs">Saved successfully!</p>
              </div>
            </div>

          </ng-container>
        </div>
      </main>

      <!-- Add Semester Modal -->
      <div *ngIf="showAddSemester" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 class="text-lg font-semibold text-gray-900">Add / Update Semester</h2>
            <button (click)="showAddSemester = false" class="p-2 hover:bg-gray-100 rounded-lg">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="px-6 py-4 space-y-4">
            <!-- Semester number -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Semester Number</label>
              <select [(ngModel)]="newSem.semesterNumber" class="input-field w-32">
                <option *ngFor="let n of [1,2,3,4,5,6]" [value]="n">Semester {{ n }}</option>
              </select>
            </div>

            <!-- Subjects -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-medium text-gray-700">Subjects</label>
                <button (click)="addSubjectRow()" class="text-xs text-blue-600 hover:text-blue-700">+ Add Subject</button>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-gray-50">
                      <th class="text-left px-2 py-2 text-xs text-gray-500 font-medium">Subject Name</th>
                      <th class="text-left px-2 py-2 text-xs text-gray-500 font-medium">Code</th>
                      <th class="text-left px-2 py-2 text-xs text-gray-500 font-medium">Marks</th>
                      <th class="text-left px-2 py-2 text-xs text-gray-500 font-medium">Max</th>
                      <th class="text-left px-2 py-2 text-xs text-gray-500 font-medium">Credits</th>
                      <th class="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let subj of newSem.subjects; let i = index">
                      <td class="px-1 py-1"><input type="text" [(ngModel)]="newSem.subjects[i].subject_name" class="input-field text-xs" placeholder="e.g. Mathematics"></td>
                      <td class="px-1 py-1"><input type="text" [(ngModel)]="newSem.subjects[i].subject_code" class="input-field text-xs" placeholder="e.g. MA101"></td>
                      <td class="px-1 py-1"><input type="number" [(ngModel)]="newSem.subjects[i].marks" class="input-field text-xs w-16" min="0"></td>
                      <td class="px-1 py-1"><input type="number" [(ngModel)]="newSem.subjects[i].max_marks" class="input-field text-xs w-16" min="1"></td>
                      <td class="px-1 py-1"><input type="number" [(ngModel)]="newSem.subjects[i].credit" class="input-field text-xs w-16" min="0"></td>
                      <td class="px-1 py-1">
                        <button (click)="removeSubjectRow(i)" class="p-1 text-red-400 hover:text-red-600">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="flex gap-2 px-6 py-4 border-t border-gray-100">
            <button (click)="saveSemester()" [disabled]="semSaving" class="btn-primary flex-1 justify-center">
              <span *ngIf="semSaving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-1"></span>
              {{ semSaving ? 'Saving...' : 'Save Semester' }}
            </button>
            <button (click)="showAddSemester = false" class="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class StudentDetailComponent implements OnInit {
  analytics: StudentAnalytics | null = null;
  loading = true;
  sidebarCollapsed = false;
  activeTab = 'semesters';
  selectedSemester = 1;

  // Edit mode
  editMode = false;
  editRemarks = '';
  editAttendance = 0;
  saving = false;
  saveSuccess = false;
  downloading = false;

  // Add semester modal
  showAddSemester = false;
  semSaving = false;
  newSem = {
    semesterNumber: 1,
    subjects: this.emptySubjectRows()
  };

  constructor(private route: ActivatedRoute, private studentService: StudentService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.studentService.getStudentAnalytics(id).subscribe({
      next: (data) => {
        this.analytics = data;
        this.editRemarks = data.student.remarks;
        this.editAttendance = data.student.attendance;
        if (data.student.semesters?.length > 0) {
          this.selectedSemester = data.student.semesters[0].semesterNumber;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Safe getters ──────────────────────────
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
  getCgpa(): number { return this.analytics?.student.cgpa ?? 0; }
  getTotalBacklogs(): number { return this.analytics?.student.totalBacklogs ?? 0; }
  getSemesters(): Semester[] { return this.analytics?.student.semesters ?? []; }

  getSelectedSemester(): Semester | undefined {
    return this.getSemesters().find(s => s.semesterNumber === this.selectedSemester);
  }

  getTotalCredits(sem: Semester): number {
    return sem.subjects.reduce((sum, s) => sum + (s.credit || 0), 0);
  }

  getBestSgpa(): number {
    const sems = this.getSemesters();
    if (!sems.length) return 0;
    return Math.max(...sems.map(s => s.sgpa));
  }

  getSgpaBarHeight(sgpa: number): string {
    return Math.round((sgpa / 10) * 100) + '%';
  }

  getSgpaBarColor(sgpa: number): string {
    if (sgpa >= 8) return 'bg-green-500';
    if (sgpa >= 6) return 'bg-blue-500';
    if (sgpa >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  }

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

  getGradeBadgeClass(grade: string): string {
    const map: Record<string, string> = {
      'O': 'bg-emerald-100 text-emerald-700',
      'A+': 'bg-green-100 text-green-700',
      'A': 'bg-blue-100 text-blue-700',
      'B+': 'bg-indigo-100 text-indigo-700',
      'B': 'bg-purple-100 text-purple-700',
      'C': 'bg-yellow-100 text-yellow-700',
      'F': 'bg-red-100 text-red-700'
    };
    return map[grade] || 'bg-gray-100 text-gray-700';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Excellent': 'badge-excellent', 'Good': 'badge-good',
      'Average': 'badge-average', 'At Risk': 'badge-risk'
    };
    return map[status] || 'badge-average';
  }

  // ── Add Semester ──────────────────────────
  emptySubjectRows() {
    return [
      { subject_name: '', subject_code: '', marks: 0, max_marks: 100, credit: 3 },
      { subject_name: '', subject_code: '', marks: 0, max_marks: 100, credit: 3 },
      { subject_name: '', subject_code: '', marks: 0, max_marks: 100, credit: 3 },
    ];
  }

  addSubjectRow() {
    this.newSem.subjects.push({ subject_name: '', subject_code: '', marks: 0, max_marks: 100, credit: 3 });
  }

  removeSubjectRow(i: number) {
    this.newSem.subjects.splice(i, 1);
  }

  saveSemester() {
    if (!this.analytics) return;
    const validSubjects = this.newSem.subjects.filter(s => s.subject_name.trim());
    if (!validSubjects.length) return;

    this.semSaving = true;
    this.studentService.addSemester(this.analytics.student._id, {
      semesterNumber: this.newSem.semesterNumber,
      subjects: validSubjects
    }).subscribe({
      next: (updated) => {
        if (this.analytics) {
          this.analytics.student = updated;
        }
        this.selectedSemester = this.newSem.semesterNumber;
        this.showAddSemester = false;
        this.semSaving = false;
        this.newSem = { semesterNumber: 1, subjects: this.emptySubjectRows() };
      },
      error: () => { this.semSaving = false; }
    });
  }

  // ── Edit remarks ──────────────────────────
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

  // ── Download PDF ──────────────────────────
  downloadReport() {
    if (!this.analytics) return;
    this.downloading = true;
    const studentId = this.analytics.student._id;
    const fileId = this.analytics.student.studentId;
    this.studentService.downloadReport(studentId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${fileId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading = false;
      },
      error: () => { this.downloading = false; }
    });
  }
}
