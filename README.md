# 💰 FinSync - Financial Literacy & Fraud Detection App

**FinSync** is a hackathon project that combines financial education with fraud detection using AI-powered vernacular explanations in **Kannada**.

---

## **🎯 Features**

### **For Learners 📚**
- 🎙️ **Voice-Based Learning** - Ask financial questions by speaking
- 🌐 **Kannada Explanations** - Get answers in Kannada with cultural analogies
- 💳 **Mock UPI Payments** - Test payment flows safely
- 📊 **Real-time Fraud Alerts** - Get notified of suspicious transactions

### **For Mentors 👨‍🏫**
- 🚨 **Fraud Detection Dashboard** - Review flagged transactions
- ✅ **Approve/Reject Transactions** - Control transaction flow
- 📈 **Learner Monitoring** - Track learner activity

---

## **🏗️ Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                   React Native (Expo)                   │
│              FinSync Mobile App (Kannada)               │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐    ┌────────▼──────────┐
│  Firebase Auth   │    │  Firebase Realtime│
│  & Database      │    │  Database         │
└──────────────────┘    └───────────────────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Express API Server    │
        │   (Port 3000)           │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Google Gemini AI      │
        │   (Kannada Responses)   │
        └─────────────────────────┘
```

---

## **📦 Tech Stack**

### **Frontend**
- **React Native** with Expo
- **Firebase JS SDK** for real-time database
- **expo-av** for audio recording
- **expo-localization** for language detection
- **expo-notifications** for push notifications

### **Backend**
- **Node.js** with Express
- **Google Generative AI** (Gemini 2.0 Flash)
- **CORS** for cross-origin requests
- **dotenv** for environment variables

### **Database**
- **Firebase Realtime Database**
- **Firebase Authentication**

---

## **🚀 Quick Start**

### **1. Install Dependencies**

```bash
# API dependencies
npm install express cors dotenv @google/generative-ai axios

# Frontend dependencies
npx expo install expo-av expo-notifications expo-localization expo-linking
npm install firebase
```

### **2. Configure Environment**

```bash
# Get Gemini API key from: https://aistudio.google.com/app/apikey
echo "GEMINI_API_KEY=YOUR_KEY_HERE" > .env
echo "PORT=3000" >> .env
```

### **3. Start Services**

**Terminal 1: API Server**
```bash
node api.js
```

**Terminal 2: Expo App**
```bash
npx expo start
# Press 'w' for web browser
```

### **4. Login & Test**

- **Email:** `learner@example.com`
- **Password:** anything
- Click **Login**

---

## **📁 Project Structure**

```
TERRATHON/
├── App.js                      # React Native main app
├── api.js                      # Express API server
├── test-api.js                 # API test suite
├── firebase-data.json          # Initial database data
├── .env                        # Environment variables
├── .env.example                # Template
├── package.json                # Dependencies
├── SETUP_GUIDE.md              # Detailed setup
├── QUICK_START.md              # Quick reference
└── README.md                   # This file
```

---

## **🔌 API Endpoints**

### **Health Check**
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "FinSync Vernacular AI API",
  "timestamp": "2025-10-25T..."
}
```

### **Kannada Explanation**
```bash
POST /api/explain-vernacular
Content-Type: application/json

{
  "textQuery": "What is credit score?",
  "userLanguage": "kn"
}
```

**Response:**
```json
{
  "success": true,
  "analogy": "ಹಳ್ಳಿಯ ಹಿರಿಯರು ಇಟ್ಟುಕೊಂಡಿರುವ ಖ್ಯಾತಿ ದಾಖಲೆ...",
  "language": "Kannada",
  "languageCode": "kn"
}
```

### **Voice Explanation (Legacy)**
```bash
POST /api/explain-voice
Content-Type: application/json

{
  "audioBase64": "base64_encoded_audio",
  "userLanguage": "kn"
}
```

---

## **🔐 Test Credentials**

| Role | Email | Password |
|------|-------|----------|
| Learner | learner@example.com | any |
| Mentor | mentor@example.com | any |

---

## **🎓 How It Works**

### **Learner Flow**
1. Login with email
2. Click "Ask FinSync" button
3. Speak a financial question
4. Get Kannada explanation with cultural analogy
5. Learn financial concepts in your language

### **Mentor Flow**
1. Login with mentor credentials
2. View flagged transactions
3. Review transaction details
4. Approve or reject transactions
5. Monitor learner activity

### **Fraud Detection**
- Transactions > ₹1000 with "Crypto" vendor are flagged
- Mentor reviews and approves/rejects
- Learner gets real-time notifications

---

## **🌐 Language Support**

Currently optimized for **Kannada (kn)**, but supports:
- Hindi (hi)
- Telugu (te)
- Tamil (ta)
- Marathi (mr)
- Bengali (bn)
- English (en)

---

## **🔧 Configuration**

### **Firebase Config** (App.js, lines 22-31)
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "terrathon-finsync.firebaseapp.com",
  databaseURL: "https://terrathon-finsync-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "terrathon-finsync",
  storageBucket: "terrathon-finsync.firebasestorage.app",
  messagingSenderId: "181792930095",
  appId: "1:181792930095:web:8643def5a8eb92b49049da"
};
```

### **Gemini API Config** (.env)
```
GEMINI_API_KEY=your_actual_key_here
PORT=3000
NODE_ENV=development
```

---

## **📊 Database Schema**

### **Users**
```json
{
  "users": {
    "uid_learner_001": {
      "email": "learner@example.com",
      "role": "Learner",
      "preferredLanguage": "kn",
      "expoPushToken": "token_here"
    }
  }
}
```

### **Transactions**
```json
{
  "transactions": {
    "txn_001": {
      "learnerUID": "uid_learner_001",
      "amount": 1500,
      "vendor": "Crypto Exchange",
      "status": "Flagged-ReviewRequired",
      "timestamp": 1729900800000
    }
  }
}
```

---

## **🐛 Troubleshooting**

### **API Won't Start**
```bash
# Check if port 3000 is in use
lsof -i :3000
kill -9 <PID>
node api.js
```

### **Gemini API Error**
- Get new key: https://aistudio.google.com/app/apikey
- Update .env file
- Restart API server

### **Firebase Connection Error**
- Check Firebase config in App.js
- Verify database exists in Firebase Console
- Check internet connection

### **Expo App Won't Load**
```bash
npx expo start --clear
```

---

## **📝 License**

This project is created for the TERRATHON hackathon.

---

## **👥 Team**

Built with ❤️ for financial literacy in India

---

## **📞 Support**

For issues or questions:
1. Check SETUP_GUIDE.md for detailed instructions
2. Check QUICK_START.md for quick reference
3. Review API logs in terminal

---

**Happy Learning! 🚀**

