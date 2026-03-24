import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-slate-100">
      <app-sidebar [collapsed]="sidebarCollapsed" (toggleCollapsed)="sidebarCollapsed = !sidebarCollapsed"></app-sidebar>

      <main [class]="'flex-1 transition-all duration-300 ' + (sidebarCollapsed ? 'ml-16' : 'ml-64')">
        <div class="p-6 max-w-3xl">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Upload Student Data</h1>
            <p class="text-gray-500 text-sm mt-1">Import student records from Excel or CSV files</p>
          </div>

          <!-- Upload Card -->
          <div class="card mb-4">
            <div class="border-2 border-dashed rounded-xl p-10 text-center transition-colors"
              [class]="isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
              (dragover)="onDragOver($event)" (dragleave)="isDragging = false" (drop)="onDrop($event)">
              <input type="file" #fileInput accept=".xlsx,.xls,.csv" (change)="onFileSelect($event)" class="hidden">

              <div *ngIf="!selectedFile">
                <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                </div>
                <p class="text-gray-700 font-medium mb-1">Drag & drop your file here</p>
                <p class="text-gray-400 text-sm mb-4">or</p>
                <button (click)="fileInput.click()" class="btn-primary text-sm">Browse File</button>
                <p class="text-xs text-gray-400 mt-4">Supports: .xlsx, .xls, .csv (Max 16MB)</p>
              </div>

              <div *ngIf="selectedFile" class="flex items-center gap-4 justify-center">
                <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div class="text-left">
                  <p class="font-medium text-gray-900">{{ selectedFile.name }}</p>
                  <p class="text-sm text-gray-500">{{ formatSize(selectedFile.size) }}</p>
                </div>
                <button (click)="selectedFile = null" class="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <div *ngIf="selectedFile" class="mt-4 flex gap-2">
              <button (click)="upload()" [disabled]="uploading" class="btn-primary flex-1 justify-center">
                <span *ngIf="uploading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {{ uploading ? 'Uploading...' : 'Upload & Process' }}
              </button>
              <button (click)="selectedFile = null" class="btn-secondary">Cancel</button>
            </div>
          </div>

          <!-- Result -->
          <div *ngIf="result" class="card mb-4" [class]="result.errors.length ? 'border-yellow-200' : 'border-green-200'">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                [class]="result.errors.length ? 'bg-yellow-100' : 'bg-green-100'">
                <svg *ngIf="!result.errors.length" class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <svg *ngIf="result.errors.length" class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ result.message }}</p>
                <div class="flex gap-4 text-sm text-gray-600 mt-1">
                  <span class="text-green-600">✓ {{ result.inserted }} inserted</span>
                  <span class="text-blue-600">↻ {{ result.updated }} updated</span>
                </div>
                <div *ngIf="result.errors.length" class="mt-2 space-y-1">
                  <p class="text-xs font-medium text-yellow-700">Errors:</p>
                  <p *ngFor="let e of result.errors" class="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">{{ e }}</p>
                </div>
                <a routerLink="/students" class="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2">
                  View students →
                </a>
              </div>
            </div>
          </div>

          <!-- Format Guide -->
          <div class="card">
            <h3 class="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              File Format Guide
            </h3>
            <p class="text-sm text-gray-600 mb-3">Your file must have these columns (case-insensitive):</p>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="text-left px-3 py-2 text-gray-600 font-medium rounded-l-lg">Column</th>
                    <th class="text-left px-3 py-2 text-gray-600 font-medium">Required</th>
                    <th class="text-left px-3 py-2 text-gray-600 font-medium rounded-r-lg">Description</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr><td class="px-3 py-2 font-mono text-blue-600 text-xs">student_id</td><td class="px-3 py-2"><span class="badge-risk">Required</span></td><td class="px-3 py-2 text-gray-600">Unique student identifier</td></tr>
                  <tr><td class="px-3 py-2 font-mono text-blue-600 text-xs">name</td><td class="px-3 py-2"><span class="badge-risk">Required</span></td><td class="px-3 py-2 text-gray-600">Full name</td></tr>
                  <tr><td class="px-3 py-2 font-mono text-blue-600 text-xs">attendance</td><td class="px-3 py-2"><span class="badge-average">Optional</span></td><td class="px-3 py-2 text-gray-600">Attendance percentage (0-100)</td></tr>
                  <tr><td class="px-3 py-2 font-mono text-blue-600 text-xs">math, science, ...</td><td class="px-3 py-2"><span class="badge-average">Optional</span></td><td class="px-3 py-2 text-gray-600">Subject marks (any column name)</td></tr>
                  <tr><td class="px-3 py-2 font-mono text-blue-600 text-xs">remarks</td><td class="px-3 py-2"><span class="badge-average">Optional</span></td><td class="px-3 py-2 text-gray-600">Teacher remarks</td></tr>
                </tbody>
              </table>
            </div>
            <div class="mt-4 p-3 bg-blue-50 rounded-lg">
              <p class="text-xs font-medium text-blue-700 mb-1">Example CSV:</p>
              <pre class="text-xs text-blue-600 font-mono">student_id,name,attendance,math,science,english
STU001,Alice Johnson,92,88,76,91
STU002,Bob Smith,78,62,70,65</pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class UploadComponent {
  sidebarCollapsed = false;
  selectedFile: File | null = null;
  uploading = false;
  isDragging = false;
  result: any = null;

  constructor(private studentService: StudentService) {}

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.result = null;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) { this.selectedFile = file; this.result = null; }
  }

  upload() {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.studentService.uploadFile(this.selectedFile).subscribe({
      next: (res) => { this.result = res; this.uploading = false; this.selectedFile = null; },
      error: (err) => {
        this.result = { message: err.error?.error || 'Upload failed', inserted: 0, updated: 0, errors: [] };
        this.uploading = false;
      }
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
