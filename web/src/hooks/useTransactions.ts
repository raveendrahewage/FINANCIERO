import { useState, useEffect } from 'react';
import { collection as fsCollection, query as fsQuery, orderBy as fsOrderBy, onSnapshot as fsOnSnapshot, addDoc as fsAddDoc, deleteDoc as fsDeleteDoc, updateDoc as fsUpdateDoc, doc as fsDoc, serverTimestamp as fsServerTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref as sRef, deleteObject as sDeleteObject } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import type { Transaction } from '../types';
export type { Transaction };
import { encryptData, decryptData } from '../utils/crypto';

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
      fsOrderBy('date', 'desc'),
      fsOrderBy('createdAt', 'desc')
    );

    const unsubscribe = fsOnSnapshot(q, async (snapshot) => {
      // Because AES decryption is asynchronous, map documents out first
      const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const decryptedData = await Promise.all(docsData.map(async (raw: any) => {
        // Only trigger decryption sweeps on newly encrypted payloads
        if (raw.isEncrypted) {
          try {
            const decNote = await decryptData(raw.note || '');
            const decAmountStr = await decryptData(raw.amountStr || '0');
            const decCategory = await decryptData(raw.category || '');
            const decAttachUrl = raw.attachmentUrl ? await decryptData(raw.attachmentUrl) : undefined;
            const decAttachName = raw.attachmentName ? await decryptData(raw.attachmentName) : undefined;

            return {
              ...raw,
              note: decNote,
              amount: parseFloat(decAmountStr),
              category: decCategory,
              attachmentUrl: decAttachUrl,
              attachmentName: decAttachName
            } as Transaction;
          } catch(e) {
            console.error("Failed to decrypt row ID: ", raw.id, e);
            return raw as Transaction;
          }
        }
        
        // Pass-through legacy plaintext records smoothly
        return raw as Transaction;
      }));
      
      setTransactions(decryptedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) throw new Error("Not logged in");
    
    // Encrypt sensitive metadata actively before it leaves the browser!
    const encNote = await encryptData(data.note || '');
    const encAmount = await encryptData(String(data.amount));
    const encCategory = await encryptData(data.category);
    const encAttachUrl = data.attachmentUrl ? await encryptData(data.attachmentUrl) : null;
    const encAttachName = data.attachmentName ? await encryptData(data.attachmentName) : null;

    return fsAddDoc(fsCollection(db, 'users', user.uid, 'transactions'), {
      ...data,
      note: encNote,
      amountStr: encAmount,
      amount: 0, // Hard-masked on the backend database index to prevent raw scraping
      category: encCategory,
      attachmentUrl: encAttachUrl,
      attachmentName: encAttachName,
      isEncrypted: true,
      createdAt: fsServerTimestamp()
    });
  };

  const updateTransaction = async (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    if (!user) throw new Error("Not logged in");
    
    // Intercept partial update commands and inject encryption layer
    const payload: any = { ...data, isEncrypted: true };
    if (data.note !== undefined) payload.note = await encryptData(data.note);
    if (data.amount !== undefined) {
      payload.amountStr = await encryptData(String(data.amount));
      payload.amount = 0; // Hard-masked
    }
    if (data.category !== undefined) payload.category = await encryptData(data.category);
    if (data.attachmentUrl !== undefined) payload.attachmentUrl = data.attachmentUrl ? await encryptData(data.attachmentUrl) : null;
    if (data.attachmentName !== undefined) payload.attachmentName = data.attachmentName ? await encryptData(data.attachmentName) : null;

    return fsUpdateDoc(fsDoc(db, 'users', user.uid, 'transactions', id), payload);
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error("Not logged in");
    const tx = transactions.find(t => t.id === id);
    
    // Cleanup storage if there's an attachment
    if (tx?.attachmentUrl) {
      try {
        // We need to determine the storage path. 
        // Our upload path will be: `users/${user.uid}/attachments/${fileName}_${timestamp}`
        // But the safest way is to parse the URL or store the path.
        // For now, if we have the URL, we can attempt to delete by reference if it's a firebase URL.
        const fileRef = sRef(storage, tx.attachmentUrl);
        await sDeleteObject(fileRef);
      } catch (e) {
        console.warn("Cloud Storage deletion failed (likely already gone or external):", e);
      }
    }

    return fsDeleteDoc(fsDoc(db, 'users', user.uid, 'transactions', id));
  };

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction };
}
