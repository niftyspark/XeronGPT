<div align="center">

# 🧠 XeronGPT

### *Your Intelligent Multi-Model AI Chat Assistant*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-xeron--gpt.vercel.app-lime?style=for-the-badge)](https://xeron-gpt.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-97.7%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

<br/>

<img src="https://raw.githubusercontent.com/niftyspark/XeronGPT/main/avatar.glb" alt="XeronGPT" width="120"/>

<p align="center">
  <strong>A sleek, modern AI chat application powered by multiple frontier models — Claude Opus, Claude Sonnet, GLM 5 Turbo, and Grok 4.20 — with real-time web browsing, file uploads, live code canvas, task scheduling, and persistent chat history via Firebase.</strong>
</p>

[🚀 Live Demo](https://xeron-gpt.vercel.app) •
[✨ Features](#-features) •
[📸 Screenshots](#-screenshots) •
[🛠️ Tech Stack](#️-tech-stack) •
[⚡ Quick Start](#-quick-start) •
[📖 Usage](#-usage) •
[🏗️ Architecture](#️-architecture) •
[🤝 Contributing](#-contributing)

<br/>

---

</div>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 Multi-Model Support
Switch seamlessly between cutting-edge AI models:
- **Claude Opus 4.6** — Anthropic's most capable model
- **Claude Sonnet 4.6** — Fast & intelligent
- **GLM 5 Turbo** — High-speed reasoning
- **Grok 4.20 Multi-Agent Beta** — xAI's latest

</td>
<td width="50%">

### 🌐 Web Browsing & Search
- **Web Search** — Real-time DuckDuckGo search integration
- **Live Browser Agent** — Browse any URL and extract content using Cheerio
- **Smart Context** — Search results automatically injected into AI context

</td>
</tr>
<tr>
<td width="50%">

### 📎 File Uploads
- Upload **images** with visual AI analysis
- Upload **code files** (`.js`, `.ts`, `.py`, `.html`, `.css`, etc.)
- Upload **documents** (`.txt`, `.md`, `.json`, `.csv`)
- Multi-file support with preview thumbnails

</td>
<td width="50%">

### 💾 Persistent Chat History
- **Google Authentication** via Firebase
- **Real-time sync** — Conversations saved to Firestore
- **Search** across all your past conversations
- **Delete** individual chats with optimistic UI updates

</td>
</tr>
<tr>
<td width="50%">

### 🖥️ Live Code Canvas
- Interactive code editor built into the chat
- Write, edit, and preview code in real-time
- Supports multiple programming languages
- Perfect for collaborative coding with AI

</td>
<td width="50%">

### 📅 Task Scheduler
- Schedule and manage AI-powered tasks
- Organize your workflow directly from the sidebar
- Integrated task management system

</td>
</tr>
<tr>
<td colspan="2" align="center">

### ⚡ Streaming Responses & Beautiful UI
Real-time token-by-token streaming • Markdown rendering with syntax highlighting • Dark theme with animated backgrounds • Responsive design • Copy-to-clipboard • Abort generation mid-stream

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technologies |
|:---:|:---|
| **Frontend** | React 19 · TypeScript · Tailwind CSS 4 · Vite 6 · Lucide Icons · Motion · React Markdown |
| **Backend** | Express.js · Node.js · TSX · Cheerio (web scraping) |
| **AI Models** | 4Everland API Gateway → Claude Opus/Sonnet · GLM 5 · Grok 4.20 |
| **Auth & DB** | Firebase Auth (Google) · Cloud Firestore (real-time sync) |
| **Integrations** | Composio (social media tools) · DuckDuckGo Search |
| **Deployment** | Vercel · Google AI Studio |

</div>

---

## 📁 Project Structure

XeronGPT/ ├── api/ │ └── index.ts # Vercel serverless API entry ├── src/ │ ├── components/ │ │ ├── Avatar.tsx # 3D Avatar component │ │ ├── Canvas.tsx # Live Code Canvas editor │ │ └── TaskScheduler.tsx # Task scheduling component │ ├── App.tsx # Main application component │ ├── api.ts # AI model streaming & web tools │ ├── db.ts # Firestore database operations │ ├── firebase.ts # Firebase configuration │ ├── index.css # Global styles │ ├── main.tsx # React entry point │ └── vite-env.d.ts # Vite type declarations ├── server.ts # Express dev server + browse API ├── vite.config.ts # Vite configuration ├── vercel.json # Vercel deployment config ├── package.json # Dependencies & scripts ├── tsconfig.json # TypeScript configuration ├── firestore.rules # Firestore security rules ├── firebase-blueprint.json # Firebase project blueprint ├── .env.example # Environment variables template └── avatar.glb # 3D avatar model file


---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn**
- A [Firebase project](https://console.firebase.google.com/) with Auth & Firestore enabled
- A [4Everland API key](https://4everland.org/) for AI model access
- *(Optional)* A [Composio API key](https://composio.dev/) for social media integrations

### 1. Clone the Repository

```bash
git clone https://github.com/niftyspark/XeronGPT.git
cd XeronGPT
2. Install Dependencies
npm install
3. Configure Environment Variables
Copy the example environment file and fill in your keys:

cp .env.example .env.local
Edit .env.local:

# App URL (auto-injected on Vercel/AI Studio)
APP_URL="http://localhost:3000"

# Composio API key for social media tools (optional)
COMPOSIO_API_KEY=your_composio_api_key_here

# 4Everland API key for AI model access
VITE_4EVERLAND_API_KEY=your_4everland_api_key_here
Note: Firebase config should be set in src/firebase.ts. Update with your own Firebase project credentials.

4. Run the Development Server
npm run dev
The app will be available at http://localhost:3000 🚀

📖 Usage
💬 Basic Chat
Sign in with your Google account
Select a model from the dropdown (Claude Opus, Sonnet, GLM, Grok)
Type your message and press Enter or click Send
Watch the AI stream its response in real-time
🌐 Web Search Mode
Click the 🌐 Globe icon to enable web search. Your queries will be searched on DuckDuckGo and the results will be fed to the AI for up-to-date answers.

🧭 Live Browser Agent
Click the 🧭 Compass icon to enable the browser agent. The AI can autonomously browse URLs you provide, extract content, and use it to answer your questions.

📎 File Uploads
Click the 📎 Paperclip icon to upload:

Images — The AI will analyze them visually
Code & Text files — Injected as context for the AI to review, debug, or explain
🖥️ Code Canvas
Click the 🖥️ Monitor icon to open the live code canvas for interactive coding sessions with AI assistance.

📅 Task Scheduler
Access the Task Schedule from the sidebar to organize and manage AI-powered tasks.

🏗️ Architecture
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                   │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────┐ │
│  │ Chat UI │ │  Canvas  │ │ Scheduler │ │ Auth   │ │
│  └────┬────┘ └─────┬────┘ └─────┬─────┘ └───┬────┘ │
│       │             │            │             │      │
│  ┌────▼─────────────▼────────────▼─────────────▼──┐  │
│  │              State Management (React)           │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼──────────────────────────────┘
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
   ┌──────────────┐ ┌────────┐ ┌──────────┐
   │ 4Everland AI │ │Firebase│ │ Express  │
   │   Gateway    │ │  Auth  │ │  Server  │
   │              │ │   +    │ │          │
   │ Claude Opus  │ │Firestore│ │ /api/   │
   │ Claude Sonnet│ │        │ │ browse   │
   │ GLM 5 Turbo  │ │        │ │          │
   │ Grok 4.20    │ │        │ │ Cheerio  │
   └──────────────┘ └────────┘ └──────────┘
📜 Available Scripts
Command	Description
npm run dev	Start development server with hot reload
npm run build	Build for production
npm run preview	Preview production build
npm run lint	Run TypeScript type checking
npm run clean	Remove dist folder
npm start	Start production server
🚀 Deployment
Deploy to Vercel
The project includes a vercel.json configuration and is optimized for Vercel deployment:

Push your code to GitHub
Import the repo on Vercel
Add your environment variables in Vercel's dashboard
Deploy! ✅
Deploy via Google AI Studio
This project was generated from the Google Gemini AI Studio template. You can also view and run it directly in AI Studio:

🔗 Open in AI Studio

🔐 Environment Variables
Variable	Required	Description
VITE_4EVERLAND_API_KEY	✅	API key for 4Everland AI gateway (model access)
COMPOSIO_API_KEY	❌	API key for Composio social media integrations
APP_URL	❌	App URL (auto-injected on cloud platforms)
🤝 Contributing
Contributions are welcome! Here's how you can help:

Fork the repository
Create a feature branch: git checkout -b feature/amazing-feature
Commit your changes: git commit -m 'Add amazing feature'
Push to the branch: git push origin feature/amazing-feature
Open a Pull Request
Ideas for Contributions
 Add more AI model providers
 Implement voice input/output
 Add conversation export (PDF/Markdown)
 Implement custom system prompts
 Add collaborative real-time chat rooms
 Plugin ecosystem for extending functionality
📄 License
This project is open source. Feel free to use, modify, and distribute.

<div align="center">
🌟 Star this repo if you found it useful!
<br/>
Built with ❤️ by niftyspark

<br/>
<sub>Powered by React · TypeScript · Firebase · Vercel · 4Everland AI</sub>

<br/>
⬆ Back to Top

</div> ```
