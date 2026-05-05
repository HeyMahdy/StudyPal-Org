import { Globe, Link2, Play, Send, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import ReactQuill from 'react-quill';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';
import agentApi from '../services/agentApi';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState({ title: '', content: '', tags: '' });
  const [summary, setSummary] = useState('');
  const [noteFile, setNoteFile] = useState(null);
  const [agentResult, setAgentResult] = useState(null);
  const [agentSavedId, setAgentSavedId] = useState(null);
  const [agentError, setAgentError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorReply, setTutorReply] = useState('');
  const [isTutorLoading, setIsTutorLoading] = useState(false);

  const load = () => api.get(`/notes?search=${encodeURIComponent(search)}`).then((res) => setNotes(res.data.notes));
  useEffect(() => { load(); }, [search]);

  const save = async (e) => {
    e.preventDefault();
    if (active.id) await api.put(`/notes/${active.id}`, active);
    else await api.post('/notes', active);
    setActive({ title: '', content: '', tags: '' });
    load();
  };

  const analyzeNote = async (e) => {
    e.preventDefault();
    if (!noteFile) return;

    setIsAnalyzing(true);
    setAgentError('');
    setAgentResult(null);
    setAgentSavedId(null);

    try {
      const formData = new FormData();
      formData.append('file', noteFile);

      const uploadResponse = await agentApi.post('/upload-note/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadResponse.status !== 'success') {
        throw new Error(uploadResponse.error || 'Upload failed');
      }

      const analyzeResponse = await agentApi.post('/analyze-note/', {
        s3_key: uploadResponse.s3_key
      });

      if (analyzeResponse.status !== 'success') {
        throw new Error(analyzeResponse.error || 'Analysis failed');
      }

      setAgentResult(analyzeResponse.final_output);
    } catch (error) {
      setAgentError(error.message || 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAgentNote = async () => {
    if (!agentResult?.notes_markdown) return;

    const match = agentResult.notes_markdown.match(/^##\s+(.+)$/m);
    const title = match?.[1]?.trim() || `OCR Note ${new Date().toISOString().slice(0, 10)}`;

    const response = await api.post('/notes', {
      title,
      content: agentResult.notes_markdown,
      tags: 'ocr'
    });

    setAgentSavedId(response.data.note.id);
    load();
  };

  const deleteAgentNote = async () => {
    if (!agentSavedId) return;
    await api.delete(`/notes/${agentSavedId}`);
    setAgentSavedId(null);
    load();
  };

  const askTutor = async (e) => {
    e.preventDefault();
    if (!tutorInput.trim()) return;
    setIsTutorLoading(true);
    setTutorReply('');

    try {
      const response = await api.post('/ai/summarize', { content: tutorInput });
      setTutorReply(response.data.summary || 'No response yet.');
    } catch (error) {
      setTutorReply(error.message || 'Something went wrong.');
    } finally {
      setIsTutorLoading(false);
    }
  };

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch (error) {
      return '';
    }
  };

  const getYouTubeId = (url) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
      if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
      const match = parsed.pathname.match(/\/shorts\/([^/]+)/);
      return match ? match[1] : '';
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="notes-page">
      <div className="notes-header">
        <div>
          <p className="notes-kicker">Study workspace</p>
          <h1 className="notes-title">Notes</h1>
        </div>
        <p className="notes-subtitle">Scan, analyze, and curate your study notes with a cleaner workflow.</p>
      </div>

      <div className="notes-shell">
        <aside className="notes-sidebar">
          <div className="notes-sidebar-head">
            <p className="notes-label">History</p>
            <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="notes-list">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => setActive(note)}
                className={`notes-item ${active.id === note.id ? 'notes-item-active' : ''}`}
              >
                <div>
                  <p className="notes-item-title">{note.title}</p>
                  <p className="notes-item-date">{new Date(note.updated_at || note.created_at).toLocaleDateString()}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="notes-main">
          <section className="notes-upload">
            <div className="notes-upload-head">
              <div>
                <p className="notes-label">Upload</p>
                <h2 className="notes-section-title">Scan a note page</h2>
              </div>
              <div className="notes-actions">
                <Button type="submit" form="notes-upload-form" disabled={isAnalyzing || !noteFile}>
                  {isAnalyzing ? 'Analyzing...' : 'Analyze note'}
                </Button>
                {agentResult && (
                  <Button type="button" variant="secondary" onClick={() => setAgentResult(null)}>
                    Clear result
                  </Button>
                )}
                {isAnalyzing && (
                  <span className="notes-status">
                    <span className="notes-spinner" aria-hidden="true" />
                    Processing scan...
                  </span>
                )}
              </div>
            </div>
            <form id="notes-upload-form" onSubmit={analyzeNote} className="notes-dropzone" aria-label="Upload note">
              <input
                className="notes-file"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setNoteFile(e.target.files?.[0] || null)}
                required
              />
              <div>
                <p className="notes-drop-title">Drag & drop a scan here</p>
                <p className="notes-drop-sub">or click to choose a file (PNG, JPG, PDF).</p>
                {noteFile && <p className="notes-drop-file">Selected: {noteFile.name}</p>}
              </div>
            </form>
            {agentError && <p className="notes-error">{agentError}</p>}
          </section>

          <section className="notes-output">
            <div className="notes-output-head">
              <div>
                <p className="notes-label">Generated</p>
                <h2 className="notes-section-title">Structured notes</h2>
              </div>
              {agentResult && (
                <div className="notes-actions">
                  <Button type="button" onClick={saveAgentNote} disabled={!!agentSavedId}>
                    {agentSavedId ? 'Saved to notes' : 'Save to notes'}
                  </Button>
                  {agentSavedId && (
                    <Button type="button" variant="secondary" onClick={deleteAgentNote}>
                      Delete saved note
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="notes-render">
              {agentResult ? (
                <ReactMarkdown>{agentResult.notes_markdown}</ReactMarkdown>
              ) : (
                <p className="notes-placeholder">Upload a note to see a structured study guide here.</p>
              )}
            </div>
          </section>

          <section className="notes-output">
            <div className="notes-output-head">
              <div>
                <p className="notes-label">Saved note</p>
                <h2 className="notes-section-title">Selected from history</h2>
              </div>
              <div className="notes-actions">
                {active.id && (
                  <Button type="button" variant="secondary" onClick={() => api.delete(`/notes/${active.id}`).then(() => { setActive({ title: '', content: '', tags: '' }); load(); })}>
                    <Trash2 size={16} />Delete note
                  </Button>
                )}
              </div>
            </div>
            <div className="notes-render">
              {active.content ? (
                <ReactMarkdown>{active.content}</ReactMarkdown>
              ) : (
                <p className="notes-placeholder">Select a note from the left to view it here.</p>
              )}
            </div>
          </section>

          <section className="notes-tutor">
            <div className="notes-output-head">
              <div>
                <p className="notes-label">Ask your tutor</p>
                <h2 className="notes-section-title">Clarify anything</h2>
              </div>
            </div>
            <form onSubmit={askTutor} className="notes-tutor-form">
              <textarea
                className="notes-tutor-input"
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
                placeholder="Ask a question about your notes or paste a tricky paragraph."
                rows={4}
              />
              <div className="notes-actions">
                <Button type="submit" disabled={isTutorLoading || !tutorInput.trim()}>
                  <Send size={16} />Ask tutor
                </Button>
                <Button type="button" variant="secondary" onClick={() => setTutorInput('')}>
                  Clear
                </Button>
              </div>
            </form>
            {tutorReply && <div className="notes-tutor-reply"><Sparkles size={16} />{tutorReply}</div>}
          </section>
        </main>

        <aside className="notes-aside">
          <div className="notes-sticky">
            <div className="notes-aside-section">
              <div className="notes-aside-head">
                <Play size={16} />
                <p>YouTube Links</p>
              </div>
              <div className="notes-cards">
                {agentResult?.youtube_links?.length ? (
                  agentResult.youtube_links.map((item, index) => {
                    const videoId = getYouTubeId(item.url);
                    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
                    return (
                      <a key={`${item.url}-${index}`} className="notes-media" href={item.url} target="_blank" rel="noreferrer">
                        <div className="notes-media-thumb">
                          {thumbnail ? <img src={thumbnail} alt="" /> : <Play size={20} />}
                        </div>
                        <div>
                          <p className="notes-media-title">{item.title}</p>
                          <p className="notes-media-meta">youtube.com</p>
                        </div>
                      </a>
                    );
                  })
                ) : (
                  <p className="notes-empty">No videos yet.</p>
                )}
              </div>
            </div>

            <div className="notes-aside-section">
              <div className="notes-aside-head">
                <Link2 size={16} />
                <p>Web Links</p>
              </div>
              <div className="notes-cards">
                {agentResult?.web_links?.length ? (
                  agentResult.web_links.map((item, index) => {
                    const domain = getDomain(item.url);
                    const favicon = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : '';
                    return (
                      <a key={`${item.url}-${index}`} className="notes-resource" href={item.url} target="_blank" rel="noreferrer">
                        <div className="notes-resource-icon">
                          {favicon ? <img src={favicon} alt="" /> : <Globe size={18} />}
                        </div>
                        <div>
                          <p className="notes-media-title">{item.title}</p>
                          <p className="notes-media-meta">{domain}</p>
                        </div>
                      </a>
                    );
                  })
                ) : (
                  <p className="notes-empty">No resources yet.</p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
