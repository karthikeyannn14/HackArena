import { 
  Event, 
  Project, 
  Team, 
  Judge, 
  Assignment, 
  Rubric, 
  Evaluation, 
  Result, 
  User, 
  NotificationItem 
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_EVENTS,
  INITIAL_PROJECTS,
  INITIAL_TEAMS,
  INITIAL_RUBRIC,
  INITIAL_JUDGES,
  INITIAL_ASSIGNMENTS,
  INITIAL_EVALUATIONS,
  INITIAL_RESULTS,
  INITIAL_NOTIFICATIONS
} from '../mock/data';

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`devpulse_${key}`);
    if (item) {
      return JSON.parse(item);
    }
  } catch (err) {
    console.warn(`Error loading localStorage key ${key}:`, err);
  }
  return fallback;
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`devpulse_${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error saving to localStorage key ${key}:`, err);
  }
}

export const db = {
  getUsers: (): User[] => getStored('users', INITIAL_USERS),
  setUsers: (users: User[]) => setStored('users', users),

  getEvents: (): Event[] => getStored('events', INITIAL_EVENTS),
  setEvents: (events: Event[]) => setStored('events', events),

  getProjects: (): Project[] => getStored('projects', INITIAL_PROJECTS),
  setProjects: (projects: Project[]) => setStored('projects', projects),

  getTeams: (): Team[] => getStored('teams', INITIAL_TEAMS),
  setTeams: (teams: Team[]) => setStored('teams', teams),

  getRubrics: (): Record<string, Rubric> => getStored('rubrics', { [INITIAL_RUBRIC.eventId]: INITIAL_RUBRIC }),
  setRubrics: (rubrics: Record<string, Rubric>) => setStored('rubrics', rubrics),

  getJudges: (): Judge[] => getStored('judges', INITIAL_JUDGES),
  setJudges: (judges: Judge[]) => setStored('judges', judges),

  getAssignments: (): Assignment[] => getStored('assignments', INITIAL_ASSIGNMENTS),
  setAssignments: (assignments: Assignment[]) => setStored('assignments', assignments),

  getEvaluations: (): Evaluation[] => getStored('evaluations', INITIAL_EVALUATIONS),
  setEvaluations: (evals: Evaluation[]) => setStored('evaluations', evals),

  getResults: (): Result[] => getStored('results', INITIAL_RESULTS),
  setResults: (results: Result[]) => setStored('results', results),

  getNotifications: (): NotificationItem[] => getStored('notifications', INITIAL_NOTIFICATIONS),
  setNotifications: (notifs: NotificationItem[]) => setStored('notifications', notifs),

  resetAll: () => {
    localStorage.clear();
  }
};


