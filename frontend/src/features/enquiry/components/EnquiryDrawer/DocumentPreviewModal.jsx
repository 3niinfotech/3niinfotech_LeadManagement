import { FiDownload, FiExternalLink } from 'react-icons/fi';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';
import {
  getDocumentUrl,
  getDocumentCategoryLabel,
  formatFileSize,
  isPreviewable,
} from '../../config/enquiryDocument.config';

export default function DocumentPreviewModal({ doc, open, onClose }) {
  if (!doc) return null;

  const url = getDocumentUrl(doc.filePath);
  const previewType = isPreviewable(doc.mimeType, doc.name || doc.fileName);

  const download = () => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.name || doc.fileName || 'document';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doc.name || doc.fileName}
      subtitle={`${getDocumentCategoryLabel(doc.category)} · ${formatFileSize(doc.fileSize)}`}
      size="xl"
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {url && (
            <>
              <Button variant="outline-primary" icon={FiExternalLink} onClick={() => window.open(url, '_blank', 'noopener')}>
                Open in tab
              </Button>
              <Button icon={FiDownload} onClick={download}>Download</Button>
            </>
          )}
        </>
      )}
    >
      <div className="crm-doc-preview">
        {!url && (
          <p className="text-sm text-text-muted text-center py-12">Preview unavailable for this file.</p>
        )}
        {url && previewType === 'image' && (
          <img src={url} alt={doc.name} className="crm-doc-preview__image" />
        )}
        {url && previewType === 'pdf' && (
          <iframe
            title={doc.name}
            src={url}
            className="crm-doc-preview__frame"
          />
        )}
        {url && !previewType && (
          <div className="crm-doc-preview__fallback">
            <p className="text-sm text-text-secondary">
              Preview is not supported for this file type ({doc.mimeType || 'unknown'}).
            </p>
            <Button className="mt-4" icon={FiDownload} onClick={download}>Download file</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
