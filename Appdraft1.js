import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// =================================================================
// IMPORTANT: This is a React (WEB) component (.jsx)
// It replaces the React Native (MOBILE) file.
// It uses browser APIs (MediaRecorder) and HTML tags (div, button).
// =================================================================

// --- API Server URL ---
// This URL assumes you are running your api.js server locally
// and accessing the web app from the same machine.
const API_URL = 'http://localhost:3000';

// Mock Firebase config (replace with your actual web config if needed)
const firebaseConfig = {
  apiKey: 'AIzaSyC6e92iguyRak6RVOb9cz5WllNJX4oOMs8',
  authDomain: 'terrathon-finsync.firebaseapp.com',
  databaseURL:
    'https://terrathon-finsync-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'terrathon-finsync',
  storageBucket: 'terrathon-finsync.firebasestorage.app',
  messagingSenderId: '181792930095',
  appId: '1:181792930095:web:8643def5a8eb92b49049da',
};

// Main App Component
export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock Login
  const handleMockLogin = async () => {
    setLoading(true);
    // Mock authentication
    const mockUsers = {
      'learner@example.com': { uid: 'uid_learner_001', role: 'Learner' },
      'mentor@example.com': { uid: 'uid_mentor_001', role: 'Mentor' },
    };

    const mockUser = mockUsers[email];
    if (mockUser) {
      setUser({ uid: mockUser.uid, email });
      setUserRole(mockUser.role);
      // In a real web app, you would also get the language
      // const deviceLanguage = navigator.language.split('-')[0] || 'en';
    } else {
      alert('Error: Invalid credentials'); // Using browser alert for simplicity
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    setUserRole(null);
    setEmail('');
    setPassword('');
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>FinSync Web Login</h1>
        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
        <input
          style={styles.input}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />
        <button
          style={styles.button}
          onClick={handleMockLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p style={styles.hint}>
          Hint: learner@example.com or mentor@example.com
        </p>
      </div>
    );
  }

  // Render dashboards
  if (userRole === 'Learner') {
    return <LearnerDashboard user={user} onLogout={handleLogout} />;
  }

  if (userRole === 'Mentor') {
    return <MentorDashboard user={user} onLogout={handleLogout} />;
  }

  return null;
}

// Learner Dashboard (Web Version)
function LearnerDashboard({ user, onLogout }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('kn');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Voice recording and AI query function
  const handleAskFinSync = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream);

        // Clear previous chunks
        audioChunksRef.current = [];

        // Collect audio data
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        // Handle stop event
        mediaRecorderRef.current.onstop = async () => {
          setIsProcessing(true);
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm',
          });

          // Convert Blob to base64
          const base64Audio = await blobToBase64(audioBlob);

          try {
            console.log('Audio converted to base64, calling API...');
            
            // Send to the /api/explain-voice endpoint
            const apiResponse = await axios.post(
              `${API_URL}/api/explain-voice`,
              {
                audioBase64: base64Audio,
                userLanguage: preferredLanguage || 'kn',
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );

            // Use 'explanation' to match your api.js
            if (apiResponse.data && (apiResponse.data.explanation || apiResponse.data.analogy)) {
              alert(
                `FinSync Answer (${preferredLanguage.toUpperCase()}):\n\n` +
                  (apiResponse.data.explanation || apiResponse.data.analogy)
              );
            } else {
              alert('Error: No response from API');
            }
          } catch (error) {
            console.error('Error:', error);
            alert(
              'Error: Failed to get explanation: ' +
                (error.response?.data?.error ||
                  error.message ||
                  'Unknown error')
            );
          } finally {
            setIsProcessing(false);
            // Clean up stream tracks
            stream.getTracks().forEach(track => track.stop());
          }
        };

        // Start the recorder
        mediaRecorderRef.current.start();
        setIsRecording(true);
        alert('Recording... Speak your financial question now.');
      } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Error: Could not access microphone. Please grant permission.');
      }
    } else {
      // Stop recording
      setIsRecording(false);
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // Helper function to convert Blob to Base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        // Extract base64 part after comma
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const payBill = async () => {
    // This part remains the same as Linking.openURL works on web
    try {
      const amount = '1500';
      const vendor = 'Crypto Exchange';
      const upiUrl = `upi://pay?pa=merchant@upi&pn=${vendor}&am=${amount}&cu=INR`;

      // Log to Firebase (this part is untested without full Firebase web setup)
      console.log('Mock logging transaction to Firebase...');
      // const txnRef = push(ref(database, '/transactions'));
      // await set(txnRef, { ... });

      alert('Opening UPI app... (If installed)');
      window.open(upiUrl, '_blank');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📚 Learner Dashboard</h1>
      <h2 style={styles.subtitle}>Welcome, {user.email}</h2>
      <p style={styles.languageIndicator}>
        🌐 Language: {preferredLanguage.toUpperCase()}
      </p>

      <button
        style={{
          ...styles.voiceButton,
          ...(isRecording ? styles.voiceButtonRecording : {}),
        }}
        onClick={handleAskFinSync}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <div style={styles.loader}></div>
        ) : (
          <>
            <span style={styles.voiceIcon}>🎙️</span>
            <span style={styles.voiceText}>
              {isRecording ? 'Stop Recording' : 'Ask FinSync'}
            </span>
          </>
        )}
      </button>

      <button style={styles.payButton} onClick={payBill}>
        💳 Pay Bill (Mock UPI)
      </button>

      <button style={styles.logoutButton} onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

// Mentor Dashboard (Web Version)
function MentorDashboard({ user, onLogout }) {
  const [flaggedTransactions, setFlaggedTransactions] = useState([]);

  // Mock data for web version, as Firebase RTDB listener is not set up here
  useEffect(() => {
    setFlaggedTransactions([
      {
        id: 'txn1',
        amount: 1500,
        vendor: 'Crypto Exchange',
        description: 'UPI Payment',
        status: 'Flagged-ReviewRequired',
      },
      {
        id: 'txn2',
        amount: 2500,
        vendor: 'Crypto Exchange',
        description: 'Wallet Top-up',
        status: 'Flagged-ReviewRequired',
      },
    ]);
  }, []);

  const approveTransaction = async (txnId) => {
    alert(`Mock Approving transaction: ${txnId}`);
    setFlaggedTransactions(flaggedTransactions.filter(t => t.id !== txnId));
  };

  const rejectTransaction = async (txnId) => {
    alert(`Mock Rejecting transaction: ${txnId}`);
    setFlaggedTransactions(flaggedTransactions.filter(t => t.id !== txnId));
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👨‍🏫 Mentor Dashboard</h1>
      <h2 style={styles.subtitle}>Welcome, {user.email}</h2>

      <h3 style={styles.sectionTitle}>
        🚨 Flagged Transactions ({flaggedTransactions.length})
      </h3>

      {flaggedTransactions.length === 0 ? (
        <p style={styles.noDataText}>No flagged transactions</p>
      ) : (
        <div>
          {flaggedTransactions.map((item) => (
            <div key={item.id} style={styles.transactionCard}>
              <p style={styles.txnText}>💰 Amount: ₹{item.amount}</p>
              <p style={styles.txnText}>🏪 Vendor: {item.vendor}</p>
              <p style={styles.txnText}>📝 Description: {item.description}</p>
              <p style={styles.txnText}>⚠️ Status: {item.status}</p>

              <div style={styles.buttonRow}>
                <button
                  style={styles.approveBtn}
                  onClick={() => approveTransaction(item.id)}
                >
                  ✅ Approve
                </button>

                <button
                  style={styles.rejectBtn}
                  onClick={() => rejectTransaction(item.id)}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button style={styles.logoutButton} onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

// CSS-in-JS styles
const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    flex: 1,
    backgroundColor: '#f5f5ff',
    padding: 20,
    paddingTop: 60,
    maxWidth: 600,
    margin: '0 auto',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 400,
  },
  languageIndicator: {
    fontSize: 14,
    color: '#0066cc',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 600,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  input: {
    border: '1px solid #ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    width: 'calc(100% - 24px)', // Account for padding
  },
  button: {
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 15,
    borderRadius: 10,
    border: 'none',
    alignItems: 'center',
    marginBottom: 15,
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  voiceButton: {
    backgroundColor: '#ff6b6b',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 30,
    borderRadius: 20,
    border: 'none',
    // alignItems: 'center', // This was the duplicate
    marginBottom: 20,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  voiceButtonRecording: {
    backgroundColor: '#ff4444',
  },
  voiceIcon: {
    fontSize: 24, // Sized down for web button
    marginBottom: 0,
  },
  voiceText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  payButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 15,
    borderRadius: 10,
    border: 'none',
    alignItems: 'center',
    marginBottom: 15,
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  logoutButton: {
    backgroundColor: '#6c757d',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 15,
    borderRadius: 10,
    border: 'none',
    alignItems: 'center',
    marginTop: 20,
    cursor: 'pointer',
    width: '100%',
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeft: '5px solid #ff6b6b',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  txnText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  buttonRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  approveBtn: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  rejectBtn: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
  },
  loader: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #ff6b6b',
    borderRadius: '50%',
    width: 24,
    height: 24,
    animation: 'spin 1s linear infinite',
  },
  // Keyframes for loader (needs to be injected globally or use styled-components)
  // For simplicity, this is a basic CSS-in-JS object.
  // A real app would use a <style> tag or a CSS-in-JS library for @keyframes.
};

