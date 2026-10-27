import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { t } from './translations';

// Full-screen, high-contrast QR scanner for elderly users: point the
// camera at a UPI QR code, or fall back to uploading a photo of one.
export default function QRScanner({ onDetected, onCancel, lang = 'en' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        scanLoop();
      } catch (err) {
        setError(t(lang, 'cameraError'));
      }
    }

    function scanLoop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(scanLoop);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        stopCamera();
        onDetected(code.data);
        return;
      }

      rafRef.current = requestAnimationFrame(scanLoop);
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          stopCamera();
          onDetected(code.data);
        } else {
          setError(t(lang, 'noQrFoundError'));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function handleCancel() {
    stopCamera();
    onCancel();
  }

  return (
    <div style={qrStyles.overlay}>
      <div style={qrStyles.card}>
        <div style={qrStyles.headerRow}>
          <h2 style={qrStyles.title}>{t(lang, 'scanTitle')}</h2>
          <button style={qrStyles.closeBtn} onClick={handleCancel} aria-label="Close">✕</button>
        </div>
        <p style={qrStyles.subtitle}>{t(lang, 'scanSubtitle')}</p>

        <div style={qrStyles.videoWrap}>
          <video ref={videoRef} style={qrStyles.video} playsInline muted />
          <div style={qrStyles.scanBox} />
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {error && <p style={qrStyles.error}>{error}</p>}

        <button style={qrStyles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
          {t(lang, 'uploadInstead')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <button style={qrStyles.cancelBtn} onClick={handleCancel}>
          {t(lang, 'cancelButton')}
        </button>
      </div>
    </div>
  );
}

const qrStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: '#1a1a2e',
    margin: 0,
  },
  closeBtn: {
    fontSize: 22,
    background: 'none',
    border: '2px solid #1a1a2e',
    borderRadius: '50%',
    width: 44,
    height: 44,
    cursor: 'pointer',
    lineHeight: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#444',
    marginTop: 8,
    marginBottom: 16,
  },
  videoWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '3 / 4',
    backgroundColor: '#111',
    borderRadius: 14,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  scanBox: {
    position: 'absolute',
    top: '18%',
    left: '12%',
    right: '12%',
    bottom: '18%',
    border: '4px solid #ffffffcc',
    borderRadius: 16,
  },
  error: {
    color: '#c0392b',
    fontSize: 16,
    fontWeight: 700,
    marginTop: 14,
    textAlign: 'center',
  },
  uploadBtn: {
    marginTop: 20,
    width: '100%',
    minHeight: 64,
    fontSize: 20,
    fontWeight: 700,
    color: '#0b5ed7',
    backgroundColor: '#eaf2ff',
    border: '2px solid #0b5ed7',
    borderRadius: 14,
    cursor: 'pointer',
  },
  cancelBtn: {
    marginTop: 12,
    width: '100%',
    minHeight: 64,
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    backgroundColor: '#6c757d',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
  },
};
