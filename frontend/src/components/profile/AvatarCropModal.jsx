import { useCallback, useEffect, useMemo, useState } from 'react';
import Cropper from 'react-easy-crop';
import {
  FiCheckCircle,
  FiImage,
  FiMinus,
  FiPlus,
  FiRefreshCw,
  FiUpload,
} from 'react-icons/fi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function createCroppedFile(src, crop) {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size,
  );
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  if (!blob) throw new Error('Could not prepare this image');
  return new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
}

export default function AvatarCropModal({
  file,
  open,
  uploading,
  onClose,
  onSave,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState('');
  const imageUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPixels(null);
    setPreparing(false);
    setError('');
  }, [open, file]);

  const complete = useCallback((_area, areaPixels) => setPixels(areaPixels), []);

  const save = async () => {
    if (!imageUrl || !pixels) return;
    setPreparing(true);
    setError('');
    try {
      const cropped = await createCroppedFile(imageUrl, pixels);
      await onSave(cropped);
    } catch (saveError) {
      setError(typeof saveError === 'string' ? saveError : saveError?.message || 'Could not save this photo');
    } finally {
      setPreparing(false);
    }
  };

  const busy = uploading || preparing;
  const changeZoom = (next) => setZoom(Math.min(3, Math.max(1, Number(next.toFixed(2)))));
  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setError('');
  };

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title="Adjust profile photo"
      subtitle="Position your face inside the circle for a clean profile photo."
      size="md"
      compact
      footer={(
        <div className="flex w-full items-center justify-between gap-3">
          <span className="hidden items-center gap-1.5 text-[11px] text-text-muted sm:flex">
            <FiCheckCircle className="text-success" />
            Securely saved at 512 × 512
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button icon={FiUpload} onClick={save} loading={busy} disabled={!pixels || busy}>
            Save photo
            </Button>
          </div>
        </div>
      )}
    >
      <div className="space-y-3 p-4">
        <div className="relative h-[min(50vh,360px)] min-h-[280px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
          {imageUrl ? (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid
              onCropChange={setCrop}
              onCropComplete={complete}
              onZoomChange={setZoom}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/60">
              <FiImage className="h-8 w-8" />
            </div>
          )}
          <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm">
            Drag to reposition
          </div>
        </div>

        <div className="rounded-xl border border-border bg-page/50 p-3">
          <div className="flex items-center gap-2.5">
            <span className="w-10 text-xs font-semibold text-text-secondary">Zoom</span>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => changeZoom(zoom - 0.1)}
              disabled={zoom <= 1}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card-bg text-text-secondary hover:border-border-strong hover:text-text disabled:opacity-40"
            >
              <FiMinus />
            </button>
            <input
              aria-label="Photo zoom"
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => changeZoom(Number(event.target.value))}
              className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[var(--brand)]"
            />
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => changeZoom(zoom + 0.1)}
              disabled={zoom >= 3}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card-bg text-text-secondary hover:border-border-strong hover:text-text disabled:opacity-40"
            >
              <FiPlus />
            </button>
            <span className="w-10 text-right text-xs font-semibold tabular-nums text-text-secondary">{zoom.toFixed(1)}×</span>
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5">
            <span className="min-w-0 truncate pr-3 text-[11px] text-text-muted">
              {file?.name || 'Selected image'} · {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : ''}
            </span>
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
            >
              <FiRefreshCw />
              Reset
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
