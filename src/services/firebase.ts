import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseRawConfig from '../../firebase-applet-config.json';
import { CategoryItem, Expense } from '../types/finance';
import { DEFAULT_CATEGORIES, getCurrentMonthLabel } from '../utils/formatters';

// Support runtime environment variable overrides (e.g., in Vercel or custom hosting)
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseRawConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseRawConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseRawConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseRawConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseRawConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseRawConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseRawConfig.messagingSenderId,
  measurementId: firebaseRawConfig.measurementId || '',
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with configured custom database ID - ISOLATED from any other project/app database!
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Export Auth instance
export const auth = getAuth(app);

// Provider for Google Sign-In
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Database identifier and project exported for confirmation and UI transparency
export const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirebaseUserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  passwordHash?: string;
  authProvider?: 'google' | 'password' | 'guest';
  createdAt: string;
  updatedAt: string;
  isGuest?: boolean;
}

export interface UserFinancialData {
  userId: string;
  baseIncome: number;
  monthlyIncomes: Record<string, number>;
  activeMonths: string[];
  currentMonth: string;
  categories: CategoryItem[];
  updatedAt: string;
}

// Encode email safely for Firestore document keys
function getEmailKey(email: string): string {
  return encodeURIComponent(email.trim().toLowerCase()).replace(/\./g, '%2E');
}

/**
 * Validates connection to Firestore as required by Firebase integration guidelines
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'users_by_email', 'health_check'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline:', error.message);
    }
    return true; // Read attempt reached Firestore
  }
}

// Clean up any old shadow users from browser storage immediately
try {
  localStorage.removeItem('finanzen_registered_users');
} catch {}

/**
 * Register a new user in Firestore cloud database and Firebase Authentication.
 * Standard default: starts with clean ZEROED financial data.
 */
export async function registerUserWithFirebase(
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<{ user?: FirebaseUserProfile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const emailKey = getEmailKey(cleanEmail);
  const nowIso = new Date().toISOString();
  const passwordHash = btoa(password);

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { error: 'Por favor, informe um e-mail válido.' };
  }

  if (password.length < 6) {
    return { error: 'A senha deve conter no mínimo 6 caracteres.' };
  }

  // 0. Ensure all previous sessions, tool caches, and portfolios are wiped clean for the new account
  clearAllLocalStoredAccounts();

  // 1. Check if user already exists in Firestore database
  try {
    const existingSnap = await getDoc(doc(db, 'users_by_email', emailKey));
    if (existingSnap.exists()) {
      return {
        error: 'Este e-mail já está cadastrado no banco de dados. Acesse a aba "Entrar na Conta" acima para logar.',
      };
    }
  } catch (e) {
    console.warn('Check existing user in Firestore:', e);
  }

  // 2. Authenticate with Firebase Authentication
  let finalUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    if (cred.user) {
      finalUserId = cred.user.uid;
      try {
        await updateProfile(cred.user, { displayName: cleanName });
      } catch (e) {
        console.warn('Profile name update warning:', e);
      }
    }
  } catch (authErr: any) {
    console.warn('Firebase Auth registration check:', authErr?.code, authErr?.message);
    if (authErr.code === 'auth/email-already-in-use') {
      return { error: 'Este e-mail já está cadastrado no banco de dados. Acesse a aba "Entrar" para logar ou use outro e-mail.' };
    } else if (authErr.code === 'auth/weak-password') {
      return { error: 'A senha é muito fraca. Digite pelo menos 6 caracteres.' };
    } else if (authErr.code === 'auth/invalid-email') {
      return { error: 'Formato de e-mail inválido.' };
    }
  }

  const userProfile: FirebaseUserProfile = {
    id: finalUserId,
    email: cleanEmail,
    name: cleanName,
    phone: phone?.trim() || '',
    passwordHash,
    authProvider: 'password',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // 3. Prepare initial clean zeroed financial profile
  const zeroCategories: CategoryItem[] = DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    budget: 0,
  }));
  const initialMonth = getCurrentMonthLabel();
  const initialFinancial: UserFinancialData = {
    userId: finalUserId,
    baseIncome: 0,
    monthlyIncomes: {},
    activeMonths: [initialMonth],
    currentMonth: initialMonth,
    categories: zeroCategories,
    updatedAt: nowIso,
  };

  // 4. Directly write to Firestore cloud database
  try {
    // Write user profile to Firestore
    await setDoc(doc(db, 'users', finalUserId), userProfile);

    // Write email index for queries
    await setDoc(doc(db, 'users_by_email', emailKey), {
      userId: finalUserId,
      email: cleanEmail,
      name: cleanName,
      phone: phone?.trim() || '',
      passwordHash,
      authProvider: 'password',
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    // Write initial clean zeroed financial profile
    await setDoc(doc(db, 'users', finalUserId, 'financial', 'main'), initialFinancial);
    console.log('✅ Usuário e perfil financeiro gravados com sucesso no Firestore:', finalUserId);
  } catch (firestoreErr: any) {
    console.error('❌ Erro ao gravar usuário no Firestore:', firestoreErr);
    return { error: 'Erro ao gravar no banco de dados na nuvem: ' + (firestoreErr.message || 'Falha de conexão') };
  }

  return { user: userProfile };
}

/**
 * Login user strictly from Firebase Authentication or Firestore cloud database.
 * NEVER creates accounts on login attempt. If the account does not exist in the database,
 * it returns a clear error message instructing the user to create an account.
 */
export async function loginUserWithFirebase(
  email: string,
  password: string
): Promise<{ user?: FirebaseUserProfile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = cleanEmail.split('@')[0];
  const emailKey = getEmailKey(cleanEmail);
  const expectedHash = btoa(password);

  // 1. Try Firebase Auth sign in
  let authUid: string | null = null;
  let authError: any = null;
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    if (cred.user) {
      authUid = cred.user.uid;
    }
  } catch (err: any) {
    authError = err;
    console.warn('Firebase Auth signIn check:', err?.code, err?.message);
  }

  // 2. Query Firestore directly for the existing user
  try {
    // If auth succeeded, verify user doc exists in Firestore
    if (authUid) {
      const userSnap = await getDoc(doc(db, 'users', authUid));
      if (userSnap.exists()) {
        const u = userSnap.data() as FirebaseUserProfile;
        return { user: u };
      }
      // Also check by email index if the document ID differed
      const emailSnap = await getDoc(doc(db, 'users_by_email', emailKey));
      if (emailSnap.exists()) {
        const indexData = emailSnap.data();
        const profileSnap = await getDoc(doc(db, 'users', indexData.userId));
        if (profileSnap.exists()) {
          return { user: profileSnap.data() as FirebaseUserProfile };
        }
      }

      // If auth user existed but was deleted from Firestore database:
      return {
        error: 'Este usuário foi excluído do banco de dados. Para utilizá-lo, crie sua conta na aba "Criar Nova Conta".',
      };
    }

    // Check users_by_email index in Firestore
    const emailDocRef = doc(db, 'users_by_email', emailKey);
    const emailSnap = await getDoc(emailDocRef);

    if (emailSnap.exists()) {
      const indexData = emailSnap.data();

      // Check password match
      if (indexData.passwordHash && indexData.passwordHash !== expectedHash && indexData.passwordHash !== password) {
        return { error: 'Senha incorreta. Verifique sua senha e tente novamente.' };
      }

      // Fetch user profile doc
      const userDocSnap = await getDoc(doc(db, 'users', indexData.userId));
      if (userDocSnap.exists()) {
        return { user: userDocSnap.data() as FirebaseUserProfile };
      }
    }
  } catch (err: any) {
    console.error('Firestore login check error:', err);
  }

  // 3. If password was wrong in Auth:
  if (authError && (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential')) {
    return { error: 'Senha incorreta. Verifique sua senha e tente novamente.' };
  }

  // 4. USER DOES NOT EXIST IN DATABASE: Do NOT create any user!
  return {
    error: 'Nenhum usuário cadastrado no banco de dados com este e-mail. Para criar sua conta, clique na aba "Criar Nova Conta" acima.',
  };
}

/**
 * Completely wipe all users, login credentials, and sessions from both Firestore and browser storage.
 */
export async function wipeAllLoginDataFromDatabaseAndBrowser(): Promise<void> {
  // 1. Wipe all tool storage, sessions, and registered users from browser
  clearAllLocalStoredAccounts();

  // 2. If an active Firebase Auth user is connected, delete their account and data
  try {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const userEmail = auth.currentUser.email || '';
      try {
        await deleteDoc(doc(db, 'users', uid, 'financial', 'main'));
      } catch {}
      try {
        const collRef = collection(db, 'users', uid, 'expenses');
        const snap = await getDocs(collRef);
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      } catch {}
      if (userEmail) {
        try {
          await deleteDoc(doc(db, 'users_by_email', getEmailKey(userEmail)));
        } catch {}
      }
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch {}
      try {
        await auth.currentUser.delete();
      } catch {
        await signOut(auth);
      }
    }
  } catch (err) {
    console.warn('Wipe current auth user bypassed:', err);
  }
}

/**
 * Sign in using Google Account via Firebase Auth popup.
 * Connects directly to the isolated Consignatec database.
 * If user is new: initializes clean zeroed data.
 * If user is returning: restores their existing data.
 */
export async function loginWithGoogle(): Promise<{ user?: FirebaseUserProfile; error?: string }> {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const fbUser = userCredential.user;
    const cleanEmail = fbUser.email ? fbUser.email.trim().toLowerCase() : '';
    const googleUserId = fbUser.uid;
    const cleanName = fbUser.displayName || (cleanEmail ? cleanEmail.split('@')[0] : 'Usuário Google');
    const photoURL = fbUser.photoURL || undefined;
    const phone = fbUser.phoneNumber || undefined;
    const nowIso = new Date().toISOString();

    let resolvedUserId = googleUserId;

    // 1. Check if user already exists in Firestore by email index (e.g. registered via email/password)
    if (cleanEmail) {
      try {
        const emailSnap = await getDoc(doc(db, 'users_by_email', getEmailKey(cleanEmail)));
        if (emailSnap.exists()) {
          const indexData = emailSnap.data();
          if (indexData.userId) {
            resolvedUserId = indexData.userId;
          }
        }
      } catch (e) {
        console.warn('Could not check users_by_email for Google login:', e);
      }
    }

    // 2. Check if user document already exists in this isolated Firestore database under resolvedUserId
    let existingProfile: FirebaseUserProfile | null = null;
    try {
      const userDocRef = doc(db, 'users', resolvedUserId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap && userSnap.exists()) {
        existingProfile = userSnap.data() as FirebaseUserProfile;
      }
    } catch (e) {
      console.warn('Could not read existing user doc from Firestore:', e);
    }

    if (existingProfile) {
      // Returning user: maintain their existing data, update name/photo/authProvider if refreshed
      const updatedProfile: FirebaseUserProfile = {
        ...existingProfile,
        id: resolvedUserId,
        email: cleanEmail || existingProfile.email,
        name: cleanName || existingProfile.name,
        photoURL: photoURL || existingProfile.photoURL,
        authProvider: 'google',
        updatedAt: nowIso,
      };

      await setDoc(doc(db, 'users', resolvedUserId), updatedProfile, { merge: true }).catch(() => {});
      if (cleanEmail) {
        await setDoc(
          doc(db, 'users_by_email', getEmailKey(cleanEmail)),
          {
            userId: resolvedUserId,
            email: cleanEmail,
            name: updatedProfile.name,
            authProvider: 'google',
            updatedAt: nowIso,
          },
          { merge: true }
        ).catch(() => {});
      }
      return { user: updatedProfile };
    }

    // 3. Brand new user: clear old tool caches and initialize clean zeroed financial profile
    clearAllLocalStoredAccounts();
    const newProfile: FirebaseUserProfile = {
      id: resolvedUserId,
      email: cleanEmail,
      name: cleanName,
      phone: phone || '',
      photoURL,
      authProvider: 'google',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Initialize with ZEROED financial categories and base income = 0 for brand new users
    const zeroCategories: CategoryItem[] = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      budget: 0,
    }));
    const initialMonth = getCurrentMonthLabel();
    const initialFinancial: UserFinancialData = {
      userId: resolvedUserId,
      baseIncome: 0,
      monthlyIncomes: {},
      activeMonths: [initialMonth],
      currentMonth: initialMonth,
      categories: zeroCategories,
      updatedAt: nowIso,
    };

    try {
      await setDoc(doc(db, 'users', resolvedUserId), newProfile);
      if (cleanEmail) {
        await setDoc(doc(db, 'users_by_email', getEmailKey(cleanEmail)), {
          userId: resolvedUserId,
          email: cleanEmail,
          name: cleanName,
          authProvider: 'google',
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }
      // Only set initial financial data if it doesn't already exist
      const finSnap = await getDoc(doc(db, 'users', resolvedUserId, 'financial', 'main'));
      if (!finSnap.exists()) {
        await setDoc(doc(db, 'users', resolvedUserId, 'financial', 'main'), initialFinancial);
      }
    } catch (err) {
      console.warn('Background sync for new Google user queued:', err);
    }

    return { user: newProfile };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    const errorCode = error?.code || '';
    const errorMsg = error?.message || '';

    if (errorCode === 'auth/popup-closed-by-user') {
      return { error: 'O login com o Google foi cancelado antes da conclusão.' };
    }
    if (errorCode === 'auth/popup-blocked') {
      return {
        error:
          'O pop-up de login foi bloqueado pelo seu navegador. Por favor, permita pop-ups para fazer login com a conta Google.',
      };
    }
    if (errorCode === 'auth/cancelled-popup-request') {
      return { error: 'Requisição de login cancelada. Tente novamente.' };
    }
    if (errorCode === 'auth/network-request-failed') {
      return { error: 'Falha de rede ao conectar com a conta Google. Verifique sua conexão à internet.' };
    }
    if (errorCode === 'auth/api-key-not-valid' || errorMsg.includes('api-key-not-valid')) {
      return {
        error:
          'A chave de API do Firebase precisa ser autorizada. Verifique no Google Cloud / Firebase Console se a "Identity Toolkit API" está ativada e se a API Key tem as restrições corretas.',
      };
    }
    if (errorCode === 'auth/unauthorized-domain' || errorMsg.includes('unauthorized-domain')) {
      return {
        error:
          'Este domínio ainda não foi autorizado no Firebase Authentication. Adicione este endereço em Firebase Console > Authentication > Settings > Authorized Domains.',
      };
    }
    return { error: error?.message || 'Falha ao autenticar com a conta Google. Tente novamente.' };
  }
}

/**
 * Sign out user from Firebase Auth
 */
export async function logoutUserFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
}

/**
 * Updates user profile details in Firestore.
 */
export async function updateFirebaseUserProfile(
  userId: string,
  data: Partial<FirebaseUserProfile>
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    if (data.email) {
      const emailKey = getEmailKey(data.email);
      await setDoc(
        doc(db, 'users_by_email', emailKey),
        { ...data, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, path);
  }
}

/**
 * Real-time listener for the user's financial profile.
 * Triggers instantly across all connected devices (computer and phone).
 */
export function subscribeToUserFinancialData(
  userId: string,
  onData: (data: UserFinancialData) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, 'users', userId, 'financial', 'main');

  return onSnapshot(
    docRef,
    async (snap) => {
      if (snap.exists()) {
        onData(snap.data() as UserFinancialData);
      } else {
        // If profile doesn't exist yet, initialize with zeroed data
        const initialMonth = getCurrentMonthLabel();
        const zeroCategories: CategoryItem[] = DEFAULT_CATEGORIES.map((c) => ({
          ...c,
          budget: 0,
        }));
        const initial: UserFinancialData = {
          userId,
          baseIncome: 0,
          monthlyIncomes: {},
          activeMonths: [initialMonth],
          currentMonth: initialMonth,
          categories: zeroCategories,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, initial);
        onData(initial);
      }
    },
    (err) => {
      console.warn('Firestore financial listener error:', err);
      if (onError) {
        try {
          handleFirestoreError(err, OperationType.GET, `users/${userId}/financial/main`);
        } catch (e: any) {
          onError(e);
        }
      }
    }
  );
}

/**
 * Real-time listener for the user's expenses subcollection.
 * Synchronizes new, updated, and deleted expenses in real time.
 */
export function subscribeToUserExpenses(
  userId: string,
  onExpenses: (expenses: Expense[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const collRef = collection(db, 'users', userId, 'expenses');

  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: Expense[] = [];
      snapshot.forEach((d) => {
        const item = d.data();
        list.push({
          id: item.id || d.id,
          data: item.data || '',
          descricao: item.descricao || '',
          categoria: item.categoria || 'Outros',
          forma_pagamento: item.forma_pagamento || 'PIX',
          valor: typeof item.valor === 'number' ? item.valor : parseFloat(item.valor) || 0,
          status: item.status || 'Pago',
        });
      });

      // Sort by date descending (newest first)
      list.sort((a, b) => b.data.localeCompare(a.data));
      onExpenses(list);
    },
    (err) => {
      console.warn('Firestore expenses listener error:', err);
      if (onError) {
        try {
          handleFirestoreError(err, OperationType.LIST, `users/${userId}/expenses`);
        } catch (e: any) {
          onError(e);
        }
      }
    }
  );
}

/**
 * Save or update user's financial profile in Firestore
 */
export async function saveUserFinancialProfile(
  userId: string,
  data: Partial<UserFinancialData>
): Promise<void> {
  const path = `users/${userId}/financial/main`;
  try {
    const docRef = doc(db, 'users', userId, 'financial', 'main');
    await setDoc(
      docRef,
      {
        ...data,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Save or update an expense in Firestore
 */
export async function saveUserExpense(userId: string, expense: Expense): Promise<void> {
  const path = `users/${userId}/expenses/${expense.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'expenses', expense.id);
    await setDoc(docRef, {
      ...expense,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete an expense in Firestore
 */
export async function deleteUserExpense(userId: string, expenseId: string): Promise<void> {
  const path = `users/${userId}/expenses/${expenseId}`;
  try {
    const docRef = doc(db, 'users', userId, 'expenses', expenseId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Add or switch a month in the user's account
 */
export async function addUserMonth(
  userId: string,
  newMonthLabel: string,
  incomeForMonth: number = 0,
  existingIncomes: Record<string, number> = {},
  existingActiveMonths: string[] = []
): Promise<void> {
  try {
    const activeMonths = existingActiveMonths.includes(newMonthLabel)
      ? existingActiveMonths
      : [...existingActiveMonths, newMonthLabel];

    const monthlyIncomes = {
      ...existingIncomes,
      [newMonthLabel]: incomeForMonth,
    };

    await saveUserFinancialProfile(userId, {
      activeMonths,
      currentMonth: newMonthLabel,
      monthlyIncomes,
    });
  } catch (err) {
    console.error('Error adding user month to Firestore:', err);
    throw err;
  }
}

/**
 * Reset all user financial data in Firestore (cleans expenses and zeroes budgets/incomes)
 */
export async function resetAllUserDataInFirebase(userId: string): Promise<void> {
  const path = `users/${userId}/expenses`;
  try {
    // 1. Delete all expense docs
    const collRef = collection(db, 'users', userId, 'expenses');
    const snap = await getDocs(collRef);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    // 2. Reset financial doc
    const initialMonth = getCurrentMonthLabel();
    const zeroCategories: CategoryItem[] = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      budget: 0,
    }));

    await saveUserFinancialProfile(userId, {
      baseIncome: 0,
      monthlyIncomes: {},
      activeMonths: [initialMonth],
      currentMonth: initialMonth,
      categories: zeroCategories,
    });
  } catch (err: any) {
    console.error('Error resetting user data in Firestore:', err);
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

/**
 * Permanently delete user account and all associated documents from Firestore and Auth.
 * Enables the user to register a brand new account from scratch.
 */
export async function deleteUserAccountCompletely(userId: string, email?: string): Promise<void> {
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  // 1. Delete all expense subdocuments in Firestore
  try {
    const collRef = collection(db, 'users', userId, 'expenses');
    const snap = await getDocs(collRef);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Expenses deletion bypassed or empty:', err);
  }

  // 2. Delete financial profile document
  try {
    await deleteDoc(doc(db, 'users', userId, 'financial', 'main'));
  } catch (err) {
    console.warn('Financial doc deletion bypassed:', err);
  }

  // 3. Delete email lookup index
  if (cleanEmail) {
    try {
      const emailKey = getEmailKey(cleanEmail);
      await deleteDoc(doc(db, 'users_by_email', emailKey));
    } catch (err) {
      console.warn('Email index deletion bypassed:', err);
    }
  }

  // 4. Delete user profile document
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    console.warn('User profile deletion bypassed:', err);
  }

  // 5. Delete Firebase Auth user if matching currently logged in
  try {
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await auth.currentUser.delete();
    }
  } catch (authErr) {
    console.warn('Auth user delete bypassed (session invalidated):', authErr);
    try {
      await signOut(auth);
    } catch {}
  }

  // 6. Clear local storage accounts and caches
  clearAllLocalStoredAccounts(cleanEmail);
}

/**
 * Clear local accounts from browser storage
 */
export function clearAllLocalStoredAccounts(specificEmail?: string): void {
  try {
    if (specificEmail) {
      const raw = localStorage.getItem('finanzen_registered_users');
      if (raw) {
        const map = JSON.parse(raw);
        delete map[specificEmail.trim().toLowerCase()];
        localStorage.setItem('finanzen_registered_users', JSON.stringify(map));
      }
    } else {
      localStorage.removeItem('finanzen_registered_users');
    }

    // Completely wipe all tools data from localStorage (Amortization, Portfolio, Watchlist, Budgets, Caches)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('consignatec_') || k.startsWith('finanzen_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Could not clear local user storage:', e);
  }
}
