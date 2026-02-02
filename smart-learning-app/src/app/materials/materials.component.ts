import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService, CategoryMaterials, MaterialSection, MaterialVideo } from '../services/firebase.service';
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

  selectedCategory = signal<string>('kombinatorika');
  selectedSectionId = signal<string | null>(null); 
  materials = signal<CategoryMaterials | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Sledovanie viditeľnosti riešení pre každé cvičenie
  exerciseSolutionsVisible: Map<string, boolean> = new Map();

  
  currentSection = computed(() => {
    const sections = this.getSections();
    const selectedId = this.selectedSectionId();
    
    if (selectedId) {
      return sections.find(s => s.id === selectedId) || sections[0] || null;
    }
    return sections[0] || null;
  });

  ngOnInit() {
    this.loadMaterials(this.selectedCategory());
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
    this.selectedSectionId.set(null); // Reset sekcie pri zmene kategórie
    this.exerciseSolutionsVisible.clear();
    this.loadMaterials(category);
  }

  selectSection(sectionId: string) {
    this.selectedSectionId.set(sectionId);
    this.exerciseSolutionsVisible.clear(); // Reset riešení pri zmene sekcie
  }

  loadMaterials(categoryId: string) {
    this.loading.set(true);
    this.error.set(null);
    
    this.firebaseService.getMaterials(categoryId).subscribe({
      next: (data) => {
        console.log('Načítané materiály:', data);
        this.materials.set(data);
        this.loading.set(false);
        
        // Automaticky vyber prvú sekciu
        if (data?.sections && data.sections.length > 0) {
          this.selectedSectionId.set(data.sections[0].id);
        }
      },
      error: (err) => {
        console.error('Chyba pri načítavaní materiálov:', err);
        this.error.set('Nepodarilo sa načítať materiály');
        this.loading.set(false);
      }
    });
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

  getVideos(): MaterialVideo[] {
    return this.materials()?.videos || [];
  }
}