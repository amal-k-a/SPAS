import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <div class="flex min-h-screen bg-[#F3F4F6] relative overflow-hidden">
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-yellow-100/40 blur-[100px] rounded-full"></div>

      <app-sidebar [collapsed]="sidebarCollapsed" (toggleCollapsed)="sidebarCollapsed = !sidebarCollapsed"></app-sidebar>

      <main [class]="'flex-1 transition-all duration-500 relative z-10 ' + (sidebarCollapsed ? 'ml-16' : 'ml-64')">
        <div class="p-8 max-w-4xl mx-auto">
          <div class="mb-10">
            <h1 class="text-3xl font-black text-[#1C1C1C] tracking-tight">Data Import</h1>
            <p class="text-gray-500 text-sm font-medium mt-1">Sync your student database via CSV or Excel</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
              <div class="card p-2 border-none shadow-xl shadow-black/5 overflow-hidden">
                <div 
                  class="border-4 border-dashed rounded-[2rem] p-12 text-center transition-all duration-300 relative"
                  [class]="isDragging ? 'border-yellow-400 bg-yellow-50/50 scale-[0.98]' : 'border-gray-100 hover:border-gray-200'"
                  (dragover)="onDragOver($event)" 
                  (dragleave)="isDragging = false" 
                  (drop)="onDrop($event)">
                  
                  <input type="file" #fileInput accept=".xlsx,.xls,.csv" (change)="onFileSelect($event)" class="hidden">

                  <div *ngIf="!selectedFile" class="space-y-4">
                    <div class="w-20 h-20 bg-[#1C1C1C] rounded-[2rem] flex items-center justify-center mx-auto shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300">
                      <svg class="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-[#1C1C1C] font-black text-lg tracking-tight">Drop file here</p>
                      <p class="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-1">or click to browse local files</p>
                    </div>
                    <button (click)="fileInput.click()" class="btn-primary px-8 py-3 text-[10px] uppercase tracking-widest font-black">
                      Browse Files
                    </button>
                    <p class="text-[10px] text-gray-300 font-bold uppercase tracking-tighter pt-4">XLSX, CSV • MAX 16MB</p>
                  </div>

                  <div *ngIf="selectedFile" class="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div class="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                      <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <p class="font-black text-[#1C1C1C] mb-1">{{ selectedFile.name }}</p>
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">{{ formatSize(selectedFile.size) }}</p>
                    
                    <div class="flex gap-3 mt-8 w-full">
                      <button (click)="upload()" [disabled]="uploading" class="btn-primary flex-1 py-4 text-[10px] uppercase tracking-widest font-black shadow-lg shadow-black/10">
                        <span *ngIf="uploading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                        {{ uploading ? 'Processing...' : 'Upload & Process' }}
                      </button>
                      <button (click)="selectedFile = null" class="btn-secondary px-6 text-[10px] uppercase tracking-widest font-black">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="result" class="card border-none shadow-xl shadow-black/5 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                <div class="p-6 flex items-start gap-5">
                  <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    [class]="result.errors.length ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path *ngIf="!result.errors.length" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                      <path *ngIf="result.errors.length" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="font-black text-[#1C1C1C] text-lg">{{ result.message }}</p>
                    <div class="flex gap-6 mt-2">
                      <div class="flex flex-col">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inserted</span>
                        <span class="text-lg font-black text-green-600">{{ result.inserted }}</span>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Updated</span>
                        <span class="text-lg font-black text-blue-600">{{ result.updated }}</span>
                      </div>
                    </div>
                    
                    <div *ngIf="result.errors.length" class="mt-4 p-4 bg-amber-50 rounded-2xl space-y-2">
                      <p class="text-[10px] font-black text-amber-700 uppercase tracking-widest">Validation Errors</p>
                      <p *ngFor="let e of result.errors" class="text-xs text-amber-600 font-bold">• {{ e }}</p>
                    </div>
                    
                    <a routerLink="/students" class="inline-flex items-center gap-2 mt-6 text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em] hover:text-yellow-700 transition-colors">
                      View Records Directory →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div class="card border-none shadow-xl shadow-black/5 bg-[#1C1C1C] text-white p-8">
                <h3 class="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-6">Column Mapping</h3>
                <div class="space-y-4">
                  <div class="flex items-center justify-between border-b border-white/10 pb-3">
                    <span class="text-xs font-bold font-mono">student_id</span>
                    <span class="text-[8px] font-black bg-rose-500 px-2 py-0.5 rounded text-white uppercase">Required</span>
                  </div>
                  <div class="flex items-center justify-between border-b border-white/10 pb-3">
                    <span class="text-xs font-bold font-mono">name</span>
                    <span class="text-[8px] font-black bg-rose-500 px-2 py-0.5 rounded text-white uppercase">Required</span>
                  </div>
                  <div class="flex items-center justify-between border-b border-white/10 pb-3">
                    <span class="text-xs font-bold font-mono text-gray-400">attendance</span>
                    <span class="text-[8px] font-black bg-gray-600 px-2 py-0.5 rounded text-white uppercase">Optional</span>
                  </div>
                  <div class="flex items-center justify-between border-b border-white/10 pb-3">
                    <span class="text-xs font-bold font-mono text-gray-400">subject_marks</span>
                    <span class="text-[8px] font-black bg-gray-600 px-2 py-0.5 rounded text-white uppercase">Optional</span>
                  </div>
                </div>
                
                <div class="mt-10 pt-6 border-t border-white/10">
                   <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Sample Structure</p>
                   <div class="bg-black/40 rounded-xl p-4 font-mono text-[10px] text-yellow-100/70 leading-relaxed overflow-x-auto">
                     student_id,name,math,science<br>
                     STU01,John Doe,85,90<br>
                     STU02,Jane Smith,72,88
                   </div>
                </div>
              </div>
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
    if (file) { 
      this.selectedFile = file; 
      this.result = null; 
    }
  }

  upload() {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.studentService.uploadFile(this.selectedFile).subscribe({
      next: (res) => { 
        this.result = res; 
        this.uploading = false; 
        this.selectedFile = null; 
      },
      error: (err) => {
        this.result = { 
          message: err.error?.error || 'Upload failed', 
          inserted: 0, 
          updated: 0, 
          errors: [err.message] 
        };
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