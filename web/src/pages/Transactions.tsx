import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { Plus, Trash2, TrendingUp, TrendingDown, X, Receipt, Pencil, Filter, ArrowUpDown, Calendar, Paperclip, FileText, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ref as sRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { CURRENCIES, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../constants';
import type { Transaction } from '../types';
import { useSettings } from '../contexts/SettingsContext';

export default function Transactions() {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { baseCurrency } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  // Filter & Sort State
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Derived filtered & sorted transactions
  const filteredTransactions = transactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .filter(t => filterCategory === 'all' || t.category === filterCategory)
    .filter(t => !startDate || t.date >= startDate)
    .filter(t => !endDate || t.date <= endDate)
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = parseISO(a.date).getTime() - parseISO(b.date).getTime();
      } else {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination Logic
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: any) => void, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  // Derived unique categories for the filter dropdown
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category))).sort();

  // Dynamic lists for the Add/Edit Modal
  const dynamicIncomeCats = Array.from(new Set([
    ...DEFAULT_INCOME_CATEGORIES,
    ...transactions.filter(t => t.type === 'income').map(t => t.category)
  ])).sort();

  const dynamicExpenseCats = Array.from(new Set([
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...transactions.filter(t => t.type === 'expense').map(t => t.category)
  ])).sort();

  if (loading) return <div className="text-secondary text-center mt-4">Loading transactions...</div>;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: 'var(--radius-md)' }}>
            <Receipt size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Transactions</h1>
            <p className="text-secondary">Manage your income and expenses.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: 'max-content' }}>
          <button 
            className={`btn ${isFilterVisible ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setIsFilterVisible(!isFilterVisible)}
          >
            <Filter size={18} />
            Filters {isFilterVisible ? '(Hide)' : ''}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => { setEditingTx(null); setIsModalOpen(true); }} 
            style={{ flex: 1 }}
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      {isFilterVisible && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-end', backgroundColor: 'var(--bg-panel)', animation: 'slideDown 0.3s ease' }}>
          <div style={{ flex: '1 1 150px' }}>
            <label className="label" style={{ fontSize: '0.75rem' }}>Type</label>
            <select className="select" style={{ padding: '0.5rem', fontSize: '0.85rem' }} value={filterType} onChange={(e) => handleFilterChange(setFilterType, e.target.value as any)}>
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label className="label" style={{ fontSize: '0.75rem' }}>Category</label>
            <select className="select" style={{ padding: '0.5rem', fontSize: '0.85rem' }} value={filterCategory} onChange={(e) => handleFilterChange(setFilterCategory, e.target.value)}>
              <option value="all">All Categories</option>
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label className="label" style={{ fontSize: '0.75rem' }}>Start Date</label>
            <div style={{ position: 'relative' }}>
              <input type="date" className="input" style={{ padding: '0.4rem 0.4rem 0.4rem 2.2rem', fontSize: '0.85rem' }} value={startDate} onChange={(e) => handleFilterChange(setStartDate, e.target.value)} />
              <Calendar size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label className="label" style={{ fontSize: '0.75rem' }}>End Date</label>
            <div style={{ position: 'relative' }}>
              <input type="date" className="input" style={{ padding: '0.4rem 0.4rem 0.4rem 2.2rem', fontSize: '0.85rem' }} value={endDate} onChange={(e) => handleFilterChange(setEndDate, e.target.value)} />
              <Calendar size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ flex: '1 1 120px' }}>
            <label className="label" style={{ fontSize: '0.75rem' }}>Show Per Page</label>
            <select 
              className="select" 
              style={{ padding: '0.5rem', fontSize: '0.85rem' }} 
              value={pageSize} 
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size} items</option>)}
            </select>
          </div>

          <div style={{ borderLeft: '1px solid var(--border-color)', height: '40px', display: 'none' }} className="d-md-block" />

          <div style={{ flex: '1 1 120px' }}>
            <label className="label" style={{ fontSize: '0.75rem' }}>Sort By</label>
            <select className="select" style={{ padding: '0.5rem', fontSize: '0.85rem' }} value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
          </div>

          <button 
            className="btn btn-outline" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '38px' }}
            onClick={() => handleFilterChange(setSortOrder, sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <><ArrowUpDown size={14} /> Asc</> : <><ArrowUpDown size={14} /> Desc</>}
          </button>
          
          <button 
            className="btn btn-outline text-danger" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '38px' }}
            onClick={() => {
              setFilterType('all');
              setFilterCategory('all');
              setStartDate('');
              setEndDate('');
              setSortBy('date');
              setSortOrder('desc');
            }}
          >
            Reset
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredTransactions.length === 0 ? (
          <p className="text-secondary text-center" style={{ padding: '3rem 0' }}>No matching transactions found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {paginatedTransactions.map((t, index) => {
              const currentMonth = format(parseISO(t.date), 'MMMM yyyy');
              const prevMonth = index > 0 ? format(parseISO(paginatedTransactions[index - 1].date), 'MMMM yyyy') : null;
              const isNewMonth = currentMonth !== prevMonth;

              return (
                <div key={t.id}>
                  {isNewMonth && (
                    <div style={{ 
                      padding: '0.75rem 1.5rem', 
                      backgroundColor: 'var(--bg-color)', 
                      fontSize: '0.875rem', 
                      fontWeight: 700, 
                      color: 'var(--primary-color)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--border-color)',
                      borderTop: index > 0 ? '1px solid var(--border-color)' : 'none'
                    }}>
                      {currentMonth}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 min-content' }}>
                      <div style={{ 
                        padding: '0.75rem', 
                        borderRadius: '50%', 
                        backgroundColor: t.type === 'income' ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: t.type === 'income' ? 'var(--success-text)' : 'var(--danger-text)'
                      }}>
                        {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, fontSize: '1.05rem' }}>{t.category}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {format(parseISO(t.date), 'MMM d, yyyy')} {t.note && ` • ${t.note}`}
                        {t.attachmentUrl && (
                          <a 
                            href={t.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.75rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Paperclip size={14} />
                            View Attachment
                          </a>
                        )}
                      </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 0 auto', justifyContent: 'flex-end', minWidth: '120px' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '1.125rem',
                        color: t.type === 'income' ? 'var(--success-text)' : 'var(--danger-text)',
                        marginRight: '0.5rem'
                      }}>
                        {t.type === 'income' ? '+' : '-'}{t.currency || 'USD'} {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      
                      {/* Edit Button */}
                      <button 
                        onClick={() => { setEditingTx(t); setIsModalOpen(true); }} 
                        className="btn btn-outline" 
                        style={{ padding: '0.5rem', border: 'none', color: 'var(--text-secondary)' }}
                        title="Edit Transaction"
                      >
                        <Pencil size={18} />
                      </button>

                      <button onClick={() => deleteTransaction(t.id)} className="btn text-danger" style={{ padding: '0.5rem', border: 'none' }} title="Delete Transaction">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Page <strong>{currentPage}</strong> of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-outline"
                style={{ padding: '0.4rem', borderRadius: '50%', minWidth: '36px', height: '36px' }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                className="btn btn-outline"
                style={{ padding: '0.4rem', borderRadius: '50%', minWidth: '36px', height: '36px' }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <TransactionModal 
          initialData={editingTx}
          baseCurrency={baseCurrency}
          onClose={() => setIsModalOpen(false)} 
          dynamicIncomeCats={dynamicIncomeCats}
          dynamicExpenseCats={dynamicExpenseCats}
          onSubmit={(data) => {
            if (editingTx) {
              updateTransaction(editingTx.id, data).catch(console.error);
            } else {
              addTransaction(data).catch(console.error);
            }
            setIsModalOpen(false);
          }} 
        />
      )}
    </div>
  );
}

function TransactionModal({ onClose, onSubmit, initialData, baseCurrency, dynamicIncomeCats, dynamicExpenseCats }: { 
  onClose: () => void, 
  onSubmit: (data: any) => void, 
  initialData?: Transaction | null, 
  baseCurrency: string,
  dynamicIncomeCats: string[],
  dynamicExpenseCats: string[]
}) {
  const { user } = useAuth();
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '');
  
  const cats = type === 'expense' ? dynamicExpenseCats : dynamicIncomeCats;
  
  let initialCat = initialData?.category || '';
  let initialCustom = '';
  if (initialData?.category && !cats.includes(initialData.category)) {
      initialCat = 'new_custom';
      initialCustom = initialData.category;
  }
  
  const [category, setCategory] = useState(initialCat);
  const [customCategory, setCustomCategory] = useState(initialCustom);
  
  const [date, setDate] = useState(initialData?.date || format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState(initialData?.note || '');
  const [currency, setCurrency] = useState(initialData?.currency || baseCurrency);

  // Attachment State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachmentUrl] = useState(initialData?.attachmentUrl || '');
  const [attachmentName] = useState(initialData?.attachmentName || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const isFormValid = !!amount && parseFloat(amount) > 0 && (category === 'new_custom' ? !!customCategory : !!category) && !!date;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    const finalCategory = category === 'new_custom' ? customCategory : category;
    if (!finalCategory) return;

    let finalUrl = attachmentUrl;
    let finalName = attachmentName;

    if (file && user) {
      setIsUploading(true);
      const timestamp = Date.now();
      const storagePath = `users/${user.uid}/attachments/${timestamp}_${file.name}`;
      const fileRef = sRef(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(fileRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          }, 
          (error) => {
            console.error("Upload failed:", error);
            setIsUploading(false);
            reject(error);
          }, 
          async () => {
            finalUrl = await getDownloadURL(uploadTask.snapshot.ref);
            finalName = file.name;
            resolve();
          }
        );
      });
    }
    
    onSubmit({
      type,
      amount: parseFloat(amount),
      category: finalCategory,
      date,
      note,
      currency,
      attachmentUrl: finalUrl,
      attachmentName: finalName
    });
  };


  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1rem'
    }}>
      <div className="card w-full" style={{ maxWidth: '500px', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}>
          <X size={24} />
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          {initialData ? 'Edit Transaction' : 'Add Transaction'}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="flex gap-2">
            <button 
              type="button" 
              className="btn flex-1"
              style={{ 
                backgroundColor: type === 'income' ? 'var(--success-bg)' : 'var(--bg-color)',
                color: type === 'income' ? 'var(--success-text)' : 'var(--text-primary)',
                border: type === 'income' ? '1px solid var(--success-text)' : '1px solid var(--border-color)'
              }}
              onClick={() => { setType('income'); setCategory(''); }}
            >
              Income
            </button>
            <button 
              type="button" 
              className="btn flex-1"
              style={{ 
                backgroundColor: type === 'expense' ? 'var(--danger-bg)' : 'var(--bg-color)',
                color: type === 'expense' ? 'var(--danger-text)' : 'var(--text-primary)',
                border: type === 'expense' ? '1px solid var(--danger-text)' : '1px solid var(--border-color)'
              }}
              onClick={() => { setType('expense'); setCategory(''); }}
            >
              Expense
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label className="label">Amount</label>
              <input 
                type="number" step="0.01" required className="input" 
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label className="label">Currency</label>
              <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Category</label>
            <select className="select" required value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="" disabled>Select Category</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="new_custom">+ Create New Category...</option>
            </select>
            
            {category === 'new_custom' && (
              <div style={{ marginTop: '0.75rem' }}>
                <input 
                  type="text" required className="input" 
                  value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div>
            <label className="label">Date</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date" required className="input" 
                style={{ paddingLeft: '2.5rem' }}
                value={date} onChange={(e) => setDate(e.target.value)}
              />
              <Calendar size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <label className="label">Note (Optional)</label>
            <input 
              type="text" className="input" 
              value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="E.g. Groceries at Target"
            />
          </div>

          <div>
            <label className="label">Attachment (PDF or Image)</label>
            <div style={{ 
              border: '2px dashed var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1rem', 
              textAlign: 'center',
              backgroundColor: 'var(--bg-color)',
              position: 'relative'
            }}>
              <input 
                type="file" 
                onChange={handleFileChange} 
                accept="image/*,application/pdf"
                id="file-upload"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                {file ? (
                  <>
                    <div className="flex items-center gap-2 text-primary font-medium">
                      {file.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                      <span style={{ fontSize: '0.9rem' }}>{file.name}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click or drag to replace</p>
                  </>
                ) : attachmentName ? (
                   <>
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Paperclip size={20} />
                      <span style={{ fontSize: '0.9rem' }}>{attachmentName}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current attachment. Click to replace.</p>
                  </>
                ) : (
                  <>
                    <Paperclip size={24} style={{ color: 'var(--text-secondary)' }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Upload Receipt or Bill</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PDF or Image (Max 5MB)</p>
                  </>
                )}
              </div>
            </div>
            {isUploading && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-color)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.2s ease' }} />
                </div>
                <p style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: '0.4rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!isFormValid || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                initialData ? 'Save Changes' : 'Save Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
