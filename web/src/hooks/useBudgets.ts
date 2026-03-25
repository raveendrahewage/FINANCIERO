import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Budget } from '../types';

export function useBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    if (!user) {
      setBudgets([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'budgets')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Budget[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Budget);
      });
      setBudgets(data);
    }, (error) => {
      console.error("Error fetching budgets", error);
    });

    return () => unsubscribe();
  }, [user]);

  const addBudget = async (data: Omit<Budget, 'id'>) => {
    if (!user) throw new Error("Not logged in");
    return addDoc(collection(db, 'users', user.uid, 'budgets'), {
      ...data,
      createdAt: serverTimestamp()
    });
  };

  const deleteBudget = async (id: string) => {
    if (!user) throw new Error("Not logged in");
    return deleteDoc(doc(db, 'users', user.uid, 'budgets', id));
  };

  return { budgets, addBudget, deleteBudget };
}
