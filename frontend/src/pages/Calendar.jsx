import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';
import { today } from '../utils/format';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', start: today(), end: '', color: '#4F46E5' });
  const load = () => api.get('/events').then((res) => setEvents(res.data.events));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/events', form);
    setForm({ title: '', start: today(), end: '', color: '#4F46E5' });
    load();
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Calendar</h1>
      <Card>
        <form onSubmit={create} className="grid gap-3 md:grid-cols-[1fr_180px_180px_120px_auto]">
          <Input label="Event" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Start" type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required />
          <Input label="End" type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          <Input label="Color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          <Button className="self-end">Add</Button>
        </form>
      </Card>
      <Card>
        <FullCalendar plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} initialView="dayGridMonth" headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }} events={events.map((e) => ({ id: e.id, title: e.title, start: e.start, end: e.end, color: e.color }))} eventClick={(info) => api.delete(`/events/${info.event.id}`).then(load)} />
      </Card>
    </div>
  );
}
