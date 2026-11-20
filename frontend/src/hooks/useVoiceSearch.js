import { useState, useCallback, useRef, useEffect } from 'react';
import toastService from '../services/toast/toast.service';

function formatVoiceError(errCode) {
  switch (errCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission denied. Please click the camera/mic lock icon in your browser address bar and allow microphone access.';
    case 'audio-capture':
      return 'No microphone detected. Please plug in or enable a microphone and try again.';
    case 'no-speech':
      return 'No speech detected. Please speak closer to the microphone and try again.';
    case 'network':
      return 'Network error occurred during voice recognition. Please check your internet connection.';
    case 'language-not-supported':
      return 'Selected voice language is not supported on this browser/device.';
    default:
      return errCode ? `Voice search error: ${errCode}` : 'Unable to complete voice search. Please try again.';
  }
}

export function useVoiceSearch(onTranscript, options = {}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const supported = typeof window !== 'undefined'
    && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  }, []);

  const start = useCallback(() => {
    setError(null);

    if (!supported) {
      const msg = 'Voice search is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Apple Safari.';
      setError(msg);
      options.onError?.(msg);
      toastService.error(msg, { id: 'voice-search-error' });
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = options.lang || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        const text = event.results?.[0]?.[0]?.transcript;
        if (text) {
          onTranscript?.(text.trim());
          setError(null);
        }
      };

      recognition.onerror = (event) => {
        setListening(false);
        if (event.error === 'aborted') {
          return;
        }
        const friendly = formatVoiceError(event.error);
        setError(friendly);
        options.onError?.(friendly, event.error);
        if (event.error === 'no-speech') {
          toastService.warning(friendly, { id: 'voice-search-warning' });
        } else {
          toastService.error(friendly, { id: 'voice-search-error' });
        }
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition failed to start:', err);
      setListening(false);
      const msg = err?.name === 'NotAllowedError'
        ? 'Microphone permission denied. Please allow microphone access in your browser site settings.'
        : 'Unable to start microphone. Please check your browser audio permissions.';
      setError(msg);
      options.onError?.(msg, err);
      toastService.error(msg, { id: 'voice-search-error' });
    }
  }, [supported, onTranscript, options]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  return { listening, supported, error, clearError, start, stop, toggle };
}
