import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Transaction } from "../types";

if (!import.meta.env.VITE_GEMINI_API_KEY) {
  console.warn("VITE_GEMINI_API_KEY is not defined. AI features will fallback to local mode.");
}
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export interface FinancialInsights {
  spendingPattern: string;
  unusualExpenses: {
    id: string;
    category: string;
    amount: number;
    date: string;
    note: string;
  }[];
  savingsPlan: {
    needs: number;
    wants: number;
    savings: number;
    total: number;
  } | null;
}

const SYSTEM_PROMPT = `
You are a expert personal financial advisor and an AI engine for the "Financiero" app.
Your goal is to analyze user transaction data and provide actionable, encouraging financial insights.
Be concise, professional, and helpful. Use markdown for bolding and lists.
`;

export async function getFinancialInsights(transactions: Transaction[], baseCurrency: string = 'USD'): Promise<FinancialInsights | null> {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  // Filter last 30 days for better focus
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
  const dataSummary = recentTransactions.map(t => ({
    id: t.id,
    type: t.type,
    amount: `${t.amount} ${t.currency || 'USD'}`, // Combine amount and currency for clarity
    category: t.category,
    date: t.date,
    note: t.note
  }));

  const prompt = `
    Analyze the following recent 30-day transactions. 
    Important: The user's base currency is ${baseCurrency}. 
    Transactions are provided with their respective currency codes. 
    
    Data: ${JSON.stringify(dataSummary)}

    Return a JSON object with strictly the following structure:
    {
      "spendingPattern": "A concise summary of spending habits (e.g. food/dining vs last period)",
      "unusualExpenses": [
        {"id": "original_id_if_available", "category": "category", "amount": 100, "date": "YYYY-MM-DD", "note": "..."}
      ],
      "savingsPlan": {
        "needs": 50% of total income,
        "wants": 30% of total income,
        "savings": 20% of total income,
        "total": total monthly income
      } or null if no income detected
    }

    Rules:
    - Return ONLY the JSON object.
    - unusualExpenses should only include significantly higher than average or unexpected expenses (excluding rent/bills).
    - savingsPlan should follow the 50/30/20 rule.
  `;

  try {
    const result = await model.generateContent([SYSTEM_PROMPT, prompt]);
    const response = await result.response;
    const text = response.text();
    // Clean JSON if LLM adds ```json blobs
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error: any) {
    console.error("AI Insight Error:", error.message || error);
    if (error.status === 429) {
      console.error("Quota exceeded for Gemini API");
    }
    return null; // Return null to trigger local fallback
  }
}

export async function chatWithAI(
  query: string, 
  transactions: Transaction[], 
  history: ChatMessage[],
  onChunk: (text: string) => void,
  baseCurrency: string = 'USD'
): Promise<string | null> {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
  
  const chat = model.startChat({
    history: history
      .filter((h, i) => !(i === 0 && h.role === 'ai'))
      .map(h => ({
        role: h.role === 'ai' ? 'model' : 'user',
        parts: [{ text: h.text }]
      })),
  });

  const context = `
    Context:
    The user is asking about their personal finances in the Financiero app.
    Their base currency is ${baseCurrency}.
    Here are their recent transactions (pay attention to the currency listed for each): ${JSON.stringify(transactions.slice(0, 50).map(t => ({
      amount: `${t.amount} ${t.currency || 'USD'}`,
      type: t.type,
      category: t.category,
      date: t.date,
      note: t.note
    })))}
    Answer the user's question concisely based on this data. Use markdown.
  `;

  try {
    const result = await chat.sendMessageStream([context, query]);
    let fullText = "";
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk(fullText); // Pass the accumulated text to the UI
    }
    
    return fullText;
  } catch (error: any) {
    console.error("Chat Error:", error.message || error);
    return null;
  }
}
