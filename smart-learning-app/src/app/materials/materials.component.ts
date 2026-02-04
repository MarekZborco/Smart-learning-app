import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
  private route = inject(ActivatedRoute);

  selectedCategory = signal<string>('kombinatorika');
  selectedSectionId = signal<string | null>(null); 
  materials = signal<CategoryMaterials | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Sledovanie viditeľnosti riešení pre každé cvičenie
  exerciseSolutionsVisible: Map<string, boolean> = new Map();

  // Uloženie query params pre neskoršie použitie
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
    // Čítaj query parametre
    this.route.queryParams.subscribe(params => {
      const category = params['category'];
      const section = params['section'];
      
      if (category) {
        this.pendingSection = section || null;
        this.selectCategory(category);
      } else {
        this.loadMaterials(this.selectedCategory());
      }
    });
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
        
        // Ak máme pending section z URL, nájdi ju
        if (this.pendingSection && data?.sections) {
          this.findAndSelectSection(this.pendingSection, data.sections);
          this.pendingSection = null;
        } else if (data?.sections && data.sections.length > 0) {
          // Inak vyber prvú sekciu
          this.selectedSectionId.set(data.sections[0].id);
        }
      },
      error: (err) => {
        console.error('Chyba pri nacitavani materialov:', err);
        this.error.set('Nepodarilo sa nacitat materialy');
        this.loading.set(false);
      }
    });
  }

  // Metóda na nájdenie a výber sekcie podľa názvu
  findAndSelectSection(sectionName: string, sections: MaterialSection[]) {
    // Najprv skús presné porovnanie
    let found = sections.find(s => 
      s.title.toLowerCase() === sectionName.toLowerCase()
    );
    
    // Ak nenájde, skús čiastočné
    if (!found) {
      found = sections.find(s => 
        s.title.toLowerCase().includes(sectionName.toLowerCase()) ||
        sectionName.toLowerCase().includes(s.title.toLowerCase())
      );
    }
    
    // Skús aj podľa ID sekcie
    if (!found) {
      found = sections.find(s => s.id === sectionName);
    }
    
    if (found) {
      this.selectedSectionId.set(found.id);
      console.log('Nasla sa sekcia:', found.id, found.title);
    } else {
      // Ak nenájde, vyber prvú
      if (sections.length > 0) {
        this.selectedSectionId.set(sections[0].id);
      }
      console.log('Sekcia sa nenasla:', sectionName);
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

  getVideos(): MaterialVideo[] {
    return this.materials()?.videos || [];
  }
}