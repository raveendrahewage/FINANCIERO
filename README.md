# Financiero 💰

**Financiero** is a premium, AI-powered personal finance management application built during a 1.5-hour rapid hacking sprint. It is designed with a mobile-first, native glassmorphism UI, effortlessly scaling from Desktop browsers to iOS/Android web views natively. 

## 🚀 Live Demo
Access the live application here: [https://financiero-abca3.web.app](https://financiero-abca3.web.app)

---

## ✨ Core Features

### 🔐 Secure Identity & Real-Time Sync
- **Google Authentication:** Seamlessly log in using your Google Account securely managed by Firebase Auth.
- **Real-Time Database Sync:** All transactions are instantly saved and synchronized across your devices via Firestore NoSQL.
- **End-to-End Encryption (E2EE):** Sensitive transaction metrics (Amounts, Notes, Categories) are secured via native WebCrypto `AES-GCM` encryption tunnels inside the browser *before* hitting Firebase, establishing a true Zero-Knowledge infrastructure.

### 💸 Core Finance Tracking
- **Multi-Currency Engine:** Record transactions natively in USD, EUR, GBP, LKR, INR, JPY, AUD, or CAD.
- **Custom Categories:** Dynamically add your own specialized categories onto the fly if the default buckets don't fit your lifestyle.
- **Combined Equity Matrix:** The unified Dashboard automatically cross-calculates multi-currency spends back to a unified USD projection base for seamless charting.

### 🔔 Budget Limits & Real-Time Alerts
- **Global Limits:** Set strict amount constraints by timeframe (Monthly vs All-Time totals), specific Currencies, or explicit Expense Categories.
- **Reactive Alert Overlays:** The moment a logged transaction pushes your history over your formally defined limits, a fixed, brightly-colored toast notification dynamically alerts you instantly via the top-right overlay.

### 🤖 The "AI Insights" Suite (Local NLP)
- **Zero-API-Key Tracking:** Employs entirely local, deeply isolated algorithmic logic to parse spending datasets securely without bouncing raw data to OpenAi/Anthropic.
- **Anomaly Detection:** Scans your trailing 30-day cash flow to identify massive irregular expense spikes.
- **Predictive Spending:** Evaluates Month-over-Month specific category velocities (e.g. intelligently tracking your "Dining" changes).
- **Automated 50/30/20 Budgeting:** Computes your recent verified income to output a mathematically scaled ideal spending protocol.
- **Natural Language Chat (Mock-NLP):** Text queries like *"Where did I spend the most last month?"* or *"What is my total income?"* securely trigger dataset scrapes, perfectly mimicking LLM interaction bounds.

---

## 🎨 Design System
- **Dark & Light Mode Integration:** Features native CSS-variable swapping tied directly to your OS preference, cleanly configurable from the Sidebar.
- **Fluid Layout Architecture:** Utilizes robust CSS mathematical boundaries (`minmax()`, `clamp()`) over bulky UI framework libraries to maintain an incredibly lightweight, pure, and fast-painting UI that never breaks element encapsulation regardless of device width.
- **Custom Branding:** Hand-crafted embedded `.SVG` vector interfaces and unified iconography matching the core color profile seamlessly.

---

## 🛠 Tech Stack
- Frontend Framework: **React 19 + Vite**
- State Management: **Context API + Custom Hooks**
- Data Analytics/Visualization: **Recharts**
- Iconography: **Lucide React**
- Backend architecture: **Firebase (Auth / Firestore / Hosting)**
- Language: **TypeScript**
