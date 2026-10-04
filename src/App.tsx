import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { MonthYearPicker } from './components/MonthYearPicker';
import { KpiCards } from './components/KpiCards';
import { CategoryBudgetTable } from './components/CategoryBudgetTable';
import { ExpenseTable } from './components/ExpenseTable';
import { NaturalLanguageInput } from './components/NaturalLanguageInput';
import { ExpenseModal } from './components/ExpenseModal';
import { CategoryModal } from './components/CategoryModal';
import { DiagnosisModal } from './components/DiagnosisModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ResetModal } from './components/ResetModal';
import { AuthScreen } from './components/AuthScreen';
import { ToolsDashboard, ToolId } from './components/ToolsDashboard';
import { AmortizationCalculator } from './components/AmortizationCalculator';
import { StockRecommendations } from './components/StockRecommendations';
import { ProfileSettings, UserProfileData } from './components/ProfileSettings';
import { CategoryIcon } from './components/CategoryIcon';
import { MobileBottomNav, MobileTab } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  CategoryItem,
  Expense,
  FinancialDiagnosis,
} from './types/finance';
import {
  DEFAULT_INCOME,
  DEFAULT_CATEGORIES,
  DEFAULT_ZERO_CATEGORIES,
  INITIAL_EXPENSES,
  formatBRL,
  formatDateBR,
  getCategoryStatus,
  monthYearToISOYearMonth,
  getCurrentMonthLabel,
} from './utils/formatters';
import { generateFinancialDiagnosis } from './services/aiService';
import {
  subscribeToUserFinancialData,
  subscribeToUserExpenses,
  saveUserFinancialProfile,
  saveUserExpense,
  deleteUserExpense,
  addUserMonth,
  resetAllUserDataInFirebase,
  testFirestoreConnection,
  logoutUserFromFirebase,
  deleteUserAccountCompletely,
  clearAllLocalStoredAccounts,
} from './services/firebase';
import {
  BarChart3,
  Calendar,
  Sparkles,
  Target,
  Cloud,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(() => {
    const saved = localStorage.getItem('finanzen_session_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Base default income (defaults to 0 for authenticated users)
  const [baseIncome, setBaseIncome] = useState<number>(0);

  // Monthly income storage
  const [monthlyIncomes, setMonthlyIncomes] = useState<Record<string, number>>({});

  // Active months list added by user
  const [activeMonths, setActiveMonths] = useState<string[]>([getCurrentMonthLabel()]);

  // Current Month State
  const [currentMonth, setCurrentMonth] = useState<string>(() => getCurrentMonthLabel());

  // Dynamic Categories State
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_ZERO_CATEGORIES);

  // Expenses State (Stores ALL expenses across all historical months)
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Cloud Sync state
  const [isCloudSynced, setIsCloudSynced] = useState(true);

  // Modals & UI State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryItem, setEditingCategoryItem] = useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<FinancialDiagnosis | null>(null);
  const [isGeneratingDiagnosis, setIsGeneratingDiagnosis] = useState(false);

  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [globalAlertMessage, setGlobalAlertMessage] = useState<string | null>(null);

  // User Profile Settings Screen View State
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Selected Tool state (null means the User is at the Tools Selection Dashboard)
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(() => {
    return (localStorage.getItem('consignatec_active_tool') as ToolId) || null;
  });

  // Mobile View Switcher (Dashboard / Gastos / Metas / Tudo)
  const [mobileTab, setMobileTab] = useState<MobileTab>('dashboard');

  // Test Firestore Connection on startup
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Real-time Firestore synchronization for the logged-in user
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isGuest) {
      // Guest Mode: only load demo data if user explicitly requested it, otherwise start clean at zero
      const demoLoaded = localStorage.getItem('finanzen_demo_loaded') === 'true';
      if (demoLoaded) {
        setExpenses(INITIAL_EXPENSES);
        setCategories(DEFAULT_CATEGORIES);
        setBaseIncome(DEFAULT_INCOME);
        setMonthlyIncomes({ [getCurrentMonthLabel()]: DEFAULT_INCOME });
      } else {
        setExpenses([]);
        setCategories(DEFAULT_ZERO_CATEGORIES);
        setBaseIncome(0);
        setMonthlyIncomes({});
      }
      setActiveMonths([getCurrentMonthLabel()]);
      setCurrentMonth(getCurrentMonthLabel());
      return;
    }

    // REAL USER: Attach Firestore real-time listeners for multi-device sync
    const unsubFinancial = subscribeToUserFinancialData(
      currentUser.id,
      (data) => {
        if (data) {
          setBaseIncome(data.baseIncome ?? 0);
          setMonthlyIncomes(data.monthlyIncomes || {});
          if (data.activeMonths && data.activeMonths.length > 0) {
            setActiveMonths(data.activeMonths);
          }
          if (data.currentMonth) {
            setCurrentMonth(data.currentMonth);
          }
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
          setIsCloudSynced(true);
        }
      },
      (err) => {
        console.warn('Financial Firestore listener error:', err);
      }
    );

    const unsubExpenses = subscribeToUserExpenses(
      currentUser.id,
      (remoteExpenses) => {
        setExpenses(remoteExpenses);
        setIsCloudSynced(true);
      },
      (err) => {
        console.warn('Expenses Firestore listener error:', err);
      }
    );

    return () => {
      unsubFinancial();
      unsubExpenses();
    };
  }, [currentUser?.id, currentUser?.isGuest]);

  const handleSelectTool = (toolId: ToolId) => {
    setSelectedTool(toolId);
    localStorage.setItem('consignatec_active_tool', toolId);
  };

  const handleBackToTools = () => {
    setSelectedTool(null);
    setIsProfileOpen(false);
    localStorage.removeItem('consignatec_active_tool');
  };

  const handleUpdateUserProfile = (updated: UserProfileData) => {
    setCurrentUser(updated);
    localStorage.setItem('finanzen_session_user', JSON.stringify(updated));
  };

  const handleLoginSuccess = (user: {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    photoURL?: string;
    authProvider?: 'google' | 'password' | 'guest';
    isGuest?: boolean;
  }) => {
    setCurrentUser(user);
    setSelectedTool(null);
    setIsProfileOpen(false);
    localStorage.removeItem('consignatec_active_tool');
    localStorage.setItem('finanzen_session_user', JSON.stringify(user));
  };

  const handleExploreAsGuest = () => {
    const guestUser = {
      id: 'guest',
      email: 'visitante@finanzen.local',
      name: 'Visitante Demo',
      phone: '',
      authProvider: 'guest' as const,
      isGuest: true,
    };
    setCurrentUser(guestUser);
    setSelectedTool(null);
    setIsProfileOpen(false);
    localStorage.removeItem('consignatec_active_tool');
    localStorage.removeItem('finanzen_demo_loaded');
    localStorage.setItem('finanzen_session_user', JSON.stringify(guestUser));
    setExpenses([]);
    setCategories(DEFAULT_ZERO_CATEGORIES);
    setBaseIncome(0);
    setMonthlyIncomes({});
    setActiveMonths([getCurrentMonthLabel()]);
  };

  const handleLogout = () => {
    logoutUserFromFirebase().catch(() => {});
    clearAllLocalStoredAccounts();
    localStorage.removeItem('finanzen_session_user');
    localStorage.removeItem('consignatec_active_tool');
    setCurrentUser(null);
    setSelectedTool(null);
    setIsProfileOpen(false);
    setDiagnosisData(null);
    setExpenses([]);
    setBaseIncome(0);
    setMonthlyIncomes({});
    setCategories(DEFAULT_ZERO_CATEGORIES);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    const userId = currentUser.id;
    const userEmail = currentUser.email;

    try {
      if (!currentUser.isGuest) {
        await deleteUserAccountCompletely(userId, userEmail);
      }
    } catch (err) {
      console.warn('Erro ao deletar conta no Firebase:', err);
    } finally {
      handleLogout();
      setGlobalAlertMessage('Sua conta e todos os dados foram excluídos com sucesso. Você pode criar um novo cadastro do zero.');
      setTimeout(() => {
        setGlobalAlertMessage(null);
      }, 7000);
    }
  };

  // Year-Month ISO representation (e.g. "2026-09")
  const currentYearMonth = useMemo(() => {
    return monthYearToISOYearMonth(currentMonth);
  }, [currentMonth]);

  // Filtered Expenses for the active period
  const activeExpenses = useMemo(() => {
    if (currentMonth === 'all' || !currentYearMonth) {
      return expenses;
    }
    return expenses.filter((e) => e.data.startsWith(currentYearMonth));
  }, [expenses, currentMonth, currentYearMonth]);

  // Active Income for the selected month
  const activeIncome = useMemo(() => {
    if (currentMonth !== 'all' && monthlyIncomes[currentMonth] !== undefined) {
      return monthlyIncomes[currentMonth];
    }
    return baseIncome;
  }, [currentMonth, monthlyIncomes, baseIncome]);

  // Active Categories visible for the currently selected month
  const displayCategories = useMemo(() => {
    if (currentMonth === 'all') {
      return categories;
    }
    return categories.filter(
      (c) => !c.excludedMonths || !c.excludedMonths.includes(currentMonth)
    );
  }, [categories, currentMonth]);

  // Categories excluded specifically for the currently selected month
  const excludedCategoriesInCurrentMonth = useMemo(() => {
    if (currentMonth === 'all') {
      return [];
    }
    return categories.filter(
      (c) => c.excludedMonths && c.excludedMonths.includes(currentMonth)
    );
  }, [categories, currentMonth]);

  // Derived Calculations for the active month
  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    displayCategories.forEach((cat) => {
      map[cat.name] = 0;
    });
    activeExpenses.forEach((exp) => {
      if (map[exp.categoria] === undefined) {
        map[exp.categoria] = 0;
      }
      map[exp.categoria] += exp.valor;
    });
    return map;
  }, [activeExpenses, displayCategories]);

  const totalExpenses = useMemo(() => {
    return activeExpenses.reduce((sum, item) => sum + item.valor, 0);
  }, [activeExpenses]);

  const availableCategoryNames = useMemo(() => {
    return displayCategories.map((c) => c.name);
  }, [displayCategories]);

  // Handlers for Month Management
  const handleMonthChange = (newMonth: string) => {
    setCurrentMonth(newMonth);
    if (currentUser && !currentUser.isGuest) {
      saveUserFinancialProfile(currentUser.id, { currentMonth: newMonth });
    }
  };

  const handleAddMonth = async (newMonth: string) => {
    if (!activeMonths.includes(newMonth)) {
      const updatedMonths = [...activeMonths, newMonth];
      setActiveMonths(updatedMonths);
    }
    setCurrentMonth(newMonth);

    if (currentUser && !currentUser.isGuest) {
      await addUserMonth(currentUser.id, newMonth, 0, monthlyIncomes, activeMonths);
    }
  };

  // Handlers for Expenses
  const handleAddExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };

    // Optimistic local update
    setExpenses((prev) => [newExpense, ...prev]);

    // Ensure expense's month is in activeMonths
    const expenseYearMonth = newExpense.data.substring(0, 7);
    const [y, m] = expenseYearMonth.split('-');
    const mNum = parseInt(m, 10);
    const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    if (mNum >= 1 && mNum <= 12) {
      const expMonthLabel = `${MONTHS[mNum - 1]} ${y}`;
      if (!activeMonths.includes(expMonthLabel)) {
        setActiveMonths((prev) => [...prev, expMonthLabel]);
      }
    }

    if (currentUser && !currentUser.isGuest) {
      await saveUserExpense(currentUser.id, newExpense);
    }
  };

  const handleEditExpense = async (expenseData: Omit<Expense, 'id'>, id?: string) => {
    if (!id) return;
    const updated: Expense = { ...expenseData, id };
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? updated : item))
    );
    if (currentUser && !currentUser.isGuest) {
      await saveUserExpense(currentUser.id, updated);
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const handleConfirmDelete = async () => {
    if (expenseToDelete) {
      const id = expenseToDelete.id;
      setExpenses((prev) => prev.filter((item) => item.id !== id));
      if (currentUser && !currentUser.isGuest) {
        await deleteUserExpense(currentUser.id, id);
      }
      setExpenseToDelete(null);
    }
  };

  const handleOpenEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleOpenNewModal = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  // Handlers for Category Management
  const handleOpenNewCategoryModal = () => {
    setEditingCategoryItem(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (cat: CategoryItem) => {
    setEditingCategoryItem(cat);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (
    categoryData: Omit<CategoryItem, 'id'>,
    id?: string
  ) => {
    let updatedCategories: CategoryItem[];
    if (id) {
      const oldCat = categories.find((c) => c.id === id);
      if (oldCat && oldCat.name !== categoryData.name) {
        setExpenses((prev) =>
          prev.map((e) =>
            e.categoria === oldCat.name ? { ...e, categoria: categoryData.name } : e
          )
        );
      }
      updatedCategories = categories.map((c) => (c.id === id ? { ...categoryData, id } : c));
    } else {
      // Check if there is an existing category with the same name that was excluded in this month
      const existingExcluded = categories.find(
        (c) =>
          c.name.trim().toLowerCase() === categoryData.name.trim().toLowerCase() &&
          c.excludedMonths?.includes(currentMonth)
      );
      if (existingExcluded && currentMonth !== 'all') {
        // Re-enable it in currentMonth
        updatedCategories = categories.map((c) =>
          c.id === existingExcluded.id
            ? {
                ...c,
                ...categoryData,
                excludedMonths: (c.excludedMonths || []).filter((m) => m !== currentMonth),
              }
            : c
        );
      } else {
        const newCat: CategoryItem = {
          ...categoryData,
          id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        };
        updatedCategories = [...categories, newCat];
      }
    }

    setCategories(updatedCategories);

    if (currentUser && !currentUser.isGuest) {
      await saveUserFinancialProfile(currentUser.id, { categories: updatedCategories });
    }
  };

  const handleDeleteCategory = (category: CategoryItem) => {
    setCategoryToDelete(category);
  };

  const handleConfirmDeleteCategory = async () => {
    if (categoryToDelete) {
      let updated: CategoryItem[];
      if (currentMonth !== 'all') {
        // Exclude category specifically from the current active month
        updated = categories.map((c) => {
          if (c.id === categoryToDelete.id) {
            const existing = c.excludedMonths || [];
            return {
              ...c,
              excludedMonths: existing.includes(currentMonth)
                ? existing
                : [...existing, currentMonth],
            };
          }
          return c;
        });
        setGlobalAlertMessage(
          `Categoria "${categoryToDelete.name}" excluída somente de ${currentMonth}. Ela permanece ativa nos outros meses.`
        );
      } else {
        // When viewing all months, remove completely
        updated = categories.filter((c) => c.id !== categoryToDelete.id);
        setGlobalAlertMessage(
          `Categoria "${categoryToDelete.name}" foi excluída de todo o sistema.`
        );
      }

      setCategories(updated);
      if (currentUser && !currentUser.isGuest) {
        await saveUserFinancialProfile(currentUser.id, { categories: updated });
      }
      setCategoryToDelete(null);
    }
  };

  const handleRestoreCategoryForMonth = async (cat: CategoryItem) => {
    if (currentMonth === 'all') return;
    const updated = categories.map((c) => {
      if (c.id === cat.id && c.excludedMonths) {
        return {
          ...c,
          excludedMonths: c.excludedMonths.filter((m) => m !== currentMonth),
        };
      }
      return c;
    });
    setCategories(updated);
    if (currentUser && !currentUser.isGuest) {
      await saveUserFinancialProfile(currentUser.id, { categories: updated });
    }
    setGlobalAlertMessage(`Categoria "${cat.name}" reativada no mês de ${currentMonth}.`);
  };

  const countExpensesForDeletedCategory = useMemo(() => {
    if (!categoryToDelete) return 0;
    const targetExpenses = currentMonth !== 'all' ? activeExpenses : expenses;
    return targetExpenses.filter(
      (e) => e.categoria.toLowerCase() === categoryToDelete.name.toLowerCase()
    ).length;
  }, [categoryToDelete, currentMonth, activeExpenses, expenses]);

  const handleUpdateBudget = async (categoryName: string, newLimit: number) => {
    const updated = categories.map((cat) =>
      cat.name.toLowerCase() === categoryName.toLowerCase()
        ? { ...cat, budget: newLimit }
        : cat
    );
    setCategories(updated);
    if (currentUser && !currentUser.isGuest) {
      await saveUserFinancialProfile(currentUser.id, { categories: updated });
    }
  };

  // Handlers for Income
  const handleUpdateIncome = async (newIncome: number) => {
    setBaseIncome(newIncome);
    let updatedMonthly = monthlyIncomes;
    if (currentMonth !== 'all') {
      updatedMonthly = {
        ...monthlyIncomes,
        [currentMonth]: newIncome,
      };
      setMonthlyIncomes(updatedMonthly);
    }

    if (currentUser && !currentUser.isGuest) {
      await saveUserFinancialProfile(currentUser.id, {
        baseIncome: newIncome,
        monthlyIncomes: updatedMonthly,
      });
    }
  };

  // Reset Data to Defaults / Zero
  const handleResetData = () => {
    setIsResetModalOpen(true);
  };

  const handleResetSelectedMonth = async () => {
    if (currentMonth === 'all' || !currentYearMonth) {
      handleResetAllMonths();
      return;
    }
    // Remove only expenses of the currently selected month
    const expensesToDelete = expenses.filter((e) => e.data.startsWith(currentYearMonth));
    setExpenses((prev) => prev.filter((e) => !e.data.startsWith(currentYearMonth)));
    
    const updatedMonthly = {
      ...monthlyIncomes,
      [currentMonth]: 0,
    };
    setMonthlyIncomes(updatedMonthly);
    setDiagnosisData(null);
    setIsResetModalOpen(false);

    if (currentUser && !currentUser.isGuest) {
      for (const exp of expensesToDelete) {
        await deleteUserExpense(currentUser.id, exp.id);
      }
      await saveUserFinancialProfile(currentUser.id, {
        monthlyIncomes: updatedMonthly,
      });
    }
  };

  const handleResetAllMonths = async () => {
    await handleWipeDatabaseAndStartFromZero();
  };

  const handleWipeDatabaseAndStartFromZero = async () => {
    localStorage.removeItem('finanzen_demo_loaded');
    try {
      const userId = currentUser?.id;
      const keys = [
        'consignatec_saved_amort',
        'consignatec_user_portfolio',
        'consignatec_watchlist',
        'consignatec_stocks_custom',
      ];
      if (userId) {
        keys.push(
          `consignatec_saved_amort_${userId}`,
          `consignatec_user_portfolio_${userId}`,
          `consignatec_watchlist_${userId}`,
          `consignatec_stocks_custom_${userId}`
        );
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}

    setBaseIncome(0);
    setMonthlyIncomes({});
    setCategories(DEFAULT_ZERO_CATEGORIES);
    setExpenses([]);
    setDiagnosisData(null);
    const initialMonth = getCurrentMonthLabel();
    setActiveMonths([initialMonth]);
    setCurrentMonth(initialMonth);
    setIsResetModalOpen(false);

    if (currentUser && !currentUser.isGuest) {
      try {
        await resetAllUserDataInFirebase(currentUser.id);
      } catch (err) {
        console.error('Erro ao resetar no Firestore:', err);
      }
    }
    setGlobalAlertMessage('Banco de dados zerado com sucesso! Todos os lançamentos foram excluídos da nuvem e você começou do zero.');
    setTimeout(() => {
      setGlobalAlertMessage(null);
    }, 6000);
  };

  const handleResetBudgetsToZero = async () => {
    const zeroCats = categories.map((c) => ({
      ...c,
      budget: 0,
    }));
    setCategories(zeroCats);
    setIsResetModalOpen(false);

    if (currentUser && !currentUser.isGuest) {
      await saveUserFinancialProfile(currentUser.id, { categories: zeroCats });
    }
    setGlobalAlertMessage('Todos os tetos de orçamentos foram definidos para R$ 0,00.');
    setTimeout(() => {
      setGlobalAlertMessage(null);
    }, 4000);
  };

  const handleRestoreDefaultCategories = async () => {
    setCategories(DEFAULT_CATEGORIES);
    setIsResetModalOpen(false);
    if (currentUser && !currentUser.isGuest) {
      await saveUserFinancialProfile(currentUser.id, { categories: DEFAULT_CATEGORIES });
    }
    setGlobalAlertMessage('Categorias padrão restauradas com sucesso.');
    setTimeout(() => {
      setGlobalAlertMessage(null);
    }, 4000);
  };

  const handleRestoreSampleData = async () => {
    localStorage.setItem('finanzen_demo_loaded', 'true');
    setBaseIncome(DEFAULT_INCOME);
    setMonthlyIncomes({ [getCurrentMonthLabel()]: DEFAULT_INCOME });
    setCategories(DEFAULT_CATEGORIES);
    setExpenses(INITIAL_EXPENSES);
    setCurrentMonth(getCurrentMonthLabel());
    setDiagnosisData(null);
    setIsResetModalOpen(false);

    if (currentUser && !currentUser.isGuest) {
      await saveUserFinancialProfile(currentUser.id, {
        baseIncome: DEFAULT_INCOME,
        monthlyIncomes: { [getCurrentMonthLabel()]: DEFAULT_INCOME },
        categories: DEFAULT_CATEGORIES,
        currentMonth: getCurrentMonthLabel(),
      });
      for (const exp of INITIAL_EXPENSES) {
        await saveUserExpense(currentUser.id, exp);
      }
    }
    setGlobalAlertMessage('Dados de exemplo restaurados para demonstração.');
    setTimeout(() => {
      setGlobalAlertMessage(null);
    }, 4000);
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    const listToExport = activeExpenses;
    const headers = [
      'Data',
      'Descrição',
      'Categoria',
      'Forma de Pagamento',
      'Valor (R$)',
      'Status',
    ];
    const rows = listToExport.map((e) => [
      formatDateBR(e.data),
      `"${e.descricao.replace(/"/g, '""')}"`,
      `"${e.categoria}"`,
      `"${e.forma_pagamento}"`,
      e.valor.toFixed(2).replace('.', ','),
      `"${e.status}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `finanzen_despesas_${currentMonth.toLowerCase().replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // AI Financial Diagnosis Request
  const handleOpenDiagnosis = async () => {
    setIsDiagnosisModalOpen(true);
    if (!diagnosisData) {
      await fetchDiagnosis();
    }
  };

  const fetchDiagnosis = async () => {
    setIsGeneratingDiagnosis(true);
    try {
      const categoriesPayload = categories.map((cat) => {
        const budget = cat.budget || 0;
        const spent = spendingByCategory[cat.name] || 0;
        const percent = budget > 0 ? (spent / budget) * 100 : 0;
        const status = getCategoryStatus(budget, spent);
        return { name: cat.name, budget, spent, percent, status };
      });

      const result = await generateFinancialDiagnosis({
        income: activeIncome,
        totalExpenses,
        categories: categoriesPayload,
        recentExpenses: activeExpenses,
      });

      setDiagnosisData(result);
    } catch (error) {
      console.error('Error generating diagnosis:', error);
    } finally {
      setIsGeneratingDiagnosis(false);
    }
  };

  if (!currentUser) {
    return (
      <>
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          onExploreAsGuest={handleExploreAsGuest}
        />
        <OfflineIndicator />
      </>
    );
  }

  // If user is accessing Profile Settings, render ProfileSettings
  if (isProfileOpen) {
    return (
      <>
        <ProfileSettings
          currentUser={currentUser}
          onUpdateUser={handleUpdateUserProfile}
          onBack={() => setIsProfileOpen(false)}
          onLogout={handleLogout}
          onWipeDatabase={handleWipeDatabaseAndStartFromZero}
          onDeleteAccount={handleDeleteAccount}
        />
        <OfflineIndicator />
      </>
    );
  }

  // If user is authenticated but hasn't selected a specific tool yet, show Tools Hub Dashboard
  if (!selectedTool) {
    return (
      <>
        <ToolsDashboard
          userName={currentUser.name}
          userEmail={currentUser.email}
          userPhone={currentUser.phone}
          userPhoto={currentUser.photoURL}
          isGuest={currentUser.isGuest}
          onSelectTool={handleSelectTool}
          onOpenProfile={() => setIsProfileOpen(true)}
          onLogout={handleLogout}
        />
        <OfflineIndicator />
      </>
    );
  }

  // If user selected Amortization Calculator
  if (selectedTool === 'amortization_calc') {
    return (
      <>
        <AmortizationCalculator
          userName={currentUser.name}
          userId={currentUser.id}
          isGuest={currentUser.isGuest}
          onBack={handleBackToTools}
        />
        <OfflineIndicator />
      </>
    );
  }

  // If user selected Stock Advisor / Radar de Ações (Google Finance B3 & EUA)
  if (selectedTool === 'stock_advisor') {
    return (
      <>
        <StockRecommendations
          userName={currentUser.name}
          userId={currentUser.id}
          isGuest={currentUser.isGuest}
          onBack={handleBackToTools}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-white transition-colors duration-200">
      {/* Executive Header */}
      <Header
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        activeMonths={activeMonths}
        onAddMonth={handleAddMonth}
        onOpenDiagnosis={handleOpenDiagnosis}
        onExportData={handleExportCSV}
        onResetData={handleResetData}
        isCloudSynced={isCloudSynced}
        currentUser={currentUser}
        onLogout={handleLogout}
        onBackToTools={handleBackToTools}
        onOpenProfile={() => setIsProfileOpen(true)}
        isGeneratingDiagnosis={isGeneratingDiagnosis}
        selectedMonthExpensesCount={activeExpenses.length}
        totalExpensesCount={expenses.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-12">
        {/* Month Context Banner & Cloud Sync Guarantee (Desktop only to save mobile screen height) */}
        <section aria-label="Status do Mês e Nuvem" className="hidden md:block">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 transition-colors">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/90 dark:border-teal-800 text-teal-800 dark:text-teal-300 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {currentMonth === 'all'
                      ? 'Visão Geral Consolidada (Todos os Meses)'
                      : `Mês de Referência: ${currentMonth}`}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Cloud className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Sincronizado na Nuvem</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <strong>{activeExpenses.length} lançamento(s)</strong> no mês ({formatBRL(totalExpenses)}). Total acumulado de <strong>{expenses.length} despesa(s)</strong> gravadas no banco.
                </p>
              </div>
            </div>

            {/* Quick Month Switcher Controls */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <MonthYearPicker
                currentMonth={currentMonth}
                onMonthChange={handleMonthChange}
                activeMonths={activeMonths}
                onAddMonth={handleAddMonth}
              />
            </div>
          </div>
        </section>

        {/* Informative notice if active month has no expenses (Fresh clean slate for new users / months) */}
        {activeExpenses.length === 0 && (
          <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-50/80 via-emerald-50/50 to-white dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-slate-900 border border-teal-200/90 dark:border-teal-800 text-teal-950 dark:text-teal-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-fadeIn shadow-xs transition-colors">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-teal-800 dark:bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {currentMonth === 'all'
                    ? 'Nenhum lançamento registrado no sistema.'
                    : `Lançamentos de ${currentMonth} estão zerados.`}
                </h3>
                <p className="text-[11px] sm:text-xs text-teal-800/90 dark:text-teal-200/80 mt-0.5">
                  1. Defina a receita prevista para este mês clicando no ícone de lápis em <strong>Receita Total</strong>.<br className="hidden sm:inline" />
                  2. Lance suas despesas pelo botão verde <strong>+ Novo Lançamento</strong> ou leitor rápido com IA.
                  {expenses.length > 0 && currentMonth !== 'all' && (
                    <span className="block mt-1 font-semibold text-emerald-800 dark:text-emerald-300">
                      ✓ Seus outros meses continuam gravados com segurança no banco ({expenses.length} no histórico).
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMobileTab('metas');
                  handleOpenNewCategoryModal();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 text-teal-900 dark:text-teal-200 border border-teal-300 dark:border-teal-700 rounded-xl text-xs font-bold hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Target className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                <span>+ Configurar Metas</span>
              </button>
              <button
                type="button"
                onClick={handleOpenNewModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 dark:bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-900 dark:hover:bg-teal-700 transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                <span>+ Novo Lançamento</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Tab Segmented Quick Switcher */}
        <div className="flex md:hidden items-center justify-between bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors">
          <button
            type="button"
            onClick={() => setMobileTab('tudo')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              mobileTab === 'tudo'
                ? 'bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-200 shadow-xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tudo
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('dashboard')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              mobileTab === 'dashboard'
                ? 'bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-200 shadow-xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Resumo
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('despesas')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              mobileTab === 'despesas'
                ? 'bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-200 shadow-xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Gastos ({activeExpenses.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('metas')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              mobileTab === 'metas'
                ? 'bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-200 shadow-xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Metas
          </button>
        </div>

        {/* 1. Painel de Indicadores Executivos (KPI Cards) */}
        <section
          aria-label="Indicadores Executivos"
          className={
            mobileTab === 'tudo' || mobileTab === 'dashboard'
              ? 'block'
              : 'hidden md:block'
          }
        >
          <KpiCards
            income={activeIncome}
            totalExpenses={totalExpenses}
            onUpdateIncome={handleUpdateIncome}
          />
        </section>

        {/* 2. Visual Distribution Summary Card */}
        <section
          aria-label="Distribuição dos Gastos"
          className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors ${
            mobileTab === 'tudo' || mobileTab === 'dashboard' || mobileTab === 'metas'
              ? 'block'
              : 'hidden md:block'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-800 dark:text-teal-400" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Distribuição Proporcional dos Gastos ({currentMonth})
              </h3>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Total gasto no período:{' '}
              <strong className="text-slate-800 dark:text-slate-200">{formatBRL(totalExpenses)}</strong>
            </span>
          </div>

          {/* Segmented Distribution Bar */}
          {totalExpenses > 0 ? (
            <div className="space-y-3">
              <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                {displayCategories.map((cat) => {
                  const spent = spendingByCategory[cat.name] || 0;
                  const ratio = (spent / totalExpenses) * 100;
                  if (ratio <= 0) return null;
                  return (
                    <div
                      key={cat.id}
                      title={`${cat.name}: ${formatBRL(spent)} (${ratio.toFixed(1)}%)`}
                      style={{
                        width: `${ratio}%`,
                        backgroundColor: cat.color,
                      }}
                      className="h-full first:rounded-l-full last:rounded-r-full hover:opacity-90 transition-opacity"
                    />
                  );
                })}
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2">
                {displayCategories.map((cat) => {
                  const spent = spendingByCategory[cat.name] || 0;
                  const ratio = totalExpenses > 0 ? (spent / totalExpenses) * 100 : 0;
                  return (
                    <div
                      key={cat.id}
                      className="p-2 sm:p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {cat.name}
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between text-[10px] sm:text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          {ratio.toFixed(0)}%
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatBRL(spent).replace('R$', '').trim()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
              Nenhuma despesa registrada em {currentMonth} para calcular a distribuição.
            </div>
          )}
        </section>

        {/* 3. Recursos Inteligentes: Leitor Rápido de Gastos com IA */}
        <section
          aria-label="Leitor Inteligente de Gastos"
          className={
            mobileTab === 'tudo' || mobileTab === 'despesas'
              ? 'block'
              : 'hidden md:block'
          }
        >
          <NaturalLanguageInput
            onAddExpense={handleAddExpense}
            availableCategories={availableCategoryNames}
          />
        </section>

        {/* 4. Tabela de Metas & Orçamento por Categoria */}
        <section
          aria-label="Orçamento por Categoria"
          className={
            mobileTab === 'tudo' || mobileTab === 'metas'
              ? 'block'
              : 'hidden md:block'
          }
        >
          <CategoryBudgetTable
            categories={displayCategories}
            excludedCategoriesInCurrentMonth={excludedCategoriesInCurrentMonth}
            currentMonth={currentMonth}
            onRestoreCategoryForMonth={handleRestoreCategoryForMonth}
            spendingByCategory={spendingByCategory}
            onUpdateBudget={handleUpdateBudget}
            onOpenNewCategoryModal={handleOpenNewCategoryModal}
            onEditCategory={handleOpenEditCategoryModal}
            onDeleteCategory={handleDeleteCategory}
            onRestoreDefaultCategories={handleRestoreDefaultCategories}
          />
        </section>

        {/* 5. Registro de Despesas Diárias (Lançamentos) */}
        <section
          aria-label="Lançamentos de Despesas"
          className={
            mobileTab === 'tudo' || mobileTab === 'despesas'
              ? 'block'
              : 'hidden md:block'
          }
        >
          <ExpenseTable
            expenses={activeExpenses}
            categories={categories}
            currentMonthLabel={currentMonth === 'all' ? 'Todos os Meses' : currentMonth}
            onOpenNewExpenseModal={handleOpenNewModal}
            onEditExpense={handleOpenEditModal}
            onDeleteExpense={handleDeleteExpense}
          />
        </section>
      </main>

      {/* Floating Bottom Nav for Mobile */}
      <MobileBottomNav
        activeTab={mobileTab}
        onChangeTab={setMobileTab}
        onOpenNewExpense={handleOpenNewModal}
        onOpenDiagnosis={handleOpenDiagnosis}
        expensesCount={activeExpenses.length}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400 pb-20 md:pb-6 transition-colors">
        <p>
          Consignatec &copy; {new Date().getFullYear()} &mdash; Ferramenta de Gestão Financeira &amp; Orçamento Pessoal.
        </p>
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          Valores formatados no padrão nacional (R$). Sincronização em tempo real na nuvem (Firestore) &amp; inteligência artificial Google Gemini.
        </p>
      </footer>

      {/* Expense Modal (Add / Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={editingExpense ? handleEditExpense : handleAddExpense}
        initialExpense={editingExpense}
        categories={displayCategories.length > 0 ? displayCategories : categories}
        defaultYearMonth={currentYearMonth}
        onOpenNewCategory={handleOpenNewCategoryModal}
      />

      {/* Category Modal (Add / Edit) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        existingCategories={categories}
        initialCategory={editingCategoryItem}
      />

      {/* Delete Category Confirmation Modal */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        title={
          currentMonth !== 'all'
            ? `Excluir Categoria de ${currentMonth}`
            : 'Excluir Categoria do Sistema'
        }
        message={
          currentMonth !== 'all'
            ? countExpensesForDeletedCategory > 0
              ? `A categoria "${categoryToDelete?.name}" possui ${countExpensesForDeletedCategory} lançamento(s) em ${currentMonth}. Ao excluí-la, ela será ocultada da tabela de metas somente deste mês. Suas despesas históricas e o cadastro nos outros meses permanecerão 100% preservados.`
              : `Deseja excluir a categoria "${categoryToDelete?.name}" somente do mês de ${currentMonth}? Ela continuará ativa e disponível normalmente nos outros meses.`
            : `Tem certeza que deseja excluir a categoria "${categoryToDelete?.name}" de todo o sistema?`
        }
        confirmLabel={
          currentMonth !== 'all'
            ? `Excluir de ${currentMonth}`
            : 'Excluir Categoria'
        }
        cancelLabel="Cancelar"
        variant="danger"
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDeleteCategory}
        details={
          categoryToDelete && (
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: `${categoryToDelete.color}20`,
                    color: categoryToDelete.color,
                  }}
                >
                  <CategoryIcon iconName={categoryToDelete.icon} className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {categoryToDelete.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Teto orçamentário: {formatBRL(categoryToDelete.budget)}
                  </div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                {countExpensesForDeletedCategory} lançamento(s)
              </span>
            </div>
          )
        }
      />

      {/* Delete Expense Confirmation Modal */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        title="Excluir Lançamento"
        message="Tem certeza que deseja excluir esta despesa? O valor será deduzido do total de gastos e o saldo do orçamento será recalculado."
        confirmLabel="Excluir Lançamento"
        cancelLabel="Cancelar"
        variant="danger"
        onCancel={() => setExpenseToDelete(null)}
        onConfirm={handleConfirmDelete}
        details={
          expenseToDelete && (
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {expenseToDelete.descricao}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatDateBR(expenseToDelete.data)} &bull; {expenseToDelete.categoria} &bull; {expenseToDelete.forma_pagamento}
                </div>
              </div>
              <div className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                {formatBRL(expenseToDelete.valor)}
              </div>
            </div>
          )
        }
      />

      {/* Reset Modal (Zero selected month, wipe database or restore sample) */}
      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onResetSelectedMonth={handleResetSelectedMonth}
        onResetAllMonths={handleResetAllMonths}
        onWipeDatabaseAndStartFromZero={handleWipeDatabaseAndStartFromZero}
        onResetBudgetsToZero={handleResetBudgetsToZero}
        onRestoreDemoData={handleRestoreSampleData}
        onRestoreDefaultCategories={handleRestoreDefaultCategories}
        currentMonth={currentMonth}
        selectedMonthExpenseCount={activeExpenses.length}
        selectedMonthTotalSpent={totalExpenses}
        totalExpenseCount={expenses.length}
      />

      {/* Global Alert Toast */}
      {globalAlertMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{globalAlertMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setGlobalAlertMessage(null)}
            className="text-slate-400 hover:text-white dark:text-slate-500 dark:hover:text-slate-900 p-1 rounded-lg text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* AI Financial Diagnosis Modal */}
      <DiagnosisModal
        isOpen={isDiagnosisModalOpen}
        onClose={() => setIsDiagnosisModalOpen(false)}
        diagnosis={diagnosisData}
        isLoading={isGeneratingDiagnosis}
        onRefresh={fetchDiagnosis}
      />

      {/* Real-time Connectivity / Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
