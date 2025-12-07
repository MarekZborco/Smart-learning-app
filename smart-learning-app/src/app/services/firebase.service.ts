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
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  /**
   * Získa všetky kategórie z kolekcie 'categories'
   */
  getCategories(): Observable<Category[]> {
    const categoriesRef = collection(db, 'categories');
    return from(getDocs(categoriesRef)).pipe(
      map(snapshot => {
        console.log('Načítané kategórie:', snapshot.docs.length);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Kategória:', doc.id, data);
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

  /**
   * Získa detail kategórie
   */
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

  /**
   * Získa otázky pre danú kategóriu
   * Podľa tvojej Firebase štruktúry: categories/{categoryId}/questions
   */
  getQuestions(categoryId: string): Observable<Question[]> {
    const questionsRef = collection(db, `categories/${categoryId}/questions`);
    return from(getDocs(questionsRef)).pipe(
      map(snapshot => {
        console.log(`Načítané otázky pre ${categoryId}:`, snapshot.docs.length);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Otázka data:', doc.id, data);
          
          // Mapovanie dát z Firebase do Question interface
          return {
            id: doc.id,
            question: data['question'] || data['name'] || 'Otázka nenájdená',
            answers: data['answers'] || ['A', 'B', 'C', 'D'], // Default odpovede
            correctAnswer: data['correctAnswer'] ?? 0, // Default 0
            topic: data['topic'] || categoryId,
            difficulty: data['difficulty'] || 'medium',
            points: data['points'] ?? 10 // Default 10 bodov
          } as Question;
        });
      })
    );
  }

  /**
   * Získa konkrétnu otázku
   */
  getQuestion(categoryId: string, questionId: string): Observable<Question | null> {
    const questionRef = doc(db, `categories/${categoryId}/questions`, questionId);
    return from(getDoc(questionRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            question: data['question'] || data['name'] || 'Otázka nenájdená',
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

  /**
   * Pomocná metóda pre testovanie pripojenia
   */
  testConnection(): Observable<boolean> {
    return this.getCategories().pipe(
      map(categories => {
        console.log('Test pripojenia úspešný, kategórie:', categories.length);
        return true;
      })
    );
  }
}