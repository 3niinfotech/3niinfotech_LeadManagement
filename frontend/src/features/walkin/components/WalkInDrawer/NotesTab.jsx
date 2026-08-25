import { FiMessageSquare } from 'react-icons/fi';

function initials(user) {
  const first = user?.firstName?.[0] || '';
  const last = user?.lastName?.[0] || '';
  return (first + last).toUpperCase() || 'U';
}

export default function NotesTab({ notes = [] }) {
  if (!notes.length) {
    return (
      <div className="crm-walkin-empty-panel">
        <FiMessageSquare className="w-7 h-7 text-text-muted" aria-hidden />
        <p className="crm-walkin-empty-panel__title">No notes yet</p>
        <p className="crm-walkin-empty-panel__sub">
          Counselling notes written by the assigned counsellor will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="crm-walkin-note-list">
      {notes.map((note) => (
        <li key={note.id} className="crm-walkin-note-card">
          <span className="crm-walkin-note-card__avatar" aria-hidden>{initials(note.user)}</span>
          <div className="min-w-0">
            <p className="crm-walkin-note-card__text">{note.content}</p>
            <p className="crm-walkin-note-card__meta">
              {note.user ? `${note.user.firstName} ${note.user.lastName || ''}`.trim() : 'User'}
              {' · '}
              {new Date(note.createdAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
