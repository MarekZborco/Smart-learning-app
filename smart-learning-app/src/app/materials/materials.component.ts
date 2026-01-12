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
  imports: [CommonModule],
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
  }

  loadCategories() {
    this.firebaseService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
      }
    });
  }

  selectCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
  }

  // Materiály pre jednotlivé kategórie
  getMaterialsForCategory(category: string) {
    const allMaterials: { [key: string]: any } = {
      kombinatorika: {
        videos: [
          {
            title: 'Kombinatorické pravidlo súčinu',
            description: 'Základné pravidlo kombinatoriky - ako postupovať pri výpočtoch',
            url: 'https://www.youtube.com/results?search_query=kombinatorika+pravidlo+súčinu'
          },
          {
            title: 'Variácie s opakovaním',
            description: 'Pochopenie variácií, kde sa prvky môžu opakovať',
            url: 'https://www.youtube.com/results?search_query=variácie+s+opakovaním'
          },
          {
            title: 'Permutácie a faktoriál',
            description: 'Vysvetlenie permutácií a práce s faktoriálom',
            url: 'https://www.youtube.com/results?search_query=permutácie+faktoriál'
          }
        ],
        exercises: [
          { number: '1.1', text: 'Určte, koľko dvojjazyčných slovníkov sa musí vydať pre 4 jazyky', difficulty: 'easy' },
          { number: '1.2', text: 'Z mesta A do mesta D cez B a C - počet ciest', difficulty: 'easy' },
          { number: '1.12', text: 'Koľko štvorciferných čísel z číslic 1,2,3,4,5?', difficulty: 'medium' },
          { number: '1.20', text: 'Výber predsedu, podpredsedu z 10 ľudí', difficulty: 'medium' }
        ],
        theory: [
          {
            title: 'Kombinatorické pravidlo súčinu',
            content: 'Ak tvoríme usporiadané dvojice, kde prvý člen môžeme vybrať n₁ spôsobmi a druhý člen n₂ spôsobmi, celkový počet je',
            formula: 'n₁ × n₂ = počet všetkých možností'
          },
          {
            title: 'Variácie s opakovaním',
            content: 'Variácie k-tej triedy z n prvkov s opakovaním:',
            formula: "V'ₖ(n) = nᵏ",
            note: 'Prvky sa môžu opakovať, záleží na poradí'
          },
          {
            title: 'Permutácie',
            content: 'Počet všetkých usporiadaní n prvkov:',
            formula: 'P(n) = n!',
            note: 'n! = n × (n-1) × (n-2) × ... × 2 × 1'
          },
          {
            title: 'Kombinácie',
            content: 'Výber k prvkov z n prvkov (nezáleží na poradí):',
            formula: 'C(n,k) = n! / (k! × (n-k)!)',
            note: 'Nezáleží na poradí výberu'
          }
        ]
      },
      pravdepodobnost: {
        videos: [
          {
            title: 'Klasická pravdepodobnosť',
            description: 'Úvod do pravdepodobnosti - základné pojmy',
            url: 'https://www.youtube.com/results?search_query=pravdepodobnosť+základy'
          },
          {
            title: 'Nezávislé javy',
            description: 'Pravdepodobnosť súčinu nezávislých javov',
            url: 'https://www.youtube.com/results?search_query=nezávislé+javy+pravdepodobnosť'
          },
          {
            title: 'Podmienená pravdepodobnosť',
            description: 'Výpočet podmienenej pravdepodobnosti',
            url: 'https://www.youtube.com/results?search_query=podmienená+pravdepodobnosť'
          }
        ],
        exercises: [
          { number: '2.1', text: 'Pravdepodobnosť hodenia párneho čísla na kocke', difficulty: 'easy' },
          { number: '2.2', text: 'Výber farebnej guľôčky z vrecka', difficulty: 'easy' },
          { number: '2.3', text: 'Pravdepodobnosť šestky pri hodení dvoch kociek', difficulty: 'hard' },
          { number: '2.4', text: 'Súčin pravdepodobností nezávislých javov', difficulty: 'medium' }
        ],
        theory: [
          {
            title: 'Klasická pravdepodobnosť',
            content: 'Pravdepodobnosť náhodného javu A:',
            formula: 'P(A) = priaznivé výsledky / všetky možné výsledky',
            note: 'Platí: 0 ≤ P(A) ≤ 1'
          },
          {
            title: 'Nezávislé javy',
            content: 'Ak sú javy A a B nezávislé:',
            formula: 'P(A ∩ B) = P(A) × P(B)',
            note: 'Výskyt jedného javu neovplyvňuje druhý'
          },
          {
            title: 'Opačný jav',
            content: 'Pravdepodobnosť opačného javu:',
            formula: "P(A') = 1 - P(A)",
            note: "A' je jav ktorý nastane keď A nenastane"
          },
          {
            title: 'Zjednotenie javov',
            content: 'Pre ľubovoľné javy A a B:',
            formula: 'P(A ∪ B) = P(A) + P(B) - P(A ∩ B)',
            note: 'Odčítame prienik aby sme nepočítali 2x'
          }
        ]
      },
      statistika: {
        videos: [
          {
            title: 'Aritmetický priemer a medián',
            description: 'Výpočet základných charakteristík polohy',
            url: 'https://www.youtube.com/results?search_query=aritmetický+priemer+medián'
          },
          {
            title: 'Rozptyl a smerodajná odchýlka',
            description: 'Charakteristiky variability dát',
            url: 'https://www.youtube.com/results?search_query=rozptyl+smerodajná+odchýlka'
          },
          {
            title: 'Modus a kvartily',
            description: 'Ďalšie štatistické charakteristiky',
            url: 'https://www.youtube.com/results?search_query=modus+kvartily+štatistika'
          }
        ],
        exercises: [
          { number: '3.1', text: 'Výpočet aritmetického priemeru zo súboru dát', difficulty: 'easy' },
          { number: '3.2', text: 'Určenie mediánu zo zoradeného súboru', difficulty: 'easy' },
          { number: '3.3', text: 'Výpočet rozptylu dát', difficulty: 'medium' },
          { number: '3.4', text: 'Nájdenie módu v dátovom súbore', difficulty: 'easy' }
        ],
        theory: [
          {
            title: 'Aritmetický priemer',
            content: 'Priemer n čísel x₁, x₂, ..., xₙ:',
            formula: 'x̄ = (x₁ + x₂ + ... + xₙ) / n',
            note: 'Suma všetkých hodnôt delená ich počtom'
          },
          {
            title: 'Medián',
            content: 'Stredná hodnota zoradeného súboru:',
            formula: 'Me = prostredná hodnota (alebo priemer dvoch prostredných)',
            note: '50% hodnôt je menších, 50% väčších'
          },
          {
            title: 'Modus',
            content: 'Najčastejšie sa vyskytujúca hodnota:',
            formula: 'Mo = hodnota s najväčšou frekvenciou',
            note: 'Môže byť viac módov alebo žiadny'
          },
          {
            title: 'Rozptyl',
            content: 'Miera variability dát okolo priemeru:',
            formula: 'σ² = Σ(xᵢ - x̄)² / n',
            note: 'Čím väčší rozptyl, tým rozptýlenejšie dáta'
          }
        ]
      },
      postupnosti: {
        videos: [
          {
            title: 'Aritmetická postupnosť',
            description: 'Postupnosti s konštantným rozdielom',
            url: 'https://www.youtube.com/results?search_query=aritmetická+postupnosť'
          },
          {
            title: 'Geometrická postupnosť',
            description: 'Postupnosti s konštantným kvocientom',
            url: 'https://www.youtube.com/results?search_query=geometrická+postupnosť'
          },
          {
            title: 'Súčet členov postupnosti',
            description: 'Výpočet súčtu prvých n členov',
            url: 'https://www.youtube.com/results?search_query=súčet+postupnosti'
          }
        ],
        exercises: [
          { number: '4.1', text: 'Nájdi ďalší člen aritmetickej postupnosti', difficulty: 'easy' },
          { number: '4.2', text: 'Použitie vzorca pre n-tý člen', difficulty: 'medium' },
          { number: '4.3', text: 'Nájdi ďalší člen geometrickej postupnosti', difficulty: 'easy' },
          { number: '4.4', text: 'Vypočítaj súčet prvých 5 členov', difficulty: 'medium' }
        ],
        theory: [
          {
            title: 'Aritmetická postupnosť',
            content: 'Každý člen vznikne pridaním konštanty d:',
            formula: 'aₙ = a₁ + (n-1)d',
            note: 'd je diference (rozdiel medzi členmi)'
          },
          {
            title: 'Geometrická postupnosť',
            content: 'Každý člen vznikne vynásobením konštantou q:',
            formula: 'aₙ = a₁ × qⁿ⁻¹',
            note: 'q je kvocient (podiel susedných členov)'
          },
          {
            title: 'Súčet aritmetickej postupnosti',
            content: 'Súčet prvých n členov:',
            formula: 'Sₙ = n(a₁ + aₙ) / 2',
            note: 'Alebo Sₙ = n(2a₁ + (n-1)d) / 2'
          },
          {
            title: 'Súčet geometrickej postupnosti',
            content: 'Súčet prvých n členov (q ≠ 1):',
            formula: 'Sₙ = a₁(qⁿ - 1) / (q - 1)',
            note: 'Pre |q| < 1 existuje súčet nekonečnej postupnosti'
          }
        ]
      }
    };

    return allMaterials[category] || allMaterials['kombinatorika'];
  }
}