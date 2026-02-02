import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Observable, from, map } from 'rxjs';

const firebaseConfig = {
  apiKey: "AIzaSyDtjpVuzgDuVTmIbUyUiQdT2KJ1id6mNhs",
  authDomain: "smartlearningapp-19324.firebaseapp.com",
  projectId: "smartlearningapp-19324",
  storageBucket: "smartlearningapp-19324.firebasestorage.app",
  messagingSenderId: "1096387359118",
  appId: "1:1096387359118:web:6c32db4979af934747f4df"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface Category {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  explanation?: string;  // NOVÉ - vysvetlenie
}

export interface MaterialSection {
  id: string;
  title: string;
  order: number;
  theory: string;
  formulas: string[];
  examples: MaterialExample[];
  exercises: MaterialExercise[];
}

export interface MaterialExample {
  number: string;
  problem: string;
  solution: SolutionStep[];
  answer: string;
}

export interface SolutionStep {
  step: number;
  text: string;
}

export interface MaterialExercise {
  number: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solution?: SolutionStep[];  // PRIDANÉ - opcionálne riešenie
  answer?: string;            // PRIDANÉ - opcionálna odpoveď
}

export interface MaterialVideo {
  title: string;
  videoId: string;
  thumbnail: string;
  description: string;
}

export interface CategoryMaterials {
  categoryId: string;
  categoryName: string;
  sections: MaterialSection[];
  videos: MaterialVideo[];
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  getCategories(): Observable<Category[]> {
    const categoriesRef = collection(db, 'categories');
    return from(getDocs(categoriesRef)).pipe(
      map(snapshot => {
        console.log('Nacitane kategorie:', snapshot.docs.length);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Kategoria:', doc.id, data);
          return {
            id: doc.id,
            name: data['name'] || doc.id,
            description: data['description'] || '',
            order: data['order'] || 0
          } as Category;
        });
      })
    );
  }

  getCategory(categoryId: string): Observable<Category | null> {
    const categoryRef = doc(db, 'categories', categoryId);
    return from(getDoc(categoryRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data['name'] || docSnap.id,
            description: data['description'] || '',
            order: data['order'] || 0
          } as Category;
        }
        return null;
      })
    );
  }

  getQuestions(categoryId: string): Observable<Question[]> {
  const questionsRef = collection(db, `categories/${categoryId}/questions`);
  return from(getDocs(questionsRef)).pipe(
    map(snapshot => {
      console.log(`Nacitane otazky pre ${categoryId}:`, snapshot.docs.length);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Otazka data:', doc.id, data);
        
        return {
          id: doc.id,
          question: data['question'] || data['name'] || 'Otazka nenajdena',
          answers: data['answers'] || ['A', 'B', 'C', 'D'],
          correctAnswer: data['correctAnswer'] ?? 0,
          topic: data['topic'] || categoryId,
          difficulty: data['difficulty'] || 'medium',
          points: data['points'] ?? 10,
          explanation: data['explanation'] || ''  // NOVÉ
        } as Question;
      });
    })
  );
}

  getQuestion(categoryId: string, questionId: string): Observable<Question | null> {
    const questionRef = doc(db, `categories/${categoryId}/questions`, questionId);
    return from(getDoc(questionRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            question: data['question'] || data['name'] || 'Otazka nenajdena',
            answers: data['answers'] || ['A', 'B', 'C', 'D'],
            correctAnswer: data['correctAnswer'] ?? 0,
            topic: data['topic'] || categoryId,
            difficulty: data['difficulty'] || 'medium',
            points: data['points'] ?? 10
          } as Question;
        }
        return null;
      })
    );
  }

  getMaterials(categoryId: string): Observable<CategoryMaterials | null> {
    const materialsRef = doc(db, 'materials', categoryId);
    return from(getDoc(materialsRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            categoryId: categoryId,
            categoryName: data['categoryName'] || categoryId,
            sections: data['sections'] || [],
            videos: data['videos'] || []
          } as CategoryMaterials;
        }
        return null;
      })
    );
  }

  testConnection(): Observable<boolean> {
    return this.getCategories().pipe(
      map(categories => {
        console.log('Test pripojenia uspesny, kategorie:', categories.length);
        return true;
      })
    );
  }
}
