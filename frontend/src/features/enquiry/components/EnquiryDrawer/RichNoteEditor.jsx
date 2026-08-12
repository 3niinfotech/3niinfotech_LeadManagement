import { useRef, useState, useEffect, useCallback } from 'react';
import {
  FiBold, FiItalic, FiUnderline, FiList, FiCheckSquare, FiSmile, FiAtSign,
  FiPaperclip, FiBookmark, FiSend, FiPlus, FiX,
} from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import IconButton from '../../../../components/ui/IconButton';
import { NOTE_EMOJIS } from '../../config/enquiryNote.config';
import { useCounsellorOptions } from '../../hooks/useCounsellorOptions';
import { execFormat, sanitizeNoteHtml, stripHtml } from '../../utils/noteHtml.utils';

function newChecklistId() {
  return `chk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function RichNoteEditor({ onSubmit, loading, disabled }) {
  const editorRef = useRef(null);
  const fileRef = useRef(null);
  const { users } = useCounsellorOptions();

  const [isPinned, setIsPinned] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [checklistDraft, setChecklistDraft] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  const mentionCandidates = users.filter((u) => {
    const label = `${u.firstName} ${u.lastName || ''}`.trim().toLowerCase();
    return label.includes(mentionQuery.toLowerCase());
  }).slice(0, 6);

  const reset = () => {
    if (editorRef.current) editorRef.current.innerHTML = '';
    setIsPinned(false);
    setChecklist([]);
    setChecklistDraft('');
    setAttachments([]);
    setMentions([]);
    setEmojiOpen(false);
    setMentionOpen(false);
  };

  const insertEmoji = (emoji) => {
    editorRef.current?.focus();
    execFormat('insertText', emoji);
    setEmojiOpen(false);
  };

  const insertMention = useCallback((user) => {
    const label = `${user.firstName} ${user.lastName || ''}`.trim();
    const span = `<span class="crm-mention" data-mention-id="${user.id}">@${label}</span>&nbsp;`;
    editorRef.current?.focus();
    execFormat('insertHTML', span);
    setMentions((prev) => {
      if (prev.some((m) => m.userId === user.id)) return prev;
      return [...prev, { userId: user.id, label }];
    });
    setMentionOpen(false);
    setMentionQuery('');
  }, []);

  const handleEditorInput = () => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return;
    const text = sel.anchorNode.textContent?.slice(0, sel.anchorOffset) || '';
    const at = text.lastIndexOf('@');
    if (at >= 0 && (at === 0 || /\s/.test(text[at - 1]))) {
      const query = text.slice(at + 1);
      if (!query.includes(' ')) {
        setMentionQuery(query);
        setMentionOpen(true);
        setMentionIndex(0);
        return;
      }
    }
    setMentionOpen(false);
  };

  const addChecklistItem = () => {
    const text = checklistDraft.trim();
    if (!text) return;
    setChecklist((prev) => [...prev, { id: newChecklistId(), text, done: false }]);
    setChecklistDraft('');
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    const html = sanitizeNoteHtml(editorRef.current?.innerHTML || '');
    const plain = stripHtml(html);
    const hasChecklist = checklist.length > 0;
    if (!plain && !hasChecklist && attachments.length === 0) return;

    await onSubmit?.({
      content: plain || checklist.map((c) => c.text).join('; '),
      contentHtml: html || null,
      mentions,
      checklist,
      isPinned,
      attachments,
    });
    reset();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (!mentionOpen || !mentionCandidates.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionCandidates.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionCandidates.length) % mentionCandidates.length);
      }
      if (e.key === 'Enter' && mentionCandidates[mentionIndex]) {
        e.preventDefault();
        insertMention(mentionCandidates[mentionIndex]);
      }
      if (e.key === 'Escape') setMentionOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mentionOpen, mentionCandidates, mentionIndex, insertMention]);

  return (
    <div className="crm-rich-note">
      <div className="crm-rich-note__toolbar" role="toolbar" aria-label="Note formatting">
        <IconButton icon={FiBold} label="Bold" size="sm" onClick={() => { editorRef.current?.focus(); execFormat('bold'); }} disabled={disabled} />
        <IconButton icon={FiItalic} label="Italic" size="sm" onClick={() => { editorRef.current?.focus(); execFormat('italic'); }} disabled={disabled} />
        <IconButton icon={FiUnderline} label="Underline" size="sm" onClick={() => { editorRef.current?.focus(); execFormat('underline'); }} disabled={disabled} />
        <IconButton icon={FiList} label="Bullet list" size="sm" onClick={() => { editorRef.current?.focus(); execFormat('insertUnorderedList'); }} disabled={disabled} />
        <IconButton icon={FiCheckSquare} label="Checklist" size="sm" onClick={() => setChecklist((p) => [...p, { id: newChecklistId(), text: '', done: false }])} disabled={disabled} />
        <div className="relative">
          <IconButton icon={FiSmile} label="Emoji" size="sm" onClick={() => setEmojiOpen((v) => !v)} disabled={disabled} />
          {emojiOpen && (
            <div className="crm-rich-note__emoji-panel">
              {NOTE_EMOJIS.map((emoji) => (
                <button key={emoji} type="button" className="crm-rich-note__emoji" onClick={() => insertEmoji(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <IconButton icon={FiAtSign} label="Mention user" size="sm" onClick={() => { editorRef.current?.focus(); execFormat('insertText', '@'); setMentionQuery(''); setMentionOpen(true); setMentionIndex(0); }} disabled={disabled} />
        <IconButton icon={FiPaperclip} label="Attach file" size="sm" onClick={() => fileRef.current?.click()} disabled={disabled} />
        <IconButton
          icon={FiBookmark}
          label={isPinned ? 'Unpin note' : 'Pin note'}
          size="sm"
          onClick={() => setIsPinned((v) => !v)}
          disabled={disabled}
          className={isPinned ? 'text-brand' : ''}
        />
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => {
            const files = [...(e.target.files || [])];
            setAttachments((prev) => [...prev, ...files].slice(0, 5));
            e.target.value = '';
          }}
        />
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          className="crm-rich-note__editor"
          contentEditable={!disabled}
          role="textbox"
          aria-multiline="true"
          data-placeholder="Write a note… Use @ to mention, toolbar for formatting"
          onInput={handleEditorInput}
          suppressContentEditableWarning
        />
        {mentionOpen && (
          <div className="crm-rich-note__mentions">
            {mentionCandidates.length === 0 ? (
              <p className="px-3 py-2 text-[12px] text-text-muted">No users found</p>
            ) : mentionCandidates.map((user, idx) => (
              <button
                key={user.id}
                type="button"
                className={`crm-rich-note__mention-option ${idx === mentionIndex ? 'crm-rich-note__mention-option--active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); insertMention(user); }}
              >
                {`${user.firstName} ${user.lastName || ''}`.trim()}
              </button>
            ))}
          </div>
        )}
      </div>

      {checklist.length > 0 && (
        <div className="crm-rich-note__checklist">
          {checklist.map((item, idx) => (
            <div key={item.id} className="crm-rich-note__check-item">
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => setChecklist((prev) => prev.map((c, i) => (
                  i === idx ? { ...c, done: e.target.checked } : c
                )))}
                disabled={disabled}
              />
              <Input
                value={item.text}
                onChange={(e) => setChecklist((prev) => prev.map((c, i) => (
                  i === idx ? { ...c, text: e.target.value } : c
                )))}
                placeholder="Checklist item"
                disabled={disabled}
              />
              <IconButton
                icon={FiX}
                label="Remove item"
                size="sm"
                onClick={() => setChecklist((prev) => prev.filter((_, i) => i !== idx))}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={checklistDraft}
          onChange={(e) => setChecklistDraft(e.target.value)}
          placeholder="Add checklist item..."
          disabled={disabled}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
        />
        <Button type="button" size="sm" variant="outline" icon={FiPlus} onClick={addChecklistItem} disabled={disabled}>
          Add
        </Button>
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, idx) => (
            <span key={`${file.name}-${idx}`} className="crm-rich-note__attachment">
              <FiPaperclip className="w-3 h-3" />
              {file.name}
              <button type="button" onClick={() => removeAttachment(idx)} aria-label="Remove attachment">
                <FiX className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-end items-center gap-2">
        {isPinned && <span className="text-[11px] text-brand font-medium">Will be pinned</span>}
        <Button
          size="sm"
          icon={FiSend}
          onClick={submit}
          loading={loading}
          disabled={disabled}
        >
          Add Note
        </Button>
      </div>
    </div>
  );
}
