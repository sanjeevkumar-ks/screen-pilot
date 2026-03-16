# ScreenPilot — Multimodal AI UI Navigator 🚀

**ScreenPilot** is a production-quality AI agent that can **see your screen, understand UI elements, and execute actions** on websites automatically based on voice commands.

Built for the Gemini Multimodal Hackathon, it demonstrates the power of `gemini-1.5-flash` in handling real-world UI navigation and task automation.

---

## 🏗️ Architecture

```
User
 → Frontend (Next.js)
 → Backend (FastAPI)
 → Agent Controller
 → Gemini AI (Multimodal)
 → Playwright Automation
 → Target Websites
```

ScreenPilot uses a **structured multimodal agent loop**:

1. **Voice / Text Input**: User intent is captured via the Command Console (Web Speech API or text).
2. **Intent Detection**: Simple commands (navigation, search, greetings) are handled instantly via rule-based matching — no AI call needed.
3. **Agent Controller** (`agent_controller.py`): Orchestrates the full loop for complex tasks:
   - Captures a browser screenshot.
   - Sends the screenshot + goal to Gemini with a structured prompt.
   - Receives a JSON action plan (`thought`, `actions[]`, `status`).
   - Validates each action (checks the DOM element exists) before executing.
   - Executes steps via Playwright and tracks progress in a session store.
   - Retries failed steps (up to 2 retries) by requesting a new plan.
   - Stops after goal completion, AI-reported failure, or 15 iterations.
4. **Session Memory**: An in-memory store tracks goal, completed steps, current step index, and last screenshot per task.
5. **Status Events**: The agent emits statuses (`analyzing → planning → executing → completed/failed`) that the frontend polls every 1.5 s.

See [Architecture Diagram](./architecture/system-architecture.md) for more details.

---

## ✨ Core Features

-   🎙️ **Voice Command Interface**: Hands-free interaction using browser-native Speech API.
-   👁️ **Multimodal Understanding**: Gemini-powered UI analysis (inputs, buttons, forms).
-   🤖 **Autonomous Agent**: Self-correcting loop that navigates until the goal is achieved.
-   📊 **Live Action Logs**: Transparent reasoning and execution logs.
-   🎨 **Futuristic UI**: Modern, clean, and responsive design built with Next.js and TailwindCSS.

---

## 🛠️ Tech Stack

-   **Frontend**: Next.js 14, React, TailwindCSS, Lucide Icons, Framer Motion.
-   **Backend**: Python FastAPI, Pydantic.
-   **AI**: Google Gemini 1.5 Flash (Multimodal Reasoning).
-   **Automation**: Playwright (Browser Engine).
-   **Infrastructure**: Docker, Google Cloud Run.

---

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+
-   Python 3.10+
-   Google Gemini API Key

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd screenpilot-agent
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
playwright install chromium
```

Create a `.env` file in the `backend/` directory:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

Run the backend:
```bash
python main.py
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Google Cloud Deployment

### 1. Backend (Cloud Run)

The easiest way to deploy is using the provided deployment script:

```bash
cd backend
# Ensure your .env file has the correct GOOGLE_API_KEY
./deploy.sh
```

#### Manual Deployment via CLI:
If you prefer manual steps, use the following commands:

1.  **Build & Push**:
    ```bash
    gcloud builds submit --tag gcr.io/[PROJECT_ID]/screenpilot-backend
    ```

2.  **Deploy with Environment Variables**:
    ```bash
    gcloud run deploy screenpilot-backend \
      --image gcr.io/[PROJECT_ID]/screenpilot-backend \
      --set-env-vars GOOGLE_API_KEY=your_actual_key_here \
      --allow-unauthenticated
    ```

### 🔐 Security Best Practice: Secret Manager
For production, avoid passing keys in plain text. Use Google Cloud Secret Manager:

1.  **Create Secret**:
    ```bash
    echo -n "your_api_key" | gcloud secrets create GEMINI_API_KEY --data-file=-
    ```
2.  **Deploy using Secret**:
    ```bash
    gcloud run deploy screenpilot-backend \
      --image gcr.io/[PROJECT_ID]/screenpilot-backend \
      --set-secrets GOOGLE_API_KEY=GEMINI_API_KEY:latest
    ```

---

## 📝 Example Commands

-   "Search for the cheapest flights from London to Paris on Skyscanner."
-   "Book a train ticket from Chennai to Bangalore for tomorrow on IRCTC."
-   "Find the latest news about AI on TechCrunch and summarize the first article."

---

## 🛡️ License
MIT License. Built with ❤️ for the Gemini Hackathon.
