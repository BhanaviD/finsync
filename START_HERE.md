# 🎯 START HERE - FinSync Setup

Welcome to **FinSync**! This guide will get you up and running in **15 minutes**.

---

## **📋 What You Need**

1. **Gemini API Key** - Get from: https://aistudio.google.com/app/apikey
2. **Node.js installed** - Check: `node --version`
3. **3 Terminal windows** - For API, Expo, and testing

---

## **⏱️ 15-Minute Setup**

### **Minute 1-2: Get Your API Key**

1. Go to: https://aistudio.google.com/app/apikey
2. Click **"Create API Key"**
3. Click **"Create API key in new project"**
4. **Copy the key** (looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### **Minute 3-4: Install Dependencies**

```bash
# Run this ONE command
npm install express cors dotenv @google/generative-ai axios firebase
npx expo install expo-av expo-notifications expo-localization expo-linking
npm install --save-dev nodemon
```

### **Minute 5: Add Your API Key**

```bash
# Create .env file with your key
echo "GEMINI_API_KEY=PASTE_YOUR_KEY_HERE" > .env
echo "PORT=3000" >> .env
```

Replace `PASTE_YOUR_KEY_HERE` with your actual key from Minute 1.

### **Minute 6-7: Start API Server (Terminal 1)**

```bash
node api.js
```

**You should see:**
```
🚀 FinSync Vernacular AI API Server
📡 Server running on: http://localhost:3000
✅ Gemini API key loaded successfully
```

**Keep this terminal running!**

### **Minute 8-9: Start Expo App (Terminal 2)**

```bash
npx expo start
```

**You should see:**
```
› Press a │ open Android
› Press w │ open web
› Press r │ reload app
```

Press **`w`** to open in web browser.

### **Minute 10-11: Test the App**

In the browser that opened:

1. **Email:** `learner@example.com`
2. **Password:** anything
3. Click **Login**

**You should see:**
- 📚 Learner Dashboard
- 🎙️ Ask FinSync button
- 💳 Pay Bill button
- 🌐 Language: KN (Kannada)

### **Minute 12-15: Test Kannada Features**

1. Click **🎙️ Ask FinSync**
2. Speak: "What is credit score?"
3. Click **Stop Recording**
4. Wait for response
5. **Get Kannada explanation!** 🎉

---

## **✅ Verification Checklist**

- [ ] API server running (Terminal 1)
- [ ] Expo app running (Terminal 2)
- [ ] Can see login screen
- [ ] Can login as learner
- [ ] Dashboard shows Kannada language
- [ ] Ask FinSync button works

---

## **🎯 Next Steps**

### **If Everything Works:**
- ✅ Congratulations! Your FinSync app is ready!
- 📖 Read `README.md` for full documentation
- 🔧 Read `SETUP_GUIDE.md` for detailed setup
- 📋 Read `COMMANDS_REFERENCE.md` for all commands

### **If Something Breaks:**

**API won't start?**
```bash
# Check if port 3000 is in use
lsof -i :3000
kill -9 <PID>
node api.js
```

**Gemini API error?**
```bash
# Get new key from: https://aistudio.google.com/app/apikey
# Update .env file
# Restart API server
```

**Expo won't load?**
```bash
npx expo start --clear
```

**Still stuck?**
- Check `SETUP_GUIDE.md` for troubleshooting
- Check terminal logs for error messages
- Make sure all 3 services are running

---

## **📁 Important Files**

| File | Purpose |
|------|---------|
| `App.js` | React Native frontend |
| `api.js` | Express API server |
| `.env` | Your API key (keep secret!) |
| `test-api.js` | Test the API |
| `README.md` | Full documentation |
| `SETUP_GUIDE.md` | Detailed setup instructions |
| `COMMANDS_REFERENCE.md` | All commands |

---

## **🔑 Test Credentials**

```
Learner:
  Email: learner@example.com
  Password: anything

Mentor:
  Email: mentor@example.com
  Password: anything
```

---

## **🌐 Key Features**

✅ **Kannada Explanations** - All responses in Kannada  
✅ **Voice Input** - Ask questions by speaking  
✅ **Fraud Detection** - Mentor reviews flagged transactions  
✅ **Real-time Database** - Firebase Realtime Database  
✅ **AI-Powered** - Google Gemini AI  

---

## **📞 Quick Commands**

```bash
# Terminal 1: Start API
node api.js

# Terminal 2: Start Expo
npx expo start
# Then press 'w' for web

# Terminal 3: Test API
curl http://localhost:3000/health

# Run all tests
node test-api.js
```

---

## **🎓 How It Works**

1. **Learner** asks a financial question by speaking
2. **Expo app** sends audio to Express API
3. **Express API** sends to Google Gemini AI
4. **Gemini** generates Kannada explanation with cultural analogy
5. **Learner** gets answer in Kannada! 🎉

---

## **🚀 You're Ready!**

Your FinSync app is now running with:
- ✅ Kannada language support
- ✅ Voice-based learning
- ✅ AI-powered explanations
- ✅ Fraud detection system
- ✅ Real-time database

**Enjoy learning! 📚**

---

## **📚 Documentation**

- **Quick Start:** `QUICK_START.md` (5 minutes)
- **Full Setup:** `SETUP_GUIDE.md` (detailed)
- **All Commands:** `COMMANDS_REFERENCE.md` (reference)
- **Full Docs:** `README.md` (complete)

---

**Questions? Check the documentation files above! 👆**

