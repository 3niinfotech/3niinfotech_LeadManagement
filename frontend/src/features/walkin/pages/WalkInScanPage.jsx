import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiVideo, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import QrScanner from 'qr-scanner';
import qrScannerWorkerPath from 'qr-scanner/qr-scanner-worker.min.js?url';
import { useScanWalkInQrMutation } from '../redux/walkinApiSlice';
import Button from '../../../components/ui/Button';
import PageShell from '../../../components/layout/PageShell';
import toastService from '../../../services/toast/toast.service';

QrScanner.WORKER_PATH = qrScannerWorkerPath;

function parseQrPayload(text) {
  try {
    const data = JSON.parse(text);
    if (data?.type === 'LEAD' && data?.id) return data;
  } catch (err) {
    return null;
  }
  return null;
}

export default function WalkInScanPage() {
  const navigate = useNavigate();
  const [scanWalkInQr, { isLoading }] = useScanWalkInQrMutation();
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [captureText, setCaptureText] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      }
    };
  }, []);

  const processPayload = async (payload) => {
    setScanError('');
    try {
      const result = await scanWalkInQr(payload).unwrap();
      setScanResult(result);
      toastService.success('QR scan processed. Demo attendance updated.');
      return result;
    } catch (e) {
      setScanError(e?.data?.message || 'Failed to process QR payload.');
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    const payload = parseQrPayload(captureText?.trim());
    if (!payload) {
      setScanError('Invalid QR content. Paste the JSON from the QR code.');
      return;
    }
    await processPayload(payload);
  };

  const handleScanResult = async (text) => {
    if (!text) return;
    const payload = parseQrPayload(text);
    if (!payload) {
      setScanError('Scanned QR does not contain a valid LEAD payload.');
      return;
    }
    setCaptureText(text);
    await processPayload(payload);
  };

  const startCamera = async () => {
    if (!videoRef.current) return;
    setCameraError('');
    try {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      }
      const scanner = new QrScanner(videoRef.current, (result) => {
        if (result?.data) {
          handleScanResult(result.data);
          setCameraActive(false);
          scanner.stop();
        }
      }, { returnDetailedScanResult: true });
      scannerRef.current = scanner;
      await scanner.start();
      setCameraActive(true);
    } catch (err) {
      setCameraError(err?.message || 'Camera access failed');
      setCameraActive(false);
      scannerRef.current?.destroy();
      scannerRef.current = null;
    }
  };

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  return (
    <PageShell
      title="Walk-in QR Scan"
      subtitle="Use camera scanning or paste QR payload to mark demo attendance instantly."
      backAction={() => navigate(-1)}
      backLabel="Back to Walk-ins"
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="rounded-xl border border-border p-6 bg-surface">
          <div className="mb-4 text-sm text-text-secondary">
            You can scan the walk-in QR from a printed reference or paste the raw QR JSON if the camera is unavailable.
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" icon={FiVideo} onClick={cameraActive ? stopCamera : startCamera}>
                  {cameraActive ? 'Stop Camera' : 'Scan with Camera'}
                </Button>
                <Button type="button" variant="outline" icon={FiCamera} onClick={handleSubmit} loading={isLoading}>
                  Process Pasted QR
                </Button>
              </div>
              <div className="rounded-lg border border-border bg-black p-1">
                <video
                  ref={videoRef}
                  className="h-72 w-full rounded-lg bg-black object-cover"
                  muted
                  playsInline
                />
              </div>
              {cameraError && (
                <div className="text-sm text-danger-600">{cameraError}</div>
              )}
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-text-secondary">
                QR Payload JSON
              </label>
              <textarea
                ref={textareaRef}
                rows={14}
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                className="w-full min-h-[320px] rounded-lg border border-border bg-background p-3 text-sm text-text focus:border-brand focus:outline-none"
                placeholder='Paste QR content like {"type":"LEAD","leadCode":"MAIN-LEAD-2026-000001","id":"uuid"}'
              />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setCaptureText('')} icon={FiXCircle}>
                  Clear
                </Button>
              </div>
            </div>
          </div>
          {scanError && (
            <div className="mt-4 text-sm text-danger-600">{scanError}</div>
          )}
          {scanResult && (
            <div className="mt-4 rounded-lg border border-success-200 bg-success-50 p-4 text-sm text-success-900">
              <div className="flex items-center gap-2 font-semibold text-success-900 mb-2">
                <FiCheckCircle /> Scan processed successfully
              </div>
              <div className="space-y-1">
                <p><strong>Lead reference:</strong> {scanResult?.leadCode || '—'}</p>
                <p><strong>Attendance:</strong> {scanResult?.demo?.attendance || '—'}</p>
                <p><strong>Result:</strong> {scanResult?.demo?.result || '—'}</p>
                <p><strong>Enquiry:</strong> {scanResult?.enquiry?.enquiryCode || '—'}</p>
                <p><strong>Enquiry status:</strong> {scanResult?.enquiry?.status || '—'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
