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
        console.log('User logged in:', firebaseUser.uid);
        this.loadOrCreateUserProfile(firebaseUser);
      } else {
        console.log('No user logged in');
        this.currentUserSignal.set(null);
      }
    });
  }

  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', credential.user.uid);
      
      const fallbackProfile: User = {
        id: credential.user.uid,
        name: credential.user.displayName || email.split('@')[0],
        email: email,
        joinedDate: new Date().toLocaleDateString('sk-SK')
      };
      this.currentUserSignal.set(fallbackProfile);
      
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
        joinedDate: new Date().toLocaleDateString('sk-SK')
      };
      
      this.currentUserSignal.set(userProfile);
      
      set(ref(realtimeDb, `users/${credential.user.uid}`), userProfile)
        .then(() => console.log('Profile saved to database'))
        .catch((err) => console.error('Could not save to database:', err));
      
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
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  private loadOrCreateUserProfile(firebaseUser: any): void {
    if (this.currentUserSignal() !== null) {
      console.log('Profile already set');
      return;
    }

    const fallbackProfile: User = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Používateľ',
      email: firebaseUser.email || '',
      joinedDate: new Date().toLocaleDateString('sk-SK')
    };

    this.currentUserSignal.set(fallbackProfile);

    const userRef = ref(realtimeDb, `users/${firebaseUser.uid}`);
    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val() as User;
          this.currentUserSignal.set(userData);
          console.log('Profile loaded from database:', userData);
        }
      })
      .catch((err) => console.error('Could not load from database:', err));
  }

  async updateUser(user: User): Promise<void> {
    try {
      const userRef = ref(realtimeDb, `users/${user.id}`);
      await update(userRef, user);
      this.currentUserSignal.set(user);
      console.log('User updated:', user);
    } catch (error) {
      console.error('Error updating user:', error);
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