# Financiero 💰

**Financiero** is a premium, AI-powered personal finance management application built during a 1.5-hour rapid hacking sprint. It is designed with a mobile-first, native glassmorphism UI, effortlessly scaling from Desktop browsers to iOS/Android web views natively. 

## 🚀 Live Demo
Access the live application here: [https://financiero-abca3.web.app](https://financiero-abca3.web.app)

---

## ✨ Core Features

### 🔐 Private & Secure
- **Easy Sign-In:** Jump right in using your Google Account—fast, easy, and secure.
- **Your Data Stays Yours:** Thanks to "Zero-Knowledge" security, your personal financial details are encrypted on your device *before* they are ever saved. We can't see your transactions—only you can.
- **Bank-Grade Privacy:** We use advanced encryption to keep your money matters confidential and protected.

### 💸 Effortless Money Tracking
- **Multi-Currency Support:** Traveling or living abroad? Add transactions in any currency. We handle the math with **live exchange rates** to keep everything accurate.
- **Personalized Categories:** Organize your spending your way. Create custom labels for your groceries, hobbies, or business.
- **Combined View:** See your total "Net Worth" instantly. We automatically convert all your different currencies into a single, easy-to-read total.

### 🔔 Staying On Track
- **Spending Limits:** Set monthly goals or totals for specific categories to keep your budget healthy.
- **Smart Filtering:** Find any transaction in seconds. Filter by date, amount, or category with one tap.
- **Instant Alerts:** Get a friendly nudge when you're getting close to your limits, helping you avoid overspending.

### 🤖 AI Financial Assistant
- **Friendly Advice:** Our built-in AI assistant analyzes your habits to give you personalized tips on how to save more.
- **Instant Chat:** Ask questions like "How much did I spend on coffee last week?" and get answers instantly.
- **Budgeting Made Easy:** The AI can automatically suggest a healthy budget split based on your actual income history.

### ⚙️ User Settings & Personalization
- **Customizable Dashboard Layout:** A native **Drag and Drop** system allows you to reorder analytics widgets. Your custom layout is persisted in `localStorage`.
- **Global Base Currency:** Set your preferred default (e.g., LKR). All forms default to this selection for faster entry.
- **Dynamic Theming:** Seamlessly toggle between "Deep Dark" and "Vivid Light" modes.
- **Data Portability:** Export your entire transaction history to CSV format.

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
