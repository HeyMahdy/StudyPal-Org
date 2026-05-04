import { Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState({ title: '', content: '', tags: '' });
  const [summary, setSummary] = useState('');

  const load = () => api.get(`/notes?search=${encodeURIComponent(search)}`).then((res) => setNotes(res.data.notes));
  useEffect(() => { load(); }, [search]);

  const save = async (e) => {
    e.preventDefault();
    if (active.id) await api.put(`/notes/${active.id}`, active);
    else await api.post('/notes', active);
    setActive({ title: '', content: '', tags: '' });
    load();
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Notes</h1>
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card>
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="mt-4 grid gap-3">{notes.map((note) => <button key={note.id} onClick={() => setActive(note)} className="rounded-2xl border border-slate-200 p-3 text-left dark:border-gray-800"><b>{note.title}</b><p className="text-sm text-gray-500">{note.tags}</p></button>)}</div>
        </Card>
        <Card>
          <form onSubmit={save} className="grid gap-4">
            <Input label="Title" value={active.title} onChange={(e) => setActive({ ...active, title: e.target.value })} required />
            <Input label="Tags" value={active.tags} onChange={(e) => setActive({ ...active, tags: e.target.value })} placeholder="exam, physics" />
            <ReactQuill theme="snow" value={active.content} onChange={(content) => setActive({ ...active, content })} />
            <div className="flex flex-wrap gap-3">
              <Button>Save note</Button>
              <Button type="button" variant="secondary" onClick={() => api.post('/ai/summarize', { content: active.content }).then((res) => setSummary(res.data.summary))}><Sparkles size={16} />Summarize</Button>
              {active.id && <Button type="button" variant="secondary" onClick={() => api.delete(`/notes/${active.id}`).then(() => { setActive({ title: '', content: '', tags: '' }); load(); })}><Trash2 size={16} />Delete</Button>}
            </div>
          </form>
          {summary && <div className="mt-5 rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100">{summary}</div>}
        </Card>
      </div>
    </div>
  );
}
