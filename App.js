import React, { useState, useRef, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  ref,
  push,
  set,
  update,
  onValue,
  query,
  orderByChild,
  equalTo,
  get,
} from 'firebase/database';
import { auth, db } from './firebaseConfig';
import QRScanner from './QRScanner';
import { parseUpiQr, evaluateRisk } from './qrUtils';
import { LANGUAGES, t, tStatus, tConcept } from './translations';

const API_URL = 'http://localhost:3000';
const LANGUAGE_STORAGE_KEY = 'finsync_appLanguage';

const KNOWN_CONTACTS = ['Ravi Kumar', 'Priya Sharma', 'Amit Patel'];

// ---------------------------------------------------------------------------
// Shared UI pieces
// ---------------------------------------------------------------------------

const CustomAlert = ({ message, type, onClose }) => (
  <div style={sharedStyles.modalOverlay}>
    <div
      style={{
        ...sharedStyles.modalCard,
        borderLeft: `8px solid ${type === 'error' ? '#c0392b' : '#1e8449'}`,
      }}
    >
      <p style={sharedStyles.modalKicker}>
        {type === 'error' ? '🚨 High-Risk Action' : 'Notification'}
      </p>
      <p style={sharedStyles.modalMessage}>{message}</p>
      <button
        style={{
          ...sharedStyles.bigButton,
          backgroundColor: type === 'error' ? '#c0392b' : '#1e8449',
        }}
        onClick={onClose}
      >
        OK
      </button>
    </div>
  </div>
);

// Big, hard-to-miss banner used to close the loop back to the learner
// once their mentor has approved or rejected a payment.
const DecisionBanner = ({ txn, onDismiss, lang }) => {
  const approved = txn.status === 'Approved';
  return (
    <div style={sharedStyles.modalOverlay}>
      <div
        style={{
          ...sharedStyles.modalCard,
          borderLeft: `8px solid ${approved ? '#1e8449' : '#c0392b'}`,
        }}
      >
        <p style={sharedStyles.modalKicker}>
          {approved ? t(lang, 'approvedTitle') : t(lang, 'rejectedTitle')}
        </p>
        <p style={sharedStyles.modalMessage}>
          ₹{Number(txn.amount).toLocaleString('en-IN')} — {txn.vendor}
        </p>
        <button
          style={{
            ...sharedStyles.bigButton,
            backgroundColor: approved ? '#1e8449' : '#c0392b',
          }}
          onClick={onDismiss}
        >
          {t(lang, 'okButton')}
        </button>
      </div>
    </div>
  );
};

// Full-screen confirmation step shown before any money moves, whether the
// amount/vendor came from a QR scan or a quick-pay button.
const PaymentConfirm = ({ details, onConfirm, onCancel, submitting, lang }) => (
  <div style={sharedStyles.modalOverlay}>
    <div style={sharedStyles.modalCard}>
      <p style={sharedStyles.modalKicker}>{t(lang, 'confirmPaymentTitle')}</p>
      <div style={sharedStyles.confirmRow}>
        <span style={sharedStyles.confirmLabel}>{t(lang, 'toLabel')}</span>
        <span style={sharedStyles.confirmValue}>{details.vendor}</span>
      </div>
      <div style={sharedStyles.confirmRow}>
        <span style={sharedStyles.confirmLabel}>{t(lang, 'amountLabel')}</span>
        <span style={sharedStyles.confirmValueBig}>
          ₹{Number(details.amount || 0).toLocaleString('en-IN')}
        </span>
      </div>
      {details.note ? (
        <div style={sharedStyles.confirmRow}>
          <span style={sharedStyles.confirmLabel}>{t(lang, 'noteLabel')}</span>
          <span style={sharedStyles.confirmValue}>{details.note}</span>
        </div>
      ) : null}

      <button
        style={{ ...sharedStyles.bigButton, backgroundColor: '#1e8449', marginTop: 24 }}
        onClick={onConfirm}
        disabled={submitting}
      >
        {submitting ? t(lang, 'paying') : t(lang, 'payButton')}
      </button>
      <button
        style={{ ...sharedStyles.bigButton, backgroundColor: '#6c757d', marginTop: 12 }}
        onClick={onCancel}
        disabled={submitting}
      >
        {t(lang, 'cancelButton')}
      </button>
    </div>
  </div>
);

// First screen the app ever shows on a new device. Deliberately mixes all
// supported scripts in the one prompt line, since we don't know the
// reader's language yet — every screen after this is single-language only.
const LanguagePicker = ({ onPick }) => (
  <div style={sharedStyles.pickerContainer}>
    <h1 style={sharedStyles.pickerBrand}>⭐ FinSync</h1>
    <p style={sharedStyles.pickerPrompt}>{t('en', 'pickerPrompt')}</p>
    <div style={sharedStyles.pickerGrid}>
      {LANGUAGES.map((l) => (
        <button key={l.code} style={sharedStyles.pickerButton} onClick={() => onPick(l.code)}>
          {l.nativeName}
        </button>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export default function App() {
  const [appLanguage, setAppLanguage] = useState(null);
  const [languageLoaded, setLanguageLoaded] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved) setAppLanguage(saved);
    setLanguageLoaded(true);
  }, []);

  const handlePickLanguage = (code) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    setAppLanguage(code);
    if (user) {
      update(ref(db, `users/${user.uid}`), { preferredLanguage: code }).catch(() => {});
    }
  };

  const handleChangeLanguage = () => {
    window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    setAppLanguage(null);
  };

  // Resolve (or provision) the /users/{uid} profile that stores the role.
  const loadOrCreateProfile = async (fbUser, langAtLogin) => {
    const userRef = ref(db, `users/${fbUser.uid}`);
    const snap = await get(userRef);
    let profile = snap.val();
    if (!profile) {
      const roleGuess = fbUser.email.toLowerCase().includes('mentor') ? 'Mentor' : 'Learner';
      profile = { email: fbUser.email, role: roleGuess, preferredLanguage: langAtLogin };
      await set(userRef, profile);
    } else if (profile.preferredLanguage !== langAtLogin) {
      await update(userRef, { preferredLanguage: langAtLogin });
    }
    setUser({ uid: fbUser.uid, email: fbUser.email });
    setUserRole(profile.role);
  };

  useEffect(() => {
    if (!languageLoaded) return;
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          await loadOrCreateProfile(fbUser, appLanguage || 'en');
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        setUser(null);
        setUserRole(null);
        setAlert({ message: error.message || 'Could not load your account.', type: 'error' });
      } finally {
        setAuthChecked(true);
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageLoaded]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setAlert({ message: 'Please enter both email and password.', type: 'info' });
      return;
    }
    setLoading(true);
    try {
      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          } catch (createErr) {
            if (createErr.code === 'auth/email-already-in-use') {
              throw new Error('Incorrect password for this account.');
            }
            throw createErr;
          }
        } else {
          throw err;
        }
      }
      await loadOrCreateProfile(credential.user, appLanguage || 'en');
    } catch (error) {
      setAlert({ message: error.message || 'Login failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setEmail('');
    setPassword('');
  };

  const handleCloseAlert = () => setAlert(null);

  if (!languageLoaded || !authChecked) {
    return <div style={sharedStyles.splashScreen}>Loading FinSync…</div>;
  }

  if (!appLanguage) {
    return <LanguagePicker onPick={handlePickLanguage} />;
  }

  if (!user) {
    return (
      <>
        {alert && <CustomAlert message={alert.message} type={alert.type} onClose={handleCloseAlert} />}
        <div style={sharedStyles.loginContainer}>
          <h1 style={sharedStyles.loginTitle}>⭐ FinSync</h1>
          <p style={sharedStyles.loginSubtitle}>{t(appLanguage, 'loginSubtitle')}</p>
          <input
            style={sharedStyles.loginInput}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="username"
          />
          <input
            style={sharedStyles.loginInput}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button style={sharedStyles.bigButton} onClick={handleLogin} disabled={loading}>
            {loading ? t(appLanguage, 'loggingIn') : t(appLanguage, 'loginButton')}
          </button>
          <p style={sharedStyles.loginHint}>
            Demo: learner@example.com / mentor@example.com (any password — first login creates the account)
          </p>
          <button style={sharedStyles.changeLanguageLink} onClick={handleChangeLanguage}>
            {t(appLanguage, 'changeLanguage')}
          </button>
        </div>
      </>
    );
  }

  if (userRole === 'Learner') {
    return (
      <>
        {alert && (
          <CustomAlert message={alert.message} type={alert.type} onClose={handleCloseAlert} />
        )}
        <LearnerDashboard
          user={user}
          onLogout={handleLogout}
          setAlert={setAlert}
          lang={appLanguage}
          onChangeLanguage={handleChangeLanguage}
        />
      </>
    );
  }

  if (userRole === 'Mentor') {
    return (
      <>
        {alert && <CustomAlert message={alert.message} type={alert.type} onClose={handleCloseAlert} />}
        <MentorDashboard user={user} onLogout={handleLogout} setAlert={setAlert} />
      </>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Learner Dashboard (elderly-friendly, single language throughout)
// ---------------------------------------------------------------------------

function LearnerDashboard({ user, onLogout, setAlert, lang, onChangeLanguage }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [textQuery, setTextQuery] = useState('');
  const [analogyText, setAnalogyText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const [voiceTranscription, setVoiceTranscription] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [showScanner, setShowScanner] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null); // {vendor, amount, note}
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [myTransactions, setMyTransactions] = useState([]);
  const [decisionToShow, setDecisionToShow] = useState(null);
  const seenStatusesRef = useRef({});
  const firstSnapshotRef = useRef(true);

  // Holds { audioBase64, language } for whatever explanation is currently
  // shown, so the Replay button can replay it without a new network call.
  const [answerAudio, setAnswerAudio] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Real-time listener on this learner's own transactions, used to
  // populate the history list and to detect mentor approve/reject
  // decisions so we can surface an in-app notification banner.
  useEffect(() => {
    const txnsRef = ref(db, 'transactions');
    const txnsQuery = query(txnsRef, orderByChild('userUID'), equalTo(user.uid));

    const unsub = onValue(txnsQuery, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data)
        .map(([id, tx]) => ({ id, ...tx }))
        .sort((a, b) => b.timestamp - a.timestamp);

      if (!firstSnapshotRef.current) {
        for (const txn of list) {
          const prevStatus = seenStatusesRef.current[txn.id];
          if (prevStatus === 'Pending Review' && (txn.status === 'Approved' || txn.status === 'Rejected')) {
            setDecisionToShow(txn);
          }
        }
      }
      firstSnapshotRef.current = false;
      seenStatusesRef.current = Object.fromEntries(list.map((tx) => [tx.id, tx.status]));

      setMyTransactions(list);
    });

    return unsub;
  }, [user.uid]);

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const speakText = (text, language) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = {
      Kannada: 'kn-IN', Hindi: 'hi-IN', Telugu: 'te-IN', Tamil: 'ta-IN',
      Marathi: 'mr-IN', Bengali: 'bn-IN', English: 'en-IN',
      en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', te: 'te-IN', ta: 'ta-IN',
    };
    const targetLang = langMap[language] || 'hi-IN';
    utterance.lang = targetLang;
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    const voices = window.speechSynthesis.getVoices();
    const langCode = targetLang.split('-')[0];
    const matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(langCode));
    if (matchingVoice) utterance.voice = matchingVoice;

    window.speechSynthesis.speak(utterance);
  };

  // Plays the Cloud TTS audio the backend generated (works for every
  // supported language regardless of what voices are installed locally);
  // falls back to the browser's own speechSynthesis if Cloud TTS wasn't
  // available on the backend for this request.
  const playAnswer = (audioBase64, text, language) => {
    if (audioBase64) {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      audio.play().catch(() => setIsSpeaking(false));
    } else {
      speakText(text, language);
    }
  };

  const handleExplainText = async (queryOverride = null) => {
    const finalQuery = queryOverride || textQuery;
    if (!finalQuery.trim()) {
      setAlert({ message: t(lang, 'enterConceptAlert'), type: 'info' });
      return;
    }

    setIsProcessing(true);
    setAnalogyText(t(lang, 'explaining'));
    setIsVoiceMode(false);
    setVoiceTranscription('');
    setAnswerAudio(null);

    try {
      const response = await fetch(`${API_URL}/api/explain-vernacular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textQuery: finalQuery, userLanguage: lang }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate explanation');
      const analogy = data?.analogy;
      if (!analogy) throw new Error('No analogy text returned from API.');
      setAnalogyText(analogy);
      setAnswerAudio({ audioBase64: data.audioBase64 || null, language: lang });
      playAnswer(data.audioBase64, analogy, lang);
    } catch (error) {
      setAnalogyText('Error: ' + error.message);
      setAnswerAudio(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskFinSync = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          setIsProcessing(true);
          setVoiceTranscription(t(lang, 'transcribing'));
          setAnalogyText('');

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (audioBlob.size === 0) {
            setVoiceTranscription('Error: Recorded audio is empty. Please speak for longer.');
            setIsProcessing(false);
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          const base64Audio = await blobToBase64(audioBlob);

          try {
            const response = await fetch(`${API_URL}/api/explain-voice`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64Audio, userLanguage: lang }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to process audio');

            const { detectedLanguage: detLang, transcription, explanation, audioBase64: answerAudioBase64 } = data;
            setDetectedLanguage(detLang || 'Unknown');
            setVoiceTranscription(transcription || 'No transcription');
            setAnalogyText(explanation || 'No explanation generated');

            if (explanation) {
              setAnswerAudio({ audioBase64: answerAudioBase64 || null, language: lang });
              setTimeout(() => playAnswer(answerAudioBase64, explanation, lang), 400);
            } else {
              setAnswerAudio(null);
            }
          } catch (error) {
            setVoiceTranscription('Error processing voice');
            setAnalogyText('Error: ' + error.message);
            setAnswerAudio(null);
          } finally {
            setIsProcessing(false);
            stream.getTracks().forEach((track) => track.stop());
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setIsVoiceMode(true);
        setVoiceTranscription(t(lang, 'recordingNow'));
        setAnalogyText('');
      } catch (err) {
        setAlert({ message: t(lang, 'micError'), type: 'error' });
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // --- Payments -------------------------------------------------------

  const handleQrDetected = (rawText) => {
    setShowScanner(false);
    const parsed = parseUpiQr(rawText);
    setPendingPayment({
      vendor: parsed.vendor,
      amount: parsed.amount ?? 0,
      note: parsed.note,
      needsAmount: parsed.amount == null,
    });
  };

  const submitPayment = async () => {
    if (!pendingPayment) return;
    const amount = Number(pendingPayment.amount) || 0;
    if (amount <= 0) {
      setAlert({ message: t(lang, 'invalidAmountAlert'), type: 'info' });
      return;
    }

    setSubmittingPayment(true);
    try {
      const { flagged, riskScore, reason } = evaluateRisk({
        amount,
        vendor: pendingPayment.vendor,
        contacts: KNOWN_CONTACTS,
      });

      const txnRef = push(ref(db, 'transactions'));
      const record = {
        userUID: user.uid,
        amount,
        vendor: pendingPayment.vendor,
        description: pendingPayment.note || reason || 'Payment',
        status: flagged ? 'Pending Review' : 'Cleared',
        riskScore,
        reason: reason || null,
        timestamp: Date.now(),
      };
      await set(txnRef, record);

      setPendingPayment(null);
      setAlert(
        flagged
          ? {
              message: `${t(lang, 'pendingApprovalAlert')}\n₹${amount.toLocaleString('en-IN')} — ${record.vendor}`,
              type: 'info',
            }
          : {
              message: `${t(lang, 'paymentSuccessAlert')}: ₹${amount.toLocaleString('en-IN')} — ${record.vendor}`,
              type: 'info',
            }
      );
    } catch (error) {
      setAlert({ message: error.message || t(lang, 'paymentFailedAlert'), type: 'error' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const quickConcepts = [
    { key: 'sip', concept: 'Systematic Investment Plan' },
    { key: 'fd', concept: 'Fixed Deposit' },
    { key: 'inflation', concept: 'Inflation' },
    { key: 'tax', concept: 'Income Tax' },
  ];

  return (
    <div style={styles.learnerContainer}>
      {showScanner && (
        <QRScanner onDetected={handleQrDetected} onCancel={() => setShowScanner(false)} lang={lang} />
      )}
      {pendingPayment && (
        <PaymentConfirm
          details={pendingPayment}
          submitting={submittingPayment}
          onConfirm={submitPayment}
          onCancel={() => setPendingPayment(null)}
          lang={lang}
        />
      )}
      {decisionToShow && (
        <DecisionBanner txn={decisionToShow} onDismiss={() => setDecisionToShow(null)} lang={lang} />
      )}

      <div style={styles.header}>
        <h1 style={styles.dashboardTitle}>{t(lang, 'welcomeGreeting')}</h1>
        <div style={styles.headerControls}>
          <span style={styles.welcomeText}>{user.email}</span>
          <button style={styles.changeLanguageBtn} onClick={onChangeLanguage}>
            {t(lang, 'changeLanguage')}
          </button>
        </div>
      </div>

      {isSpeaking && <div style={styles.speakingBanner}>🔊</div>}

      {/* --- Pay: the primary elderly-friendly action --- */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{t(lang, 'payTitle')}</h3>
        <button style={styles.scanButton} onClick={() => setShowScanner(true)}>
          {t(lang, 'scanQrButton')}
        </button>
      </div>

      {/* --- Ask a question --- */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{t(lang, 'askQuestionTitle')}</h3>
        <button
          style={{ ...styles.voiceButton, ...(isRecording ? styles.voiceButtonRecording : {}) }}
          onClick={handleAskFinSync}
          disabled={isProcessing}
        >
          {isProcessing && isVoiceMode ? (
            <div style={styles.loader}></div>
          ) : (
            <>
              <span style={styles.voiceIcon}>🎤</span>
              <span style={styles.voiceText}>
                {isRecording ? t(lang, 'stopRecording') : t(lang, 'askByVoice')}
              </span>
            </>
          )}
        </button>

        {voiceTranscription && (
          <div style={styles.transcriptionBox}>
            <span style={styles.transcriptionLabel}>{t(lang, 'youSaidPrefix')}:</span>
            <p style={styles.transcriptionText}>{voiceTranscription}</p>
          </div>
        )}

        <div style={{ margin: '20px 0', textAlign: 'center', color: '#888', fontSize: 18 }}>
          {t(lang, 'orDivider')}
        </div>

        <input
          style={styles.input}
          placeholder={t(lang, 'conceptPlaceholder')}
          value={textQuery}
          onChange={(e) => setTextQuery(e.target.value)}
          disabled={isProcessing || isRecording}
        />
        <button
          style={styles.secondaryButton}
          onClick={() => handleExplainText()}
          disabled={isProcessing || isRecording || !textQuery.trim()}
        >
          {isProcessing && !isVoiceMode ? t(lang, 'explaining') : t(lang, 'explainButton')}
        </button>

        <div style={styles.quickButtonRow}>
          {quickConcepts.map((item) => (
            <button
              key={item.key}
              style={styles.quickButton}
              onClick={() => handleExplainText(item.concept)}
              disabled={isProcessing || isRecording}
            >
              {tConcept(lang, item.key)}
            </button>
          ))}
        </div>
      </div>

      {analogyText && (
        <div style={styles.analogyBox}>
          <p style={styles.analogyTitleText}>{t(lang, 'explanationTitle')}</p>
          <p style={{ ...styles.analogyContentText, whiteSpace: 'pre-wrap' }}>{analogyText}</p>
          {answerAudio && (
            <button
              style={styles.replayButton}
              onClick={() => playAnswer(answerAudio.audioBase64, analogyText, answerAudio.language)}
              disabled={isProcessing || isSpeaking}
            >
              {isSpeaking ? t(lang, 'replaying') : t(lang, 'replay')}
            </button>
          )}
        </div>
      )}

      {/* --- Recent transactions --- */}
      {myTransactions.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>{t(lang, 'recentPayments')}</h3>
          {myTransactions.slice(0, 5).map((tx) => (
            <div key={tx.id} style={styles.txnRow}>
              <div>
                <p style={styles.txnRowVendor}>{tx.vendor}</p>
                <p style={styles.txnRowAmount}>₹{Number(tx.amount).toLocaleString('en-IN')}</p>
              </div>
              <span
                style={{
                  ...styles.statusChip,
                  backgroundColor:
                    tx.status === 'Cleared' || tx.status === 'Approved'
                      ? '#d4edda'
                      : tx.status === 'Rejected'
                      ? '#f8d7da'
                      : '#fff3cd',
                  color:
                    tx.status === 'Cleared' || tx.status === 'Approved'
                      ? '#155724'
                      : tx.status === 'Rejected'
                      ? '#721c24'
                      : '#856404',
                }}
              >
                {tStatus(lang, tx.status)}
              </span>
            </div>
          ))}
        </div>
      )}

      <button style={styles.logoutButton} onClick={onLogout}>
        {t(lang, 'logout')}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mentor Dashboard (always English — different persona from the learner)
// ---------------------------------------------------------------------------

function MentorDashboard({ user, onLogout, setAlert }) {
  const [pendingTxns, setPendingTxns] = useState([]);

  useEffect(() => {
    const txnsRef = ref(db, 'transactions');
    const pendingQuery = query(txnsRef, orderByChild('status'), equalTo('Pending Review'));

    const unsub = onValue(pendingQuery, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data)
        .map(([id, tx]) => ({ id, ...tx }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setPendingTxns(list);
    });

    return unsub;
  }, []);

  const decide = async (txnId, decision) => {
    try {
      await update(ref(db, `transactions/${txnId}`), {
        status: decision,
        reviewedAt: Date.now(),
        reviewedBy: user.uid,
      });
      setAlert({
        message: `Transaction ${decision.toLowerCase()}.`,
        type: decision === 'Rejected' ? 'error' : 'info',
      });
    } catch (error) {
      setAlert({ message: error.message || 'Could not update transaction.', type: 'error' });
    }
  };

  return (
    <div style={styles.mentorContainer}>
      <h1 style={styles.title}>👨‍🏫 Mentor Dashboard</h1>
      <h2 style={styles.subtitle}>Welcome, {user.email}</h2>
      <hr style={{ margin: '20px 0' }} />
      <h3 style={styles.sectionTitle}>🚨 Pending Reviews ({pendingTxns.length})</h3>

      {pendingTxns.length === 0 ? (
        <p style={styles.noDataText}>No pending actions.</p>
      ) : (
        pendingTxns.map((item) => (
          <div key={item.id} style={styles.transactionCard}>
            <p style={styles.txnText}>
              🕐 <strong>{new Date(item.timestamp).toLocaleString('en-IN')}</strong>
            </p>
            <p style={styles.txnText}>
              💰 <strong>Amount:</strong> ₹{Number(item.amount).toLocaleString('en-IN')}
            </p>
            <p style={styles.txnText}>
              🏪 <strong>Vendor:</strong> {item.vendor}
            </p>
            <p style={styles.txnText}>
              📋 <strong>Reason:</strong> {item.reason || item.description}
            </p>
            <div style={styles.mentorButtonRow}>
              <button style={styles.approveBtn} onClick={() => decide(item.id, 'Approved')}>
                ✅ Approve
              </button>
              <button style={styles.rejectBtn} onClick={() => decide(item.id, 'Rejected')}>
                ❌ Reject
              </button>
            </div>
          </div>
        ))
      )}

      <button style={styles.logoutButton} onClick={onLogout}>
        🚪 Logout
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const sharedStyles = {
  splashScreen: {
    fontFamily: FONT_STACK,
    fontSize: 22,
    textAlign: 'center',
    marginTop: 100,
    color: '#1a1a2e',
  },
  pickerContainer: {
    fontFamily: FONT_STACK,
    backgroundColor: '#fefcf6',
    minHeight: '100vh',
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerBrand: {
    fontSize: 40,
    fontWeight: 800,
    color: '#1a1a2e',
    marginBottom: 8,
  },
  pickerPrompt: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    maxWidth: 480,
    marginBottom: 32,
    lineHeight: 1.8,
  },
  pickerGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: '100%',
    maxWidth: 360,
  },
  pickerButton: {
    fontSize: 28,
    fontWeight: 800,
    color: '#1a1a2e',
    backgroundColor: '#fff',
    border: '3px solid #0b5ed7',
    borderRadius: 16,
    padding: '22px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(11,94,215,0.15)',
  },
  loginContainer: {
    fontFamily: FONT_STACK,
    backgroundColor: '#fefcf6',
    padding: 32,
    paddingTop: 70,
    maxWidth: 460,
    margin: '40px auto',
    borderRadius: 16,
    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
  },
  loginTitle: {
    fontSize: 36,
    fontWeight: 800,
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 6,
  },
  loginSubtitle: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 28,
  },
  loginInput: {
    border: '2px solid #ccc',
    padding: '16px 18px',
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    fontSize: 20,
    width: '100%',
    boxSizing: 'border-box',
  },
  loginHint: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
  },
  changeLanguageLink: {
    display: 'block',
    margin: '18px auto 0',
    background: 'none',
    border: 'none',
    color: '#0b5ed7',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center',
    width: '100%',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1500,
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 18,
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
    maxWidth: 440,
    width: '100%',
    fontFamily: FONT_STACK,
  },
  modalKicker: {
    fontSize: 18,
    fontWeight: 700,
    color: '#444',
    margin: '0 0 12px 0',
  },
  modalMessage: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a2e',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
  },
  bigButton: {
    backgroundColor: '#0b5ed7',
    color: '#fff',
    fontSize: 22,
    fontWeight: 800,
    padding: '18px 20px',
    borderRadius: 14,
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    marginTop: 20,
  },
  confirmRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderBottom: '1px solid #eee',
    padding: '10px 0',
  },
  confirmLabel: {
    fontSize: 16,
    color: '#666',
  },
  confirmValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  confirmValueBig: {
    fontSize: 30,
    fontWeight: 800,
    color: '#1a1a2e',
  },
};

const styles = {
  learnerContainer: {
    fontFamily: FONT_STACK,
    backgroundColor: '#fefcf6',
    padding: '24px',
    maxWidth: 760,
    margin: '24px auto',
    borderRadius: 16,
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    border: '1px solid #eee',
  },
  mentorContainer: {
    fontFamily: FONT_STACK,
    backgroundColor: '#f8f9fa',
    padding: 30,
    maxWidth: 600,
    margin: '30px auto',
    borderRadius: 12,
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  header: { marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #eee' },
  dashboardTitle: { fontSize: 32, fontWeight: 800, color: '#1a1a2e', textAlign: 'center', marginBottom: 16 },
  headerControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  welcomeText: { fontSize: 16, color: '#555', fontWeight: 500 },
  changeLanguageBtn: {
    marginLeft: 'auto',
    padding: '10px 16px',
    borderRadius: 10,
    border: '2px solid #0b5ed7',
    backgroundColor: '#eaf2ff',
    color: '#0b5ed7',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  speakingBanner: {
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    textAlign: 'center',
    color: '#155724',
    fontWeight: 700,
    fontSize: 24,
  },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 },
  scanButton: {
    backgroundColor: '#0b5ed7',
    color: '#fff',
    fontSize: 24,
    fontWeight: 800,
    padding: '24px',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 14px rgba(11,94,215,0.35)',
  },
  input: {
    border: '2px solid #ccc',
    padding: '16px 18px',
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    fontSize: 18,
    width: '100%',
    boxSizing: 'border-box',
  },
  secondaryButton: {
    backgroundColor: '#17a2b8',
    color: '#fff',
    fontSize: 18,
    fontWeight: 700,
    padding: '16px 20px',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  quickButtonRow: { display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 14 },
  quickButton: {
    backgroundColor: '#e6f0ff',
    color: '#0b5ed7',
    fontSize: 16,
    fontWeight: 700,
    padding: '14px 12px',
    borderRadius: 12,
    border: '2px solid #b3d7ff',
    cursor: 'pointer',
    flex: '1 1 22%',
    minWidth: 100,
    minHeight: 56,
  },
  voiceButton: {
    backgroundColor: '#ff6b81',
    color: '#fff',
    fontSize: 20,
    fontWeight: 800,
    padding: '22px',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255,107,129,0.35)',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  voiceButtonRecording: { backgroundColor: '#e74c60' },
  voiceIcon: { fontSize: 26 },
  voiceText: { color: '#fff', fontSize: 20, fontWeight: 800 },
  loader: {
    border: '4px solid rgba(255,255,255,0.3)',
    borderTop: '4px solid #fff',
    borderRadius: '50%',
    width: 26,
    height: 26,
  },
  transcriptionBox: { backgroundColor: '#e8f4f8', border: '2px solid #17a2b8', padding: 16, borderRadius: 12, marginTop: 18 },
  transcriptionLabel: { fontSize: 14, fontWeight: 800, color: '#0c5460', textTransform: 'uppercase' },
  transcriptionText: { fontSize: 22, color: '#004085', margin: '8px 0 0 0', lineHeight: 1.5, fontWeight: 700 },
  analogyBox: {
    backgroundColor: '#fdf8e2',
    border: '1px solid #f0e6c0',
    padding: 22,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 28,
  },
  analogyTitleText: { fontSize: 15, fontWeight: 800, color: '#c09853', marginBottom: 10, textTransform: 'uppercase' },
  analogyContentText: { fontSize: 20, color: '#333', margin: 0, lineHeight: 1.6, fontFamily: 'Georgia, serif' },
  replayButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    padding: '12px 18px',
    marginTop: 16,
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 800,
    fontSize: 16,
  },
  txnRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    backgroundColor: '#fff',
    border: '1px solid #eee',
    borderRadius: 12,
    marginBottom: 10,
  },
  txnRowVendor: { fontSize: 17, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  txnRowAmount: { fontSize: 15, color: '#666', margin: '2px 0 0 0' },
  statusChip: { fontSize: 14, fontWeight: 800, padding: '6px 12px', borderRadius: 999 },
  mentorButtonRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginTop: 10 },
  rejectBtn: {
    backgroundColor: '#dc3545', color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 15px',
    borderRadius: 8, border: 'none', flex: 1, cursor: 'pointer',
  },
  approveBtn: {
    backgroundColor: '#28a745', color: '#fff', border: 'none', padding: 10, borderRadius: 8,
    flex: 1, cursor: 'pointer', fontWeight: 700, fontSize: 15,
  },
  logoutButton: {
    backgroundColor: '#6c757d', color: '#fff', fontSize: 18, fontWeight: 700, padding: '16px 20px',
    borderRadius: 12, border: 'none', marginTop: 20, cursor: 'pointer', width: '100%',
  },
  transactionCard: {
    backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15,
    borderLeft: '5px solid #dc3545', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  txnText: { fontSize: 15, color: '#333', marginBottom: 8, fontWeight: 500 },
  noDataText: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 30 },
};
