import { Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import api from '../services/api';

export default function AI() {
  const [message, setMessage] = useState('');
  const [content, setContent] = useState('');
  const [chat, setChat] = useState([]);
  const [result, setResult] = useState('');

  const ask = async (e) => {
    e.preventDefault();
    const text = message;
    setMessage('');
    setChat((items) => [...items, { role: 'you', text }]);
    const res = await api.post('/ai/chat', { message: text });
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
        <Card>
          <h2 className="text-xl font-bold">Study tools</h2>
          <textarea className="input mt-4 min-h-40" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste notes or a chapter excerpt" />
          <div className="mt-3 grid gap-3">
            <Button variant="secondary" onClick={() => api.post('/ai/summarize', { content }).then((res) => setResult(res.data.summary))}><Sparkles size={16} />Summarize</Button>
            <Button variant="secondary" onClick={() => api.post('/ai/flashcards', { content }).then((res) => setResult(res.data.cards))}>Generate flashcards</Button>
          </div>
          {result && <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-100 p-4 text-sm dark:bg-gray-950">{result}</pre>}
        </Card>
      </div>
    </div>
  );
}
