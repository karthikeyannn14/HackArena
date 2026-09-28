import { Event, EventStatus } from '../types';
import { db } from './storage';

export interface EventFilterOptions {
  query?: string;
  status?: EventStatus | 'all';
  sortBy?: 'date_asc' | 'date_desc' | 'prize_high' | 'participants';
}

export const eventsApi = {
  async getEvents(filters?: EventFilterOptions): Promise<Event[]> {
    await new Promise(r => setTimeout(r, 200));
    let events = db.getEvents();

    if (filters?.query) {
      const q = filters.query.toLowerCase();
      events = events.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.tagline.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tracks.some(t => t.name.toLowerCase().includes(q))
      );
    }

    if (filters?.status && filters.status !== 'all') {
      events = events.filter(e => e.status === filters.status);
    }

    if (filters?.sortBy) {
      if (filters.sortBy === 'date_asc') {
        events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      } else if (filters.sortBy === 'date_desc') {
        events.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      } else if (filters.sortBy === 'participants') {
        events.sort((a, b) => b.participantCount - a.participantCount);
      }
    }

    return events;
  },

  async getEvent(id: string): Promise<Event | null> {
    await new Promise(r => setTimeout(r, 150));
    const events = db.getEvents();
    return events.find(e => e.id === id) || null;
  },

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    await new Promise(r => setTimeout(r, 300));
    const events = db.getEvents();
    const newEvent: Event = {
      id: `evt_${Date.now()}`,
      title: eventData.title || 'Untitled Hackathon',
      tagline: eventData.tagline || '',
      description: eventData.description || '',
      bannerTheme: eventData.bannerTheme || 'slate',
      organizerName: eventData.organizerName || 'HackArena Organizers',
      status: eventData.status || 'registration_open',
      startDate: eventData.startDate || new Date().toISOString().split('T')[0],
      endDate: eventData.endDate || new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      registrationDeadline: eventData.registrationDeadline || new Date().toISOString().split('T')[0],
      submissionDeadline: eventData.submissionDeadline || new Date().toISOString(),
      judgingStartDate: eventData.judgingStartDate || new Date().toISOString(),
      judgingEndDate: eventData.judgingEndDate || new Date().toISOString(),
      tracks: eventData.tracks || [
        { id: `trk_${Date.now()}`, name: 'General Track', description: 'Open innovation track', prizePool: '$10,000' }
      ],
      rules: eventData.rules || ['Code must be written during the competition window.'],
      schedule: eventData.schedule || [],
      prizes: eventData.prizes || [],
      faqs: eventData.faqs || [],
      participantCount: 0,
      projectCount: 0,
      prizeTotal: eventData.prizeTotal || '$10,000'
    };

    db.setEvents([newEvent, ...events]);
    return newEvent;
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    await new Promise(r => setTimeout(r, 250));
    const events = db.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) throw new Error(`Event ${id} not found`);

    const updated = { ...events[index], ...updates };
    events[index] = updated;
    db.setEvents(events);
    return updated;
  },

  async deleteEvent(id: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 200));
    const events = db.getEvents();
    const filtered = events.filter(e => e.id !== id);
    db.setEvents(filtered);
    return true;
  }
};

