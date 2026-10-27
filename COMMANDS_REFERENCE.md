# 📋 FinSync Complete Commands Reference

## **🔧 Installation Commands**

### **Install All Dependencies at Once**
```bash
npm install express cors dotenv @google/generative-ai axios firebase
npx expo install expo-av expo-notifications expo-localization expo-linking
npm install --save-dev nodemon
```

### **Install Individual Packages**

**API Server Packages:**
```bash
npm install express          # Web framework
npm install cors             # Cross-origin requests
npm install dotenv           # Environment variables
npm install @google/generative-ai  # Gemini AI SDK
npm install axios            # HTTP client
npm install --save-dev nodemon     # Auto-restart (dev)
```

**Frontend Packages:**
```bash
npm install firebase         # Firebase JS SDK
npx expo install expo-av     # Audio recording
npx expo install expo-notifications  # Push notifications
npx expo install expo-localization   # Language detection
npx expo install expo-linking        # Deep linking
```

---

## **🚀 Running Services**

### **Terminal 1: Start API Server**
```bash
# Production mode
node api.js

# Development mode (auto-restart on changes)
npm run api:dev
# or
nodemon api.js
```

### **Terminal 2: Start Expo App**
```bash
# Start Expo development server
npx expo start

# Then press one of:
# w - Open in web browser
# a - Open in Android emulator
# i - Open in iOS simulator
# r - Reload app
# q - Quit
```

### **Terminal 3: Run Tests**
```bash
# Run all API tests
node test-api.js

# Or test individual endpoints
curl http://localhost:3000/health
```

---

## **🧪 API Testing Commands**

### **Health Check**
```bash
curl http://localhost:3000/health
```

### **Test Kannada Explanation**
```bash
curl -X POST http://localhost:3000/api/explain-vernacular \
  -H "Content-Type: application/json" \
  -d "{\"textQuery\": \"What is credit score?\", \"userLanguage\": \"kn\"}"
```

### **Test Hindi Explanation**
```bash
curl -X POST http://localhost:3000/api/explain-vernacular \
  -H "Content-Type: application/json" \
  -d "{\"textQuery\": \"What is mutual fund?\", \"userLanguage\": \"hi\"}"
```

### **Test Telugu Explanation**
```bash
curl -X POST http://localhost:3000/api/explain-vernacular \
  -H "Content-Type: application/json" \
  -d "{\"textQuery\": \"What is compound interest?\", \"userLanguage\": \"te\"}"
```

### **Test Voice Endpoint (Legacy)**
```bash
curl -X POST http://localhost:3000/api/explain-voice \
  -H "Content-Type: application/json" \
  -d "{\"audioBase64\": \"base64_audio_data\", \"userLanguage\": \"kn\"}"
```

---

## **🔐 Firebase Commands**

### **Initialize Firebase (First Time)**
```bash
firebase login
firebase init
```

### **Deploy Firebase Functions**
```bash
firebase deploy --only functions
```

### **Deploy Database Rules**
```bash
firebase deploy --only database
```

### **View Firebase Logs**
```bash
firebase functions:log
```

### **Start Firebase Emulator**
```bash
firebase emulators:start
```

---

## **📝 Environment Setup**

### **Create .env File**
```bash
cat > .env << 'EOF'
GEMINI_API_KEY=your_actual_key_here
PORT=3000
NODE_ENV=development
EOF
```

### **Update .env with Your Key**
```bash
# Using echo
echo "GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX" > .env

# Or edit manually
code .env
```

### **Verify .env File**
```bash
cat .env
```

---

## **📦 Package Management**

### **Check Installed Packages**
```bash
npm list --depth=0
```

### **Update All Packages**
```bash
npm update
```

### **Clean Install**
```bash
rm -rf node_modules package-lock.json
npm install
```

### **Install with Legacy Peer Deps**
```bash
npm install --legacy-peer-deps
```

---

## **🗑️ Cleanup Commands**

### **Clear Expo Cache**
```bash
npx expo start --clear
```

### **Clear Node Modules**
```bash
rm -rf node_modules
npm install
```

### **Kill Process on Port 3000**
```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>
```

### **Clear All Caches**
```bash
npm cache clean --force
npx expo start --clear
```

---

## **📊 Database Commands**

### **Create Firebase Data File**
```bash
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

### **Import Data to Firebase**
```bash
# Via Firebase Console:
# 1. Go to Realtime Database
# 2. Click ⋮ (three dots)
# 3. Click "Import JSON"
# 4. Select firebase-data.json
# 5. Click Import
```

---

## **🔍 Debugging Commands**

### **Check Node Version**
```bash
node --version
```

### **Check npm Version**
```bash
npm --version
```

### **Check Expo Version**
```bash
npx expo --version
```

### **Check Firebase CLI Version**
```bash
firebase --version
```

### **View API Server Logs**
```bash
# Logs are printed to terminal where api.js is running
# Look for timestamps and error messages
```

### **View Expo Logs**
```bash
# Logs are printed to terminal where expo is running
# Press 'j' to open debugger
```

---

## **🎯 Quick Command Sequences**

### **Complete Fresh Start**
```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Update .env
echo "GEMINI_API_KEY=YOUR_KEY_HERE" > .env
echo "PORT=3000" >> .env

# 3. Start API (Terminal 1)
node api.js

# 4. Start Expo (Terminal 2)
npx expo start

# 5. Test (Terminal 3)
node test-api.js
```

### **Development Workflow**
```bash
# Terminal 1: API with auto-restart
nodemon api.js

# Terminal 2: Expo with hot reload
npx expo start

# Terminal 3: Run tests as needed
node test-api.js
```

### **Production Deployment**
```bash
# Build Expo app
npx expo build

# Deploy Firebase functions
firebase deploy --only functions

# Deploy database rules
firebase deploy --only database
```

---

## **📱 Mobile Testing**

### **Test on Physical Device**
```bash
# 1. Install Expo Go app on your phone
# 2. Run: npx expo start
# 3. Scan QR code with phone camera
# 4. App opens in Expo Go
```

### **Test on Android Emulator**
```bash
# 1. Start Android emulator
# 2. Run: npx expo start
# 3. Press 'a' in terminal
# 4. App opens in emulator
```

### **Test on iOS Simulator (Mac only)**
```bash
# 1. Run: npx expo start
# 2. Press 'i' in terminal
# 3. App opens in simulator
```

### **Test in Web Browser**
```bash
# 1. Run: npx expo start
# 2. Press 'w' in terminal
# 3. App opens in browser
```

---

## **🔗 Useful Links**

- **Gemini API Key:** https://aistudio.google.com/app/apikey
- **Firebase Console:** https://console.firebase.google.com/
- **Expo Documentation:** https://docs.expo.dev/
- **Firebase JS SDK:** https://firebase.google.com/docs/web/setup
- **Express Documentation:** https://expressjs.com/

---

## **💡 Pro Tips**

1. **Always keep 3 terminals open:**
   - Terminal 1: API server
   - Terminal 2: Expo app
   - Terminal 3: Testing/debugging

2. **Use nodemon for development:**
   ```bash
   npm install --save-dev nodemon
   nodemon api.js
   ```

3. **Check logs frequently:**
   - API logs in Terminal 1
   - Expo logs in Terminal 2
   - Test output in Terminal 3

4. **Clear cache if things break:**
   ```bash
   npx expo start --clear
   ```

5. **Use curl for quick API testing:**
   ```bash
   curl http://localhost:3000/health
   ```

---

**Happy Coding! 🚀**

