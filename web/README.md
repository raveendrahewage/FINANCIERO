# Financiero - Web Frontend 🎨

This is the React frontend for the **Financiero** personal finance platform.

## 🚀 Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Setup:**
    Create a `.env.local` file with:
    ```env
    VITE_FIREBASE_API_KEY=your_key
    VITE_FIREBASE_AUTH_DOMAIN=your_domain
    VITE_FIREBASE_PROJECT_ID=your_id
    VITE_FIREBASE_STORAGE_BUCKET=your_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_GEMINI_API_KEY=your_gemini_key
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## 🛠 Features
- **AI Insights:** Powered by Google Gemini with streaming responses.
- **E2EE Privacy:** Bank-grade AES-GCM encryption for sensitive data.
- **Multi-Currency:** Support for 8+ major currencies with real-time normalization.
- **Visual Analytics:** Interactive charts powered by Recharts.
- **Responsive Design:** Native mobile-first glassmorphism UI.

## 📁 Structure
- `/src/contexts`: Global state (Auth, Settings, Exchange Rates).
- `/src/hooks`: Data synchronization and business logic.
- `/src/pages`: Main application views.
- `/src/utils`: Cryptography, AI integration, and helpers.
