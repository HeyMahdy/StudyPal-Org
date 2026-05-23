import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';
import { today } from '../utils/format';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', start: today(), end: '', color: '#4F46E5' });
  const navigate = useNavigate();

  const getTaskColor = (priority) => {
    if (priority === 'high') return '#DC2626';
    if (priority === 'medium') return '#F59E0B';
    if (priority === 'low') return '#16A34A';
    return '#4F46E5';
  };

  const load = async () => {
    const [eventsRes, tasksRes] = await Promise.all([
      api.get('/events'),
      api.get('/tasks?sort=due_date')
    ]);

    const eventEntries = (eventsRes.data.events || []).map((event) => ({
      id: `event-${event.id}`,
      title: event.title,
      start: event.start,
      end: event.end,
      color: event.color,
      extendedProps: { source: 'event', eventId: event.id }
    }));

    const taskEntries = (tasksRes.data.tasks || [])
      .filter((task) => task.due_date)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        start: task.due_date,
        allDay: true,
        color: getTaskColor(task.priority),
        extendedProps: { source: 'task', taskId: task.id }
      }));

    setEvents([...eventEntries, ...taskEntries]);
  };
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
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          events={events}
          eventClick={(info) => {
            const source = info.event.extendedProps?.source;
            if (source === 'task') {
              navigate(`/tasks/${info.event.extendedProps.taskId}`);
              return;
            }
            api.delete(`/events/${info.event.extendedProps.eventId}`).then(load);
          }}
        />
      </Card>
    </div>
  );
}
