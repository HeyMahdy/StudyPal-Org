import { Check, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function NotesContextPanel({ selectedNotes, onNotesChange }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const res = await api.get('/notes?search=');
        const fetchedNotes = Array.isArray(res?.data?.notes) ? res.data.notes : [];
        const currentUserId = Number(user?.id);
        const safeNotes = Number.isFinite(currentUserId)
          ? fetchedNotes.filter((note) => Number(note.user_id) === currentUserId)
          : [];
        setNotes(safeNotes);
      } catch (error) {
        console.error('Failed to fetch notes:', error);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [user?.id]);

  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes;
    const searchLower = search.toLowerCase();
    return notes.filter(
      (note) =>
        note.title?.toLowerCase().includes(searchLower) ||
        note.content?.toLowerCase().includes(searchLower)
    );
  }, [notes, search]);

  const toggleNote = (noteId) => {
    const isSelected = selectedNotes.some((n) => n.id === noteId);
    if (isSelected) {
      onNotesChange(selectedNotes.filter((n) => n.id !== noteId));
    } else {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        onNotesChange([
          ...selectedNotes,
          { id: note.id, title: note.title, content: note.content }
        ]);
      }
    }
  };

  const getPreview = (content) => {
    if (!content) return 'No preview available';
    const lines = content.split('\n').filter((line) => line.trim());
    const preview = lines.slice(0, 2).join(' ');
    return preview.length > 80 ? preview.substring(0, 80) + '…' : preview;
  };

  return (
    <Card>
      <h2 className="text-xl font-bold">Notes Context</h2>

      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          className="input w-full pl-10"
          placeholder="Search notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {selectedNotes.length > 0 && (
        <div className="mt-3 text-sm font-medium text-primary">
          {selectedNotes.length} note{selectedNotes.length !== 1 ? 's' : ''} selected
        </div>
      )}

      <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading notes…</div>
        ) : filteredNotes.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isSelected = selectedNotes.some((n) => n.id === note.id);
            return (
              <button
                key={note.id}
                onClick={() => toggleNote(note.id)}
                className={`w-full rounded-2xl p-3 text-left transition-all ${
                  isSelected
                    ? 'bg-primary/10 border border-primary'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-800 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isSelected && <Check size={16} className="text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {note.title || 'Untitled'}
                    </h3>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {getPreview(note.content)}
                    </p>
                    {note.tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(typeof note.tags === 'string' ? note.tags.split(',') : note.tags)
                          .filter((tag) => tag && tag.trim())
                          .slice(0, 2)
                          .map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedNotes.length > 0 && (
        <Button
          variant="secondary"
          className="mt-4 w-full"
          onClick={() => onNotesChange([])}
        >
          Clear Selection
        </Button>
      )}
    </Card>
  );
}
