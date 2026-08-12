import { useState } from 'react';
import Textarea from '../../../../components/ui/Textarea';
import Button from '../../../../components/ui/Button';
import { useAddWalkInNoteMutation } from '../../redux/walkinApiSlice';
import toastService from '../../../../services/toast/toast.service';

export default function NotesTab({ leadId, notes = [], onRefresh }) {
  const [content, setContent] = useState('');
  const [addNote, { isLoading }] = useAddWalkInNoteMutation();

  const handleAdd = async () => {
    if (!content.trim()) return;
    try {
      await addNote({ id: leadId, content: content.trim() }).unwrap();
      setContent('');
      toastService.success('Note added');
      onRefresh?.();
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to add note');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          label="Add Note"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Counselling notes..."
        />
        <Button size="sm" onClick={handleAdd} loading={isLoading} disabled={!content.trim()}>
          Save Note
        </Button>
      </div>

      <div className="space-y-2">
        {notes.length === 0 && (
          <p className="text-sm text-text-secondary">No notes yet.</p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="crm-walkin-note-card">
            <p className="text-sm text-text">{note.content}</p>
            <p className="text-xs text-text-muted mt-1">
              {note.user ? `${note.user.firstName} ${note.user.lastName || ''}`.trim() : 'User'}
              {' · '}
              {new Date(note.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
