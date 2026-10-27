# 🎨 FinSync Visual Setup Guide

## **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    FINSYNC ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────┘

                    📱 MOBILE APP (Expo)
                         App.js
                    ┌─────────────────┐
                    │  Login Screen   │
                    │  Learner/Mentor │
                    │   Dashboards    │
                    └────────┬────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
         ┌──────▼──┐  ┌──────▼──┐  ┌────▼──────┐
         │ Firebase │  │ Expo    │  │  Axios   │
         │ Auth &   │  │ Notif & │  │  HTTP    │
         │ Database │  │ Audio   │  │ Requests │
         └──────┬──┘  └──────┬──┘  └────┬──────┘
                │            │           │
                └────────────┼───────────┘
                             │
                    ┌────────▼────────┐
                    │  Express API    │
                    │    api.js       │
                    │  Port 3000      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Google Gemini  │
                    │  AI (2.0 Flash) │
                    │  Kannada Output │
                    └─────────────────┘
```

---

## **Data Flow Diagram**

```
LEARNER ASKS QUESTION
        │
        ▼
┌──────────────────────┐
│  Expo App (App.js)   │
│  - Record audio      │
│  - Detect language   │
│  - Send to API       │
└──────────┬───────────┘
           │
           │ HTTP POST
           │ /api/explain-vernacular
           │
           ▼
┌──────────────────────┐
│  Express API (api.js)│
│  - Receive query     │
│  - Validate input    │
│  - Build prompt      │
└──────────┬───────────┘
           │
           │ API Call
           │
           ▼
┌──────────────────────┐
│  Google Gemini AI    │
│  - Process query     │
│  - Generate response │
│  - In Kannada        │
└──────────┬───────────┘
           │
           │ Response
           │
           ▼
┌──────────────────────┐
│  Express API (api.js)│
│  - Format response   │
│  - Return JSON       │
└──────────┬───────────┘
           │
           │ HTTP Response
           │
           ▼
┌──────────────────────┐
│  Expo App (App.js)   │
│  - Display response  │
│  - Show Kannada text │
│  - Alert user        │
└──────────────────────┘
           │
           ▼
    LEARNER SEES
    KANNADA ANSWER
```

---

## **Setup Timeline**

```
⏱️  MINUTE 1-2
    └─ Get Gemini API Key
       https://aistudio.google.com/app/apikey

⏱️  MINUTE 3-4
    └─ Install Dependencies
       npm install express cors dotenv...

⏱️  MINUTE 5
    └─ Create .env File
       GEMINI_API_KEY=...

⏱️  MINUTE 6-7
    └─ Start API Server
       Terminal 1: node api.js
       ✅ Server running on :3000

⏱️  MINUTE 8-9
    └─ Start Expo App
       Terminal 2: npx expo start
       ✅ Press 'w' for web

⏱️  MINUTE 10-11
    └─ Login to App
       Email: learner@example.com
       ✅ See Kannada Dashboard

⏱️  MINUTE 12-15
    └─ Test Features
       Click Ask FinSync
       ✅ Get Kannada Response

✅ DONE! FinSync is ready!
```

---

## **File Organization**

```
📦 TERRATHON (Project Root)
│
├─ 🔴 CRITICAL FILES (Must have)
│  ├─ App.js                    (React Native Frontend)
│  ├─ api.js                    (Express Backend)
│  ├─ .env                      (API Key - KEEP SECRET!)
│  └─ package.json              (Dependencies)
│
├─ 🟡 IMPORTANT FILES (Should have)
│  ├─ test-api.js               (API Tests)
│  ├─ firebase-data.json        (Database)
│  └─ .env.example              (Template)
│
├─ 🟢 DOCUMENTATION (Read these)
│  ├─ START_HERE.md             ⭐ Read First!
│  ├─ QUICK_START.md            (5-min guide)
│  ├─ SETUP_GUIDE.md            (Detailed)
│  ├─ COMMANDS_REFERENCE.md     (All commands)
│  ├─ README.md                 (Full docs)
│  ├─ FILES_SUMMARY.md          (File overview)
│  └─ VISUAL_GUIDE.md           (This file)
│
└─ 📁 node_modules/             (Auto-generated)
   └─ (All installed packages)
```

---

## **Terminal Setup**

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR SCREEN SETUP                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   TERMINAL 1     │  │   TERMINAL 2     │  │   TERMINAL 3     │
│                  │  │                  │  │                  │
│  $ node api.js   │  │ $ npx expo start │  │  $ node test-api │
│                  │  │                  │  │                  │
│  🚀 API Server   │  │  📱 Expo App     │  │  🧪 Tests        │
│  Port 3000       │  │  Press 'w'       │  │                  │
│  ✅ Running      │  │  ✅ Running      │  │  ✅ Results      │
│                  │  │                  │  │                  │
│  Keep running!   │  │  Keep running!   │  │  Run as needed   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                      │                      │
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                        ┌──────▼──────┐
                        │   Browser   │
                        │  localhost  │
                        │   :19000    │
                        └─────────────┘
```

---

## **Login Flow**

```
START
  │
  ▼
┌─────────────────────┐
│   Login Screen      │
│                     │
│ Email: ________     │
│ Password: ____      │
│                     │
│ [Login Button]      │
└────────┬────────────┘
         │
         ▼
    ┌─────────────────┐
    │ Check Email     │
    │ in Mock Users   │
    └────────┬────────┘
             │
      ┌──────┴──────┐
      │             │
   Valid         Invalid
      │             │
      ▼             ▼
   ┌──────┐    ┌──────────┐
   │ Set  │    │ Show     │
   │ User │    │ Error    │
   └──┬───┘    └──────────┘
      │
      ▼
┌──────────────────────┐
│ Detect Language      │
│ (expo-localization)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Get Push Token       │
│ (expo-notifications) │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Update Firebase      │
│ User Profile         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Show Dashboard       │
│ (Learner/Mentor)     │
└──────────────────────┘
```

---

## **Feature Comparison**

```
┌─────────────────────────────────────────────────────────────┐
│                    LEARNER vs MENTOR                        │
└─────────────────────────────────────────────────────────────┘

LEARNER DASHBOARD              MENTOR DASHBOARD
┌──────────────────┐          ┌──────────────────┐
│ 📚 Learner       │          │ 👨‍🏫 Mentor       │
│ Dashboard        │          │ Dashboard        │
│                  │          │                  │
│ 🎙️ Ask FinSync   │          │ 🚨 Flagged       │
│ (Voice Input)    │          │ Transactions     │
│                  │          │                  │
│ 💳 Pay Bill      │          │ ✅ Approve       │
│ (Mock UPI)       │          │ ❌ Reject        │
│                  │          │                  │
│ 🌐 Language: KN  │          │ 📊 Monitor       │
│ (Kannada)        │          │ Activity         │
│                  │          │                  │
│ 🔔 Notifications │          │ 🔔 Notifications │
│ (Fraud Alerts)   │          │ (New Txns)       │
└──────────────────┘          └──────────────────┘
```

---

## **API Endpoints**

```
┌─────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                            │
└─────────────────────────────────────────────────────────────┘

1️⃣  HEALTH CHECK
    GET /health
    ├─ No parameters
    └─ Returns: { status: "ok", service: "...", timestamp: "..." }

2️⃣  KANNADA EXPLANATION (Main)
    POST /api/explain-vernacular
    ├─ Input: { textQuery: "...", userLanguage: "kn" }
    └─ Returns: { analogy: "...", language: "Kannada" }

3️⃣  VOICE EXPLANATION (Legacy)
    POST /api/explain-voice
    ├─ Input: { audioBase64: "...", userLanguage: "kn" }
    └─ Returns: { explanation: "...", language: "Kannada" }
```

---

## **Language Support**

```
┌─────────────────────────────────────────────────────────────┐
│                  SUPPORTED LANGUAGES                        │
└─────────────────────────────────────────────────────────────┘

🇮🇳 KANNADA (kn)      ⭐ PRIMARY
   └─ ಹಳ್ಳಿಯ ಹಿರಿಯರು...

🇮🇳 HINDI (hi)        ✅ SUPPORTED
   └─ गाँव के बुजुर्ग...

🇮🇳 TELUGU (te)       ✅ SUPPORTED
   └─ గ్రామ ఎల్డర్‌...

🇮🇳 TAMIL (ta)        ✅ SUPPORTED
   └─ கிராம பெரியவர்...

🇮🇳 MARATHI (mr)      ✅ SUPPORTED
   └─ गावातील वृद्ध...

🇮🇳 BENGALI (bn)      ✅ SUPPORTED
   └─ গ্রামের বয়স্ক...

🇬🇧 ENGLISH (en)      ✅ SUPPORTED
   └─ Village elder...
```

---

## **Troubleshooting Flowchart**

```
SOMETHING NOT WORKING?
        │
        ▼
    ┌─────────────────┐
    │ Check Terminal  │
    │ for Errors      │
    └────────┬────────┘
             │
      ┌──────┴──────┐
      │             │
   Error         No Error
      │             │
      ▼             ▼
  ┌────────┐   ┌──────────┐
  │ Read   │   │ Check    │
  │ Error  │   │ Browser  │
  │ Msg    │   │ Console  │
  └────┬───┘   └────┬─────┘
       │            │
       ▼            ▼
  ┌──────────┐  ┌──────────┐
  │ Search   │  │ Check    │
  │ Error in │  │ Network  │
  │ Docs     │  │ Tab      │
  └────┬─────┘  └────┬─────┘
       │             │
       ▼             ▼
  ┌──────────┐  ┌──────────┐
  │ Found?   │  │ Working? │
  └────┬─────┘  └────┬─────┘
       │             │
    Yes│             │Yes
       ▼             ▼
    ✅ FIXED!    ✅ WORKING!
```

---

## **Success Indicators**

```
✅ API Server Started
   └─ See: "🚀 FinSync Vernacular AI API Server"
   └─ See: "✅ Gemini API key loaded successfully"

✅ Expo App Started
   └─ See: "› Press w │ open web"
   └─ Browser opens automatically

✅ Login Successful
   └─ See: "📚 Learner Dashboard" or "👨‍🏫 Mentor Dashboard"
   └─ See: "🌐 Language: KN"

✅ API Working
   └─ See: Kannada response in alert
   └─ See: No error messages

✅ Everything Ready!
   └─ All 3 terminals running
   └─ App displays correctly
   └─ Features working
```

---

**You're all set! Start with START_HERE.md 👆**

