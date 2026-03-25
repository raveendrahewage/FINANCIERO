export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note: string;
  currency: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: any;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  currency: string;
  period: 'monthly' | 'all_time';
  ignored?: boolean;
}
