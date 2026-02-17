import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService, CategoryMaterials, MaterialSection } from '../services/firebase.service';
import { CalculatorComponent } from '../calculator/calculator.component';

@Component({
  selector: 'app-materials',
  standalone: true,
  imports: [CommonModule, CalculatorComponent],
  templateUrl: './materials.component.html',
  styleUrl: './materials.component.css'
})
export class MaterialsComponent implements OnInit {
  private firebaseService = inject(FirebaseService);
  private route = inject(ActivatedRoute);

  selectedSubject = signal<string>('matematika');
  selectedCategory = signal<string>('kombinatorika');
  selectedSectionId = signal<string | null>(null);
  materials = signal<CategoryMaterials | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  exerciseSolutionsVisible: Map<string, boolean> = new Map();
  private pendingSection: string | null = null;

  currentSection = computed(() => {
    const sections = this.getSections();
    const selectedId = this.selectedSectionId();

    if (selectedId) {
      return sections.find(s => s.id === selectedId) || sections[0] || null;
    }
    return sections[0] || null;
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const subject = params['subject'] || 'matematika';
      const category = params['category'];
      const section = params['section'];

      this.selectedSubject.set(subject);

      if (category) {
        this.pendingSection = section || null;
        this.selectCategory(category);
      } else {
        const defaultCategory = subject === 'matematika' ? 'kombinatorika' : 'romantizmus';
        this.selectCategory(defaultCategory);
      }
    });
  }

  selectSubject(subject: string) {
    this.selectedSubject.set(subject);
    this.selectedSectionId.set(null);
    this.exerciseSolutionsVisible.clear();

    const defaultCategory = subject === 'matematika' ? 'kombinatorika' : 'romantizmus';
    this.selectCategory(defaultCategory);
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
    this.selectedSectionId.set(null);
    this.exerciseSolutionsVisible.clear();
    this.loadMaterials(category);
  }

  selectSection(sectionId: string) {
    this.selectedSectionId.set(sectionId);
    this.exerciseSolutionsVisible.clear();
  }

  loadMaterials(categoryId: string) {
    this.loading.set(true);
    this.error.set(null);

    this.firebaseService.getMaterials(categoryId).subscribe({
      next: (data) => {
        console.log('Nacitane materialy:', data);
        this.materials.set(data);
        this.loading.set(false);

        if (this.pendingSection && data?.sections) {
          this.findAndSelectSection(this.pendingSection, data.sections);
          this.pendingSection = null;
        } else if (data?.sections && data.sections.length > 0) {
          this.selectedSectionId.set(data.sections[0].id);
        }
      },
      error: (err) => {
        console.error('Chyba pri nacitavani materialov:', err);
        this.error.set('Materiály pre túto kategóriu ešte nie sú dostupné');
        this.loading.set(false);
      }
    });
  }

  findAndSelectSection(sectionName: string, sections: MaterialSection[]) {
    let found = sections.find(s =>
      s.title.toLowerCase() === sectionName.toLowerCase()
    );

    if (!found) {
      found = sections.find(s =>
        s.title.toLowerCase().includes(sectionName.toLowerCase()) ||
        sectionName.toLowerCase().includes(s.title.toLowerCase())
      );
    }

    if (!found) {
      found = sections.find(s => s.id === sectionName);
    }

    if (found) {
      this.selectedSectionId.set(found.id);
    } else if (sections.length > 0) {
      this.selectedSectionId.set(sections[0].id);
    }
  }

  toggleExerciseSolution(sectionId: string, exerciseNumber: string) {
    const key = `${sectionId}-${exerciseNumber}`;
    this.exerciseSolutionsVisible.set(key, !this.exerciseSolutionsVisible.get(key));
  }

  isSolutionVisible(sectionId: string, exerciseNumber: string): boolean {
    const key = `${sectionId}-${exerciseNumber}`;
    return this.exerciseSolutionsVisible.get(key) || false;
  }

  getCategoryName(): string {
    return this.materials()?.categoryName || this.selectedCategory();
  }

  getSections(): MaterialSection[] {
    return this.materials()?.sections || [];
  }
}