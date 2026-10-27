# 🚀 FinSync Complete Setup Guide

## **PHASE 1: Install All Dependencies**

### **Step 1: Install API Server Packages**

```bash
npm install express cors dotenv @google/generative-ai axios
npm install --save-dev nodemon
```

### **Step 2: Install Expo Frontend Packages**

```bash
npx expo install expo-av expo-notifications expo-localization expo-linking
npm install firebase
```

---

## **PHASE 2: Configure Environment Variables**

### **Step 3: Update .env File**

```bash
# Open .env file
code .env
```

**Replace with your actual Gemini API key:**
```
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
PORT=3000
NODE_ENV=development
```

Get your key from: https://aistudio.google.com/app/apikey

---

## **PHASE 3: Configure Firebase**

### **Step 4: Update App.js with Firebase Config**

Your Firebase config is already in App.js (lines 22-31). It's configured for:
- **Project:** terrathon-finsync
- **Database:** Asia Southeast 1

No changes needed! ✅

### **Step 5: Set Up Firebase Database**

1. Go to: https://console.firebase.google.com/
2. Select **terrathon-finsync** project
3. Click **Realtime Database**
4. If database doesn't exist:
   - Click **Create Database**
   - Choose location: **Asia Southeast 1**
   - Start in **test mode**
   - Click **Enable**

5. Import initial data:
```bash
# Create firebase-data.json
cat > firebase-data.json << 'EOF'
{
  "users": {
    "uid_learner_001": {
      "email": "learner@example.com",
      "role": "Learner",
      "preferredLanguage": "kn"
    },
    "uid_mentor_001": {
      "email": "mentor@example.com",
      "role": "Mentor",
      "preferredLanguage": "kn"
    }
  },
  "transactions": {}
}
EOF
```

6. In Firebase Console:
   - Click **⋮** (three dots) → **Import JSON**
   - Select `firebase-data.json`
   - Click **Import**

---

## **PHASE 4: Run the API Server**

### **Step 6: Start API Server (Terminal 1)**

```bash
# Make sure you're in the project root
cd /c/Users/Bhanavi\ D/sem\ 4/SEM\ 5/TERRATHON

# Start the API server
node api.js
```

**Expected output:**
```
==================================================
🚀 FinSync Vernacular AI API Server
==================================================
📡 Server running on: http://localhost:3000
✅ Gemini API key loaded successfully
==================================================
```

**Keep this terminal running!**

---

## **PHASE 5: Test the API**

### **Step 7: Test API (Terminal 2)**

```bash
# Open a NEW terminal

# Test health endpoint
curl http://localhost:3000/health
```

**Expected output:**
```json
{"status":"ok","service":"FinSync Vernacular AI API"}
```

### **Step 8: Test Kannada Explanation**

```bash
# Test Kannada explanation
curl -X POST http://localhost:3000/api/explain-vernacular \
  -H "Content-Type: application/json" \
  -d "{\"textQuery\": \"What is credit score?\", \"userLanguage\": \"kn\"}"
```

**Expected output:** Kannada explanation of credit score

### **Step 9: Run Automated Tests**

```bash
# Run all tests
node test-api.js
```

**Expected output:**
```
🧪 Testing FinSync API...
1️⃣ Testing health endpoint...
✅ Health check passed
2️⃣ Testing Kannada explanation...
✅ Kannada response: [Kannada text]
🎉 All tests passed!
```

---

## **PHASE 6: Run the React Native App**

### **Step 10: Start Expo (Terminal 3)**

```bash
# Open a NEW terminal

# Start Expo development server
npx expo start
```

**Expected output:**
```
› Press a │ open Android
› Press w │ open web
› Press r │ reload app
```

---

## **PHASE 7: Test the Complete App**

### **Step 11: Open the App**

**Option A: Web Browser (Easiest)**
```bash
# In the Expo terminal, press: w
```

**Option B: On Your Phone**
1. Install **Expo Go** app
2. Scan the QR code
3. App opens in Expo Go

**Option C: Android Emulator**
```bash
# In the Expo terminal, press: a
```

---

## **PHASE 8: Test Login & Features**

### **Step 12: Test Learner Login**

1. **Email:** `learner@example.com`
2. **Password:** (any password, it's mock auth)
3. Click **Login**

**You should see:**
- 📚 Learner Dashboard
- 🎙️ Ask FinSync button
- 💳 Pay Bill button
- 🌐 Language: KN (Kannada)

### **Step 13: Test Mentor Login**

1. Click **Logout**
2. **Email:** `mentor@example.com`
3. Click **Login**

**You should see:**
- 👨‍🏫 Mentor Dashboard
- 🚨 Flagged Transactions list

---

## **PHASE 9: Test Kannada Features**

### **Step 14: Test Ask FinSync (Learner)**

1. Login as learner
2. Click **🎙️ Ask FinSync**
3. Speak a financial question (e.g., "What is mutual fund?")
4. Click **Stop Recording**
5. Wait for Gemini to process
6. **Get Kannada explanation!** 🎉

### **Step 15: Test Pay Bill**

1. Click **💳 Pay Bill**
2. UPI app opens (or shows error if not installed)
3. Transaction logged to Firebase

---

## **📁 File Structure**

```
TERRATHON/
├── App.js                    # React Native frontend (Kannada)
├── api.js                    # Express API server
├── test-api.js               # API tests
├── .env                      # Environment variables
├── .env.example              # Template
├── firebase-data.json        # Initial database data
├── SETUP_GUIDE.md            # This file
├── package.json              # Dependencies
└── node_modules/             # Installed packages
```

---

## **🔧 Troubleshooting**

### **API Server Won't Start**

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill the process
kill -9 <PID>

# Try again
node api.js
```

### **Gemini API Key Error**

```bash
# Check if .env file exists
cat .env

# Make sure GEMINI_API_KEY is set correctly
# Get new key from: https://aistudio.google.com/app/apikey
```

### **Firebase Connection Error**

```bash
# Check Firebase config in App.js (lines 22-31)
# Make sure database URL is correct
# Check Firebase Console for database status
```

### **Expo App Won't Load**

```bash
# Clear Expo cache
npx expo start --clear

# Or restart Expo
# Press Ctrl+C in Expo terminal
# Run: npx expo start
```

---

## **✅ Verification Checklist**

- [ ] API server running on port 3000
- [ ] Health endpoint responds
- [ ] Kannada explanation works
- [ ] Expo app starts
- [ ] Can login as learner
- [ ] Can login as mentor
- [ ] Language shows as KN (Kannada)
- [ ] Ask FinSync button works
- [ ] Kannada responses received

---

## **🎯 Quick Commands Reference**

```bash
# Terminal 1: API Server
node api.js

# Terminal 2: Test API
node test-api.js

# Terminal 3: Expo App
npx expo start

# Test Kannada endpoint
curl -X POST http://localhost:3000/api/explain-vernacular \
  -H "Content-Type: application/json" \
  -d "{\"textQuery\": \"What is credit score?\", \"userLanguage\": \"kn\"}"
```

---

**You're all set! 🚀 Enjoy FinSync!**

