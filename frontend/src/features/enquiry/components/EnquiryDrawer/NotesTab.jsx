import { useMemo } from 'react';
import FormSection from '../../../../components/ui/FormSection';
import RichNoteEditor from './RichNoteEditor';
import NoteCard from './NoteCard';
import { useAddNoteMutation } from '../../redux/enquiryApiSlice';
import toastService from '../../../../services/toast/toast.service';

export default function NotesTab({ enquiryId, notes = [], onRefresh }) {
  const [addNote, { isLoading }] = useAddNoteMutation();

  const sortedNotes = useMemo(() => (
    [...notes].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
  ), [notes]);

  const pinnedCount = notes.filter((n) => n.isPinned).length;

  const submit = async (payload) => {
    try {
      await addNote({
        id: enquiryId,
        content: payload.content,
        contentHtml: payload.contentHtml,
        mentions: payload.mentions,
        checklist: payload.checklist.filter((c) => c.text?.trim()),
        isPinned: payload.isPinned,
        attachments: payload.attachments,
      }).unwrap();
      toastService.success(payload.isPinned ? 'Pinned note added' : 'Note added');
      onRefresh?.();
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to add note');
    }
  };

  return (
    <div className="space-y-4">
      <FormSection
        title="Add Note"
        description="Rich text, mentions, checklists, emoji, attachments, and pin support."
      >
        <RichNoteEditor onSubmit={submit} loading={isLoading} disabled={!enquiryId} />
      </FormSection>

      <FormSection
        title="Notes"
        description={`${notes.length} note${notes.length === 1 ? '' : 's'}${pinnedCount ? ` · ${pinnedCount} pinned` : ''}`}
      >
        {sortedNotes.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">No notes yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                enquiryId={enquiryId}
                onUpdated={onRefresh}
              />
            ))}
          </div>
        )}
      </FormSection>
    </div>
  );
}
