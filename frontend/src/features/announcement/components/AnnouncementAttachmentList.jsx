import { FiDownload, FiExternalLink, FiFile, FiFileText, FiImage } from 'react-icons/fi';
import {
  fileIconKind,
  formatFileSize,
  resolveUploadSrc,
} from '../utils/announcement.utils';
import '../styles/announcement-attachments.theme.css';

function KindIcon({ kind }) {
  if (kind === 'image') return <FiImage className="w-3.5 h-3.5" />;
  if (kind === 'pdf' || kind === 'doc') return <FiFileText className="w-3.5 h-3.5" />;
  return <FiFile className="w-3.5 h-3.5" />;
}

export default function AnnouncementAttachmentList({
  attachments = [],
  compact = false,
  showImages = true,
}) {
  const items = (attachments || []).filter((a) => a?.url);
  if (!items.length) return null;

  const images = showImages ? items.filter((a) => a.kind === 'image') : [];
  const files = items.filter((a) => a.kind !== 'image');

  return (
    <div className={`crm-ann-files ${compact ? 'crm-ann-files--compact' : ''}`}>
      {images.length > 0 && (
        <div className="crm-ann-files__gallery">
          {images.map((item, index) => {
            const src = resolveUploadSrc(item.url);
            return (
              <a
                key={`${item.url}-${index}`}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="crm-ann-files__image"
              >
                <img src={src} alt={item.name || 'Announcement image'} loading="lazy" />
              </a>
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <ul className="crm-ann-files__list">
          {files.map((item, index) => {
            const href = resolveUploadSrc(item.url);
            const kind = fileIconKind(item);
            return (
              <li key={`${item.url}-${index}`}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="crm-ann-files__link" download>
                  <span className="crm-ann-files__link-icon"><KindIcon kind={kind} /></span>
                  <span className="crm-ann-files__link-text">
                    <strong>{item.name || 'Download file'}</strong>
                    {item.size ? <small>{formatFileSize(item.size)}</small> : null}
                  </span>
                  <FiDownload className="w-3.5 h-3.5 crm-ann-files__download" />
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {!compact && images.length > 0 && (
        <p className="crm-ann-files__tip">
          <FiExternalLink className="w-3 h-3" />
          Tap an image to open full size
        </p>
      )}
    </div>
  );
}
