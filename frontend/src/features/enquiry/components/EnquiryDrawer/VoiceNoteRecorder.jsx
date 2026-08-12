import { useEffect, useRef, useState } from 'react';
import { FiMic, FiSquare, FiUpload, FiTrash2 } from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import toastService from '../../../../services/toast/toast.service';

export default function VoiceNoteRecorder({ disabled, onSave, saving }) {
  const [recording, setRecording] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [notes, setNotes] = useState('');
  const [supported, setSupported] = useState(true);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const reset = () => {
    clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl('');
    setAudioBlob(null);
    setDurationSec(0);
    setNotes('');
    chunksRef.current = [];
  };

  const startRecording = async () => {
    if (disabled) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
      toastService.info('Microphone not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setRecording(true);
      setDurationSec(0);
      timerRef.current = setInterval(() => setDurationSec((s) => s + 1), 1000);
    } catch {
      toastService.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    mediaRecorderRef.current.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      toastService.info('Please choose an audio file');
      return;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    setDurationSec(0);
    e.target.value = '';
  };

  const save = async () => {
    if (!audioBlob) {
      toastService.info('Record or upload a voice note first');
      return;
    }
    const file = audioBlob instanceof File
      ? audioBlob
      : new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: audioBlob.type || 'audio/webm' });

    await onSave?.({
      file,
      body: notes.trim() || undefined,
      durationSec: durationSec || undefined,
    });
    reset();
  };

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="crm-voice-note space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {!recording ? (
          <Button
            type="button"
            size="sm"
            icon={FiMic}
            onClick={startRecording}
            disabled={disabled || !supported}
          >
            Record
          </Button>
        ) : (
          <Button type="button" size="sm" variant="danger" icon={FiSquare} onClick={stopRecording}>
            Stop · {formatTime(durationSec)}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          icon={FiUpload}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || recording}
        >
          Upload audio
        </Button>
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFilePick} />
        {audioBlob && (
          <Button type="button" size="sm" variant="ghost" icon={FiTrash2} onClick={reset}>
            Clear
          </Button>
        )}
      </div>

      {audioUrl && (
        <audio controls src={audioUrl} className="w-full h-9">
          <track kind="captions" />
        </audio>
      )}

      <Textarea
        label="Voice note notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional context for this voice note..."
        rows={2}
        disabled={disabled}
      />

      {audioBlob && (
        <Button type="button" size="sm" onClick={save} loading={saving} disabled={disabled}>
          Save voice note
        </Button>
      )}
    </div>
  );
}
