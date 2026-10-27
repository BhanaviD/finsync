# ⚡ FinSync Quick Start (5 Minutes)

## **1️⃣ Install Dependencies (2 min)**

```bash
npm install express cors dotenv @google/generative-ai axios
npx expo install expo-av expo-notifications expo-localization expo-linking
npm install firebase
```

---

## **2️⃣ Add Gemini API Key (1 min)**

```bash
# Get key from: https://aistudio.google.com/app/apikey

# Update .env file
echo "GEMINI_API_KEY=YOUR_KEY_HERE" > .env
echo "PORT=3000" >> .env
```

---

## **3️⃣ Start API Server (Terminal 1)**

```bash
node api.js
```

**Should see:** ✅ Gemini API key loaded successfully

---

## **4️⃣ Test API (Terminal 2)**

```bash
# Health check
curl http://localhost:3000/health

# Kannada explanation
curl -X POST http://localhost:3000/api/explain-vernacular \
  -H "Content-Type: application/json" \
  -d "{\"textQuery\": \"What is credit score?\", \"userLanguage\": \"kn\"}"
```

---

## **5️⃣ Start Expo App (Terminal 3)**

```bash
npx expo start
```

Press **`w`** for web browser

---

## **6️⃣ Login & Test**

- **Email:** `learner@example.com`
- **Password:** anything
- Click **Login**
- See Kannada dashboard ✅

---

## **🎯 Key Features**

✅ **Kannada Explanations** - All responses in Kannada  
✅ **Voice Input** - Ask questions by speaking  
✅ **Fraud Detection** - Mentor reviews flagged transactions  
✅ **Mock UPI** - Test payment flow  

---

## **📞 Endpoints**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Check API status |
| POST | `/api/explain-vernacular` | Get Kannada explanation |
| POST | `/api/explain-voice` | Process audio (legacy) |

---

## **🔑 Test Credentials**

| Role | Email | Password |
|------|-------|----------|
| Learner | learner@example.com | any |
| Mentor | mentor@example.com | any |

---

**Done! 🎉 Your FinSync app is ready!**

