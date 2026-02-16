import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  ref, 
  set, 
  get,
  update
} from 'firebase/database';
import { auth, realtimeDb } from './firebase.service';

export interface User {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  
  currentUser = this.currentUserSignal.asReadonly();

  constructor(private router: Router) {
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log('onAuthStateChanged - User logged in:', firebaseUser.uid);
        if (!this.currentUserSignal()) {
          this.loadOrCreateUserProfile(firebaseUser);
        }
      } else {
        console.log('onAuthStateChanged - No user logged in');
        this.currentUserSignal.set(null);
      }
    });
  }

  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', credential.user.uid);
      await this.loadOrCreateUserProfile(credential.user);
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: this.getErrorMessage(error.code) 
      };
    }
  }

  async register(name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created:', credential.user.uid);
      
      await updateProfile(credential.user, { displayName: name });
      
      const userProfile: User = {
        id: credential.user.uid,
        name: name,
        email: email,
        joinedDate: new Date().toLocaleDateString('sk-SK'),
        avatar: '👤'
      };
      
      this.currentUserSignal.set(userProfile);
      
      await set(ref(realtimeDb, `users/${credential.user.uid}`), userProfile);
      console.log('Profile saved to database');
      
      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: this.getErrorMessage(error.code) 
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUserSignal.set(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  private async loadOrCreateUserProfile(firebaseUser: any): Promise<void> {
    const fallbackProfile: User = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Používateľ',
      email: firebaseUser.email || '',
      joinedDate: new Date().toLocaleDateString('sk-SK'),
      avatar: '👤'
    };
    
    this.currentUserSignal.set(fallbackProfile);
    
    const userRef = ref(realtimeDb, `users/${firebaseUser.uid}`);
    
    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val() as User;
          this.currentUserSignal.set(userData);
        } else {
          set(userRef, fallbackProfile)
            .then(() => console.log('New profile saved'))
            .catch((err) => console.error('Could not save profile:', err));
        }
      })
      .catch((err) => {
        console.error('Could not load from database:', err);
      });
  }

  async updateUserProfile(name: string, avatar: string): Promise<void> {
    const currentUser = this.currentUserSignal();
    if (!currentUser) return;

    try {
      const updatedUser: User = {
        ...currentUser,
        name: name,
        avatar: avatar
      };

      const userRef = ref(realtimeDb, `users/${currentUser.id}`);
      await update(userRef, updatedUser);
      this.currentUserSignal.set(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  isLoggedIn(): boolean {
    return this.currentUserSignal() !== null;
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'Používateľ neexistuje';
      case 'auth/wrong-password':
        return 'Nesprávne heslo';
      case 'auth/email-already-in-use':
        return 'Email je už používaný';
      case 'auth/weak-password':
        return 'Slabé heslo (min. 6 znakov)';
      case 'auth/invalid-email':
        return 'Neplatný email';
      case 'auth/invalid-credential':
        return 'Nesprávne prihlasovacie údaje';
      default:
        return 'Chyba pri prihlasovaní';
    }
  }
}