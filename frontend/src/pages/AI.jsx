import { Bot, CheckCircle2, ListTodo, Send, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import NotesContextPanel from '../components/ai/NotesContextPanel';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import api from '../services/api';
import agentApi from '../services/agentApi';

const STUDY_CHAT_KEY_BASE = 'studypal_ai_study_chat';
const TASK_CHAT_KEY_BASE = 'studypal_ai_task_chat';
const STUDY_STARTERS = [
  'Explain this chapter in simple terms',
  'Give me a 20-minute study plan for today',
  'Quiz me with 5 questions from my notes'
];
const TASK_STARTERS = [
  'Build a portfolio website for internship applications',
  'Plan a one-week exam prep schedule',
  'Break down a final-year project into actionable tasks'
];

function loadStoredChat(storageKey) {
  try {
    const stored = sessionStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AI() {
  const { user } = useAuth();
  const userScope = user?.id || user?.email || 'guest';
  const studyChatKey = `${STUDY_CHAT_KEY_BASE}:${userScope}`;
  const taskChatKey = `${TASK_CHAT_KEY_BASE}:${userScope}`;

  const [message, setMessage] = useState('');
  const [studyChat, setStudyChat] = useState([]);
  const [taskChat, setTaskChat] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [mode, setMode] = useState('study');
  const [createdTasks, setCreatedTasks] = useState([]);
  const [taskError, setTaskError] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const studyBottomRef = useRef(null);
  const taskBottomRef = useRef(null);

  useEffect(() => {
    setStudyChat(loadStoredChat(studyChatKey));
  }, [studyChatKey]);

  useEffect(() => {
    setTaskChat(loadStoredChat(taskChatKey));
  }, [taskChatKey]);

  useEffect(() => {
    sessionStorage.setItem(studyChatKey, JSON.stringify(studyChat));
  }, [studyChat, studyChatKey]);

  useEffect(() => {
    sessionStorage.setItem(taskChatKey, JSON.stringify(taskChat));
  }, [taskChat, taskChatKey]);

  useEffect(() => {
    if (mode !== 'study') return;
    studyBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [studyChat, isThinking, mode]);

  useEffect(() => {
    if (mode !== 'tasks') return;
    taskBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [taskChat, isThinking, mode]);

  const postTaskAssistant = async (text, history) => {
    const token = localStorage.getItem('studypal_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return agentApi.post('/task/assistant', { message: text, history }, { headers });
  };

  const ask = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setMessage('');
    setTaskError('');
    setCreatedTasks([]);
    setIsThinking(true);

    if (mode === 'study') {
      const conversationHistory = studyChat.map((item) => ({
        role: item.role === 'ai' ? 'assistant' : 'user',
        content: item.text
      }));
      setStudyChat((items) => [...items, { role: 'you', text }]);

      const payload = { message: text };
      payload.conversationHistory = conversationHistory;
      if (selectedNotes.length > 0) {
        payload.contextNotes = selectedNotes;
      }

      try {
        const res = await api.post('/ai/chat', payload);
        setStudyChat((items) => [...items, { role: 'ai', text: res.data.reply }]);
      } catch (error) {
        setStudyChat((items) => [...items, { role: 'ai', text: error?.message || 'Could not get a response.' }]);
      } finally {
        setIsThinking(false);
      }
      return;
    }

    const taskHistory = taskChat.map((item) => ({
      role: item.role === 'ai' ? 'assistant' : 'user',
      content: item.text
    }));
    setTaskChat((items) => [...items, { role: 'you', text }]);

    try {
      const res = await postTaskAssistant(text, taskHistory);
      const reply = res.reply || 'Task plan ready.';
      setTaskChat((items) => [...items, { role: 'ai', text: reply }]);
      setCreatedTasks(res.created_tasks || []);
    } catch (error) {
      const errorText = error?.message || 'Could not generate task plan.';
      setTaskError(errorText);
      setTaskChat((items) => [...items, { role: 'ai', text: errorText }]);
    } finally {
      setIsThinking(false);
    }
  };

  const clearConversation = () => {
    if (mode === 'study') {
      setStudyChat([]);
      sessionStorage.removeItem(studyChatKey);
      return;
    }

    setTaskChat([]);
    setCreatedTasks([]);
    setTaskError('');
    sessionStorage.removeItem(taskChatKey);
  };

  const activeChat = mode === 'study' ? studyChat : taskChat;
  const starters = mode === 'study' ? STUDY_STARTERS : TASK_STARTERS;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-gray-500 dark:text-gray-400">Study help, task planning, and next-step suggestions in one place.</p>
        </div>
        <div className="flex rounded-2xl border border-slate-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setMode('study')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${mode === 'study' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            <Send size={16} />
            Study Help
          </button>
          <button
            type="button"
            onClick={() => setMode('tasks')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${mode === 'tasks' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            <ListTodo size={16} />
            Task Planner
          </button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-gray-800">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{mode === 'study' ? 'Study Assistant' : 'Task Planner Assistant'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{mode === 'study' ? 'Ask anything, summarize, or quiz yourself.' : 'Describe your goal and get actionable tasks.'}</p>
            </div>
            <button
              type="button"
              onClick={clearConversation}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-slate-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <Trash2 size={14} />
              Clear chat
            </button>
          </div>

          <div className="h-[420px] overflow-y-auto bg-slate-50/70 px-5 py-4 dark:bg-gray-950/40">
            {activeChat.length === 0 && !isThinking && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                <div className="mb-3 flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                  <Sparkles size={15} className="text-primary" />
                  Try one of these prompts
                </div>
                <div className="flex flex-wrap gap-2">
                  {starters.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => setMessage(starter)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary/40 hover:text-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid content-start gap-3">
              {activeChat.map((item, index) => (
                <div key={index} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${item.role === 'you' ? 'ml-auto bg-primary text-white' : 'bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100'}`}>
                  <div className={`mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider ${item.role === 'you' ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {item.role === 'you' ? 'You' : <><Bot size={12} /> AI</>}
                  </div>
                  <p className="whitespace-pre-wrap">{item.text}</p>
                </div>
              ))}
              {isThinking && (
                <div className="max-w-[85%] rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary align-middle" />
                  {mode === 'study' ? 'AI is thinking...' : 'Task manager is planning...'}
                </div>
              )}
              {mode === 'study' ? <div ref={studyBottomRef} /> : <div ref={taskBottomRef} />}
            </div>
          </div>

          <div className="border-t border-slate-200 px-5 py-4 dark:border-gray-800">
            <form onSubmit={ask} className="flex gap-3">
              <input
                className="input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={mode === 'study' ? 'Ask for study help...' : 'Describe the project you want to break down...'}
                required
                disabled={isThinking}
              />
              <Button disabled={isThinking}>{isThinking ? 'Thinking...' : <Send size={16} />}</Button>
            </form>
          </div>

          {mode === 'tasks' && (
            <div className="border-t border-slate-200 px-5 py-4 dark:border-gray-800">
              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                  Describe a project idea, for example: build a landing page, finish a portfolio, or launch an assignment feature. The agent will break it into tasks.
                </div>
                {taskError && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{taskError}</div>}

                {createdTasks.length > 0 && (
                  <div className="grid gap-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Created tasks</p>
                    {createdTasks.map((task) => (
                      <div key={task.id || task.title} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 text-emerald-600 dark:text-emerald-300" size={18} />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{task.title}</p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{task.description || 'No description provided.'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
        {mode === 'study' ? (
          <NotesContextPanel selectedNotes={selectedNotes} onNotesChange={setSelectedNotes} />
        ) : (
          <Card>
            <div className="grid gap-3">
              <p className="text-lg font-semibold">Task Planner Tips</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">The agent will turn a project idea into a small set of tasks and create them through the CRUD API.</p>
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Example prompt: <span className="font-medium text-gray-900 dark:text-white">Build a simple portfolio website with about, projects, and contact sections.</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
