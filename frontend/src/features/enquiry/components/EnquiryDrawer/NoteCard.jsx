import { FiBookmark, FiPaperclip, FiDownload } from 'react-icons/fi';
import Badge from '../../../../components/ui/Badge';
import IconButton from '../../../../components/ui/IconButton';
import { getDocumentUrl, formatFileSize } from '../../config/enquiryDocument.config';
import { sanitizeNoteHtml } from '../../utils/noteHtml.utils';
import { usePinNoteMutation, useUpdateNoteChecklistMutation } from '../../redux/enquiryApiSlice';
import toastService from '../../../../services/toast/toast.service';

function formatActor(user) {
  if (!user) return 'Team member';
  return `${user.firstName} ${user.lastName || ''}`.trim();
}

export default function NoteCard({ note, enquiryId, onUpdated }) {
  const [pinNote] = usePinNoteMutation();
  const [updateChecklist] = useUpdateNoteChecklistMutation();

  const checklist = Array.isArray(note.checklist) ? note.checklist : [];
  const mentions = Array.isArray(note.mentions) ? note.mentions : [];
  const attachments = note.attachments || [];
  const html = note.contentHtml ? sanitizeNoteHtml(note.contentHtml) : null;

  const togglePin = async () => {
    try {
      await pinNote({ id: enquiryId, noteId: note.id, isPinned: !note.isPinned }).unwrap();
      toastService.success(note.isPinned ? 'Note unpinned' : 'Note pinned');
      onUpdated?.();
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to update pin');
    }
  };

  const toggleCheckItem = async (itemId) => {
    const next = checklist.map((item) => (
      item.id === itemId ? { ...item, done: !item.done } : item
    ));
    try {
      await updateChecklist({ id: enquiryId, noteId: note.id, checklist: next }).unwrap();
      onUpdated?.();
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to update checklist');
    }
  };

  return (
    <article className={`crm-note-card ${note.isPinned ? 'crm-note-card--pinned' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {note.isPinned && (
            <Badge color="warning" className="text-[10px]">
              <FiBookmark className="w-3 h-3 mr-1" />
              Pinned
            </Badge>
          )}
          {mentions.map((m) => (
            <span key={m.userId} className="crm-mention-chip">@{m.label}</span>
          ))}
        </div>
        <IconButton
          icon={FiBookmark}
          label={note.isPinned ? 'Unpin' : 'Pin'}
          size="sm"
          onClick={togglePin}
          className={note.isPinned ? 'text-brand' : ''}
        />
      </div>

      {html ? (
        <div
          className="crm-note-card__body prose-note"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="text-sm text-text whitespace-pre-wrap">{note.content}</p>
      )}

      {checklist.length > 0 && (
        <ul className="crm-note-card__checklist">
          {checklist.map((item) => (
            <li key={item.id}>
              <label className="crm-note-card__check-label">
                <input
                  type="checkbox"
                  checked={Boolean(item.done)}
                  onChange={() => toggleCheckItem(item.id)}
                />
                <span className={item.done ? 'line-through text-text-muted' : ''}>{item.text}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {attachments.length > 0 && (
        <div className="crm-note-card__attachments">
          {attachments.map((file) => {
            const url = getDocumentUrl(file.filePath);
            return (
              <a
                key={file.id}
                href={url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="crm-note-card__attachment"
                onClick={(e) => { if (!url) e.preventDefault(); }}
              >
                <FiPaperclip className="w-3 h-3 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-text-muted">{formatFileSize(file.fileSize)}</span>
                <FiDownload className="w-3 h-3 shrink-0" />
              </a>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-text-muted mt-2">
        {formatActor(note.user)}
        {' · '}
        {new Date(note.createdAt).toLocaleString('en-IN')}
      </p>
    </article>
  );
}
