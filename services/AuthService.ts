// services/AuthService.ts
import { auth } from '@/firebaseConfig';
import { signInWithEmailAndPassword, signOut  } from 'firebase/auth';

interface LoginResult {
  success: boolean;
  user?: any;
  error?: string;
}


interface LogoutResult {
    success: boolean;
    error?: string;
  }

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return { success: true, user };
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);

    let errorMessage = 'Ocorreu um erro ao tentar fazer login';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Senha incorreta';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    }

    return { success: false, error: errorMessage };
  }
}
export async function logoutUser(): Promise<LogoutResult> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      return { success: false, error: 'Ocorreu um erro ao sair da conta' };
    }
  }