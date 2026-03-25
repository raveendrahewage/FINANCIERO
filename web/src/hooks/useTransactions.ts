import { useState, useEffect } from 'react';
import { collection as fsCollection, query as fsQuery, orderBy as fsOrderBy, onSnapshot as fsOnSnapshot, addDoc as fsAddDoc, deleteDoc as fsDeleteDoc, updateDoc as fsUpdateDoc, doc as fsDoc, serverTimestamp as fsServerTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Transaction } from '../types';

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const q = fsQuery(
      fsCollection(db, 'users', user.uid, 'transactions'),
      fsOrderBy('date', 'desc')
    );

    const unsubscribe = fsOnSnapshot(q, (snapshot) => {
      const data: Transaction[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching transactions", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) throw new Error("Not logged in");
    return fsAddDoc(fsCollection(db, 'users', user.uid, 'transactions'), {
      ...data,
      createdAt: fsServerTimestamp()
    });
  };

  const updateTransaction = async (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    if (!user) throw new Error("Not logged in");
    return fsUpdateDoc(fsDoc(db, 'users', user.uid, 'transactions', id), data);
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error("Not logged in");
    return fsDeleteDoc(fsDoc(db, 'users', user.uid, 'transactions', id));
  };

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction };
}
