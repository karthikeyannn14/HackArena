import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { Event, EventStatus, Track, ScheduleItem, PrizeItem, FAQItem } from '../../types';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/ui/Skeleton';

export const EventEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [organizerName, setOrganizerName] = useState('Global Hackathon Federation');
  const [status, setStatus] = useState<EventStatus>('registration_open');
  const [prizeTotal, setPrizeTotal] = useState('$50,000');

  // Dates
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-04');
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-10-28');
  const [submissionDeadline, setSubmissionDeadline] = useState('2026-11-03T23:59:00Z');
  const [judgingStartDate, setJudgingStartDate] = useState('2026-11-04T00:00:00Z');
  const [judgingEndDate, setJudgingEndDate] = useState('2026-11-05T18:00:00Z');

  // Tracks
  const [tracks, setTracks] = useState<Track[]>([
    { id: 'trk_1', name: 'AI & Inference Systems', description: 'Quantization & low-latency execution', prizePool: '$25,000' },
    { id: 'trk_2', name: 'Distributed Resilience', description: 'Fault tolerant consensus & storage', prizePool: '$25,000' },
  ]);

  // Rules
  const [rules, setRules] = useState<string[]>([
    'All code must be newly written during the competition window.',
    'Teams of 1 to 4 contributors are supported.',
    'Public git repository and live working demo required.',
  ]);

  // Schedule
  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    { id: 'sch_1', title: 'Opening Ceremony', description: 'Track release & API kickoff', date: '2026-11-01', time: '09:00 UTC', type: 'ceremony' },
    { id: 'sch_2', title: 'Code Freeze Deadline', description: 'Project locks for evaluation', date: '2026-11-03', time: '23:59 UTC', type: 'deadline' },
  ]);

  // Prizes
  const [prizes, setPrizes] = useState<PrizeItem[]>([
    { id: 'prz_1', title: 'Grand Champion Architecture Award', amount: '$30,000', description: 'Best overall technical excellence' },
    { id: 'prz_2', title: 'Track Winner Award', amount: '$20,000', description: 'Highest score in track challenge' },
  ]);

  // FAQ
  const [faqs, setFaqs] = useState<FAQItem[]>([
    { id: 'faq_1', question: 'Can I participate remotely?', answer: 'Yes, this hackathon is 100% virtual and open globally.' },
  ]);

  useEffect(() => {
    async function loadEvent() {
      if (isNew) return;
      setIsLoading(true);
      try {
        const ev = await eventsApi.getEvent(id!);
        if (ev) {
          setTitle(ev.title);
          setTagline(ev.tagline);
          setDescription(ev.description);
          setOrganizerName(ev.organizerName);
          setStatus(ev.status);
          setPrizeTotal(ev.prizeTotal);
          setStartDate(ev.startDate);
          setEndDate(ev.endDate);
          setRegistrationDeadline(ev.registrationDeadline);
          setSubmissionDeadline(ev.submissionDeadline);
          setJudgingStartDate(ev.judgingStartDate);
          setJudgingEndDate(ev.judgingEndDate);
          setTracks(ev.tracks || []);
          setRules(ev.rules || []);
          setSchedule(ev.schedule || []);
          setPrizes(ev.prizes || []);
          setFaqs(ev.faqs || []);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadEvent();
  }, [id, isNew]);

  const handleSave = async () => {
    if (!title) {
      showToast('Title required', 'Please provide an event title.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const payload: Partial<Event> = {
        title,
        tagline,
        description,
        organizerName,
        status,
        prizeTotal,
        startDate,
        endDate,
        registrationDeadline,
        submissionDeadline,
        judgingStartDate,
        judgingEndDate,
        tracks,
        rules,
        schedule,
        prizes,
        faqs,
      };

      if (isNew) {
        const created = await eventsApi.createEvent(payload);
        showToast('Event Created', `Created ${created.title}`, 'success');
        navigate(`/organizer/events/${created.id}/edit`);
      } else {
        await eventsApi.updateEvent(id!, payload);
        showToast('Event Updated', 'Saved all event configuration details.', 'success');
      }
    } catch (err: any) {
      showToast('Error saving event', err?.message || 'Check inputs.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'dates', label: 'Timeline & Deadlines' },
    { id: 'tracks', label: `Tracks (${tracks.length})` },
    { id: 'rules', label: 'Rules & Code of Conduct' },
    { id: 'schedule', label: `Schedule (${schedule.length})` },
    { id: 'prizes', label: `Prizes (${prizes.length})` },
    { id: 'faqs', label: 'FAQ' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/organizer" className="hover:text-slate-900 transition-colors">Organizer</Link>
            <span>/</span>
            <Link to="/organizer/events" className="hover:text-slate-900 transition-colors">Events</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{isNew ? 'New Hackathon' : title}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isNew ? 'Create New Hackathon' : `Edit: ${title}`}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/organizer/events">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            {isNew ? 'Publish Hackathon' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Editor Panels */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        {/* Tab 1: Basic Information */}
        {activeTab === 'basic' && (
          <div className="space-y-5">
            <Input
              label="Hackathon Title"
              placeholder="e.g. Distributed Consensus Hackathon 2026"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />

            <Input
              label="Tagline / Short Summary"
              placeholder="e.g. Architecting next-generation autonomous inference engines."
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Competition Status"
                value={status}
                onChange={e => setStatus(e.target.value as EventStatus)}
                options={[
                  { value: 'registration_open', label: 'Registration Open' },
                  { value: 'live', label: 'Live Hackathon' },
                  { value: 'registration_closed', label: 'Registration Closed' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />

              <Input
                label="Organizer Entity"
                value={organizerName}
                onChange={e => setOrganizerName(e.target.value)}
              />

              <Input
                label="Total Prize Pool"
                placeholder="$50,000"
                value={prizeTotal}
                onChange={e => setPrizeTotal(e.target.value)}
              />
            </div>

            <Textarea
              label="Comprehensive Event Description"
              placeholder="Detail the technical themes, challenge background, and target audience..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-[140px]"
            />
          </div>
        )}

        {/* Tab 2: Timeline & Deadlines */}
        {activeTab === 'dates' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Competition Start Date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <Input
                label="Competition End Date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Registration Deadline"
                type="date"
                value={registrationDeadline}
                onChange={e => setRegistrationDeadline(e.target.value)}
              />
              <Input
                label="Submission Deadline (UTC)"
                value={submissionDeadline}
                onChange={e => setSubmissionDeadline(e.target.value)}
                helperText="Formatted as ISO timestamp e.g. 2026-11-03T23:59:00Z"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Judging Window Start"
                value={judgingStartDate}
                onChange={e => setJudgingStartDate(e.target.value)}
              />
              <Input
                label="Judging Window End"
                value={judgingEndDate}
                onChange={e => setJudgingEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Tracks */}
        {activeTab === 'tracks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Define specific challenge categories and bounties</span>
              <button
                type="button"
                onClick={() => setTracks([...tracks, { id: `trk_${Date.now()}`, name: 'New Challenge Track', description: 'Track requirements', prizePool: '$10,000' }])}
                className="text-xs font-semibold text-slate-800 hover:text-black cursor-pointer"
              >
                + Add Track
              </button>
            </div>

            <div className="space-y-4">
              {tracks.map((trk, i) => (
                <div key={trk.id} className="p-4 rounded-md border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      className="font-semibold text-sm bg-transparent border-b border-slate-300 pb-1 w-full focus:outline-none"
                      value={trk.name}
                      onChange={e => {
                        const updated = [...tracks];
                        updated[i].name = e.target.value;
                        setTracks(updated);
                      }}
                      placeholder="Track Title"
                    />
                    <input
                      type="text"
                      className="font-mono text-xs text-right bg-white border border-slate-200 rounded px-2 py-1 w-28"
                      value={trk.prizePool}
                      onChange={e => {
                        const updated = [...tracks];
                        updated[i].prizePool = e.target.value;
                        setTracks(updated);
                      }}
                      placeholder="$10,000"
                    />
                    {tracks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setTracks(tracks.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    className="text-xs text-slate-600 bg-white border border-slate-200 rounded px-2.5 py-1.5 w-full"
                    value={trk.description}
                    onChange={e => {
                      const updated = [...tracks];
                      updated[i].description = e.target.value;
                      setTracks(updated);
                    }}
                    placeholder="Track brief & guidelines"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Rules */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Official competition terms and submission integrity requirements</span>
              <button
                type="button"
                onClick={() => setRules([...rules, 'New competition rule.'])}
                className="text-xs font-semibold text-slate-800 hover:text-black cursor-pointer"
              >
                + Add Rule
              </button>
            </div>
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 w-6">{idx + 1}.</span>
                <input
                  type="text"
                  className="w-full text-xs rounded-md border border-slate-300 p-2"
                  value={rule}
                  onChange={e => {
                    const updated = [...rules];
                    updated[idx] = e.target.value;
                    setRules(updated);
                  }}
                />
                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRules(rules.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Schedule */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Milestones, check-ins, workshops, and ceremonies</span>
              <button
                type="button"
                onClick={() => setSchedule([...schedule, { id: `sch_${Date.now()}`, title: 'New Workshop', description: 'Details', date: '2026-11-02', time: '12:00 UTC', type: 'workshop' }])}
                className="text-xs font-semibold text-slate-800 hover:text-black cursor-pointer"
              >
                + Add Milestone
              </button>
            </div>
            {schedule.map((item, idx) => (
              <div key={item.id} className="p-3 border border-slate-200 rounded-md bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    className="font-semibold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded w-1/2"
                    value={item.title}
                    onChange={e => {
                      const updated = [...schedule];
                      updated[idx].title = e.target.value;
                      setSchedule(updated);
                    }}
                    placeholder="Milestone title"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="font-mono text-[11px] bg-white border border-slate-200 px-2 py-1 rounded w-24"
                      value={item.date}
                      onChange={e => {
                        const updated = [...schedule];
                        updated[idx].date = e.target.value;
                        setSchedule(updated);
                      }}
                      placeholder="Date"
                    />
                    <input
                      type="text"
                      className="font-mono text-[11px] bg-white border border-slate-200 px-2 py-1 rounded w-24"
                      value={item.time}
                      onChange={e => {
                        const updated = [...schedule];
                        updated[idx].time = e.target.value;
                        setSchedule(updated);
                      }}
                      placeholder="Time"
                    />
                    <button
                      type="button"
                      onClick={() => setSchedule(schedule.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  className="w-full text-xs bg-white border border-slate-200 px-2 py-1 rounded"
                  value={item.description}
                  onChange={e => {
                    const updated = [...schedule];
                    updated[idx].description = e.target.value;
                    setSchedule(updated);
                  }}
                  placeholder="Milestone description"
                />
              </div>
            ))}
          </div>
        )}

        {/* Tab 6: Prizes */}
        {activeTab === 'prizes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Prizes and recognition awards</span>
              <button
                type="button"
                onClick={() => setPrizes([...prizes, { id: `prz_${Date.now()}`, title: 'Category Award', amount: '$5,000', description: 'Award description' }])}
                className="text-xs font-semibold text-slate-800 hover:text-black cursor-pointer"
              >
                + Add Prize
              </button>
            </div>
            {prizes.map((p, idx) => (
              <div key={p.id} className="p-3 border border-slate-200 rounded-md bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    className="font-semibold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded w-2/3"
                    value={p.title}
                    onChange={e => {
                      const updated = [...prizes];
                      updated[idx].title = e.target.value;
                      setPrizes(updated);
                    }}
                  />
                  <input
                    type="text"
                    className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded w-28 text-right"
                    value={p.amount}
                    onChange={e => {
                      const updated = [...prizes];
                      updated[idx].amount = e.target.value;
                      setPrizes(updated);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPrizes(prizes.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full text-xs bg-white border border-slate-200 px-2 py-1 rounded"
                  value={p.description}
                  onChange={e => {
                    const updated = [...prizes];
                    updated[idx].description = e.target.value;
                    setPrizes(updated);
                  }}
                  placeholder="Award criteria"
                />
              </div>
            ))}
          </div>
        )}

        {/* Tab 7: FAQs */}
        {activeTab === 'faqs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Frequently asked questions</span>
              <button
                type="button"
                onClick={() => setFaqs([...faqs, { id: `faq_${Date.now()}`, question: 'Question?', answer: 'Answer.' }])}
                className="text-xs font-semibold text-slate-800 hover:text-black cursor-pointer"
              >
                + Add FAQ
              </button>
            </div>
            {faqs.map((f, idx) => (
              <div key={f.id} className="p-3 border border-slate-200 rounded-md bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    className="font-semibold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded w-full"
                    value={f.question}
                    onChange={e => {
                      const updated = [...faqs];
                      updated[idx].question = e.target.value;
                      setFaqs(updated);
                    }}
                    placeholder="Question"
                  />
                  <button
                    type="button"
                    onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  className="w-full text-xs bg-white border border-slate-200 px-2 py-1 rounded min-h-[50px]"
                  value={f.answer}
                  onChange={e => {
                    const updated = [...faqs];
                    updated[idx].answer = e.target.value;
                    setFaqs(updated);
                  }}
                  placeholder="Answer"
                />
              </div>
            ))}
          </div>
        )}

        {/* Save Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <Link to="/organizer/events">
            <Button variant="outline" size="sm">
              Back to Events List
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            Save All Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};
