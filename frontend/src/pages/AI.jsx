import { Send } from 'lucide-react';
import { useState } from 'react';
import NotesContextPanel from '../components/ai/NotesContextPanel';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import api from '../services/api';

export default function AI() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);

  const ask = async (e) => {
    e.preventDefault();
    const text = message;
    setMessage('');
    setChat((items) => [...items, { role: 'you', text }]);
    
    const payload = { message: text };
    if (selectedNotes.length > 0) {
      payload.contextNotes = selectedNotes;
    }
    
    const res = await api.post('/ai/chat', payload);
    setChat((items) => [...items, { role: 'ai', text: res.data.reply }]);
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">AI Assistant</h1>
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card>
          <div className="grid min-h-[420px] content-start gap-3">
            {chat.map((item, index) => <div key={index} className={`max-w-[80%] rounded-2xl p-3 text-sm ${item.role === 'you' ? 'ml-auto bg-primary text-white' : 'bg-slate-100 dark:bg-gray-950'}`}>{item.text}</div>)}
          </div>
          <form onSubmit={ask} className="mt-4 flex gap-3">
            <input className="input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask for study help..." required />
            <Button><Send size={16} /></Button>
          </form>
        </Card>
        <NotesContextPanel selectedNotes={selectedNotes} onNotesChange={setSelectedNotes} />
      </div>
    </div>
  );
}
