import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { projectsApi } from '../../api/projects';
import { Event, Project } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export const HomePage: React.FC = () => {
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      const events = await eventsApi.getEvents();
      if (events.length > 0) setFeaturedEvent(events[0]);

      const projects = await projectsApi.getProjects();
      setFeaturedProjects(projects.slice(0, 3));
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative border-b border-slate-200 bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              <span>HackArena Platform</span>
              <span aria-hidden="true">Â·</span>
              <span>Engineering Competitions</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]" style={{ textWrap: 'balance' }}>
              Build. Compete. Get Judged. Win.
            </h1>
            
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              The end-to-end competitive platform for high-stakes technical hackathons. Form teams, build state-of-the-art systems, submit verified projects, and receive structured rubric evaluations from principal engineers.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/events">
                <Button variant="primary" size="lg">
                  Explore Events
                </Button>
              </Link>
              <Link to={user ? "/dashboard/project" : "/register"}>
                <Button variant="outline" size="lg">
                  Join a Hackathon
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Platform Statistics (Claim-to-proof) */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">1,420+</p>
              <p className="text-xs text-slate-500 mt-0.5">Active Engineers</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">$195,000</p>
              <p className="text-xs text-slate-500 mt-0.5">Bounties & Prize Pools</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">360+</p>
              <p className="text-xs text-slate-500 mt-0.5">Submitted Systems</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">100%</p>
              <p className="text-xs text-slate-500 mt-0.5">Auditable Rubric Evaluations</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Event Spotlight */}
      {featuredEvent && (
        <section className="py-14 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Featured Hackathon
                </span>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {featuredEvent.title}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={featuredEvent.status} />
                <span className="text-xs text-slate-400">Â·</span>
                <span className="text-xs font-mono tabular-nums text-slate-600 font-semibold">
                  {featuredEvent.prizeTotal} Total Pool
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
              <div className="relative z-10 max-w-3xl">
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {featuredEvent.description}
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Registration Closes</span>
                    <span className="font-semibold text-white font-mono">{featuredEvent.registrationDeadline}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Submission Deadline</span>
                    <span className="font-semibold text-white font-mono">Oct 14, 23:59 UTC</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Judging Window</span>
                    <span className="font-semibold text-white font-mono">Oct 15 â€“ 16, 2026</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-white text-slate-900 hover:bg-slate-100 border-white"
                    onClick={() => navigate(`/events/${featuredEvent.id}`)}
                  >
                    View Event Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white border-slate-700 bg-slate-800/80 hover:bg-slate-800"
                    onClick={() => navigate(`/events/${featuredEvent.id}/projects`)}
                  >
                    Browse Submissions ({featuredEvent.projectCount})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. How It Works (Mechanism-to-Outcome) */}
      <section id="how-it-works" className="py-16 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-10 max-w-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Competition Lifecycle
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              A transparent, end-to-end engineering pipeline
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Every stage from registration to peer judging is structured with explicit timelines and reproducible rubric criteria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 border border-slate-200 rounded-lg bg-slate-50/50">
              <span className="text-xs font-mono text-slate-400 block mb-2">Phase 01</span>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Team Formation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register as an individual or assemble a squad of up to 4 contributors. Coordinate skillsets and assign roles in the team portal.
              </p>
            </div>

            <div className="p-5 border border-slate-200 rounded-lg bg-slate-50/50">
              <span className="text-xs font-mono text-slate-400 block mb-2">Phase 02</span>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Build & Benchmark</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Code solutions to real technical challenges. Document architecture, performance metrics, and host an interactive live demo.
              </p>
            </div>

            <div className="p-5 border border-slate-200 rounded-lg bg-slate-50/50">
              <span className="text-xs font-mono text-slate-400 block mb-2">Phase 03</span>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Rubric Evaluation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verified judges independently score submissions on technical rigor, innovation, impact, and presentation using weighted rubrics.
              </p>
            </div>

            <div className="p-5 border border-slate-200 rounded-lg bg-slate-50/50">
              <span className="text-xs font-mono text-slate-400 block mb-2">Phase 04</span>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Results & Awards</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Final scores and category champions are published with full score breakdowns and judge qualitative commentary.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Projects Showcase */}
      <section className="py-16 border-b border-slate-200 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Project Discovery
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Featured submissions
              </h2>
            </div>
            <Link to="/events/evt_nexus_2026/projects">
              <Button variant="outline" size="sm">
                View All Projects
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map(project => (
              <Card key={project.id} hoverable className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs text-slate-500 font-medium truncate">{project.trackName}</span>
                    <StatusBadge status={project.status} />
                  </div>

                  <CardTitle className="text-base line-clamp-1">{project.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1.5 leading-relaxed">
                    {project.tagline}
                  </CardDescription>

                  <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-slate-600">
                    {project.technologies.slice(0, 4).map((tech, i) => (
                      <span key={tech} className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 4 && (
                      <span className="text-[11px] text-slate-400 self-center">
                        +{project.technologies.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500 truncate max-w-[150px]">
                    by <span className="font-medium text-slate-800">{project.teamName}</span>
                  </div>
                  <Link to={`/projects/${project.id}`}>
                    <Button variant="ghost" size="sm">
                      Inspect â†’
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ Accordion */}
      <section id="faq" className="py-16 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Questions & Answers
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {[
              {
                q: 'What is the role of judges versus organizers?',
                a: 'Organizers configure the hackathon rules, schedule, tracks, and rubric parameters. Independent judges are assigned project batches and evaluate them solely against the structured rubric criteria without knowing other judgesâ€™ scores.',
              },
              {
                q: 'Can participants update their projects after the deadline?',
                a: 'No. When the submission deadline passes, project records are cryptographically locked for peer and judge review to guarantee evaluation fairness.',
              },
              {
                q: 'How does team management and invitations work?',
                a: 'Team leaders can invite teammates via email. Members receive real-time dashboard notifications and can accept or decline invitations before the team freeze date.',
              },
              {
                q: 'Are custom rubrics supported for niche tracks?',
                a: 'Yes. Organizers can define customized scoring rubrics with specific criteria, maximum point allocations, and explicit percentage weights for each challenge track.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-900 hover:text-slate-700 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 font-mono text-sm ml-2">
                    {openFaq === idx ? 'âˆ’' : '+'}
                  </span>
                </button>
                {openFaq === idx && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed pr-6">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Call To Action Footer Banner */}
      <section className="py-16 bg-slate-900 text-white text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Ready to test your systems against the best?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Create an account in seconds, explore available competitions, and register your team today.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/register">
              <Button variant="primary" size="md" className="bg-white text-slate-900 hover:bg-slate-100 border-white">
                Create Free Account
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" size="md" className="text-white border-slate-700 bg-slate-800 hover:bg-slate-700">
                Browse Active Competitions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

