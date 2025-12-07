import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService, Category } from '../services/firebase.service';

interface Material {
  title: string;
  type: 'video' | 'article' | 'quiz';
  url: string;
  thumbnail?: string;
  description: string;
  category: string;
}

@Component({
  selector: 'app-materials',
  standalone: true,
  imports: [CommonModule],  // <-- DÔLEŽITÉ!
  templateUrl: './materials.component.html',
  styleUrl: './materials.component.css'
})
export class MaterialsComponent implements OnInit {
  firebaseService = inject(FirebaseService);
  
  categories = signal<Category[]>([]);
  selectedCategory = signal<string>('kombinatorika');
  materials = signal<Material[]>([]);
  loading = true;

  ngOnInit() {
    this.loadCategories();
    this.loadMaterials();
  }

  loadCategories() {
    this.firebaseService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats.sort((a, b) => a.order - b.order));
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  loadMaterials() {
    // Mock data zatiaľ
    const mockMaterials: Material[] = [
      {
        title: 'Kombinatorika - Úvod',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=example1',
        thumbnail: 'https://img.youtube.com/vi/example1/mqdefault.jpg',
        description: 'Základy kombinatoriky',
        category: 'kombinatorika'
      }
    ];

    this.materials.set(mockMaterials);
    this.loading = false;
  }

  selectCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
  }

  get filteredMaterials() {
    return this.materials().filter(m => m.category === this.selectedCategory());
  }
}