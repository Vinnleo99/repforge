// Daily gym schedule: load, today calculation, exercise matching.

export const SCHEDULE_CACHE_KEY = 'repforge-schedule-v1';
export const LOCATION_KEY = 'repforge-location';

export function isoDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function weekdayName(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-GB', { weekday: 'long' });
}

export function longDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function logChronological(schedule) {
  const log = [...(schedule.log || [])];
  return log
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.date.localeCompare(b.entry.date) || a.index - b.index)
    .map(x => x.entry);
}

export function lastDone(schedule) {
  const done = logChronological(schedule).filter(e => e.status === 'done');
  return done.at(-1) || null;
}

export function todaysLog(schedule, iso) {
  const entries = logChronological(schedule).filter(e => e.date === iso);
  return entries.at(-1) || null;
}

export function sessionAfter(rotation, name) {
  const list = rotation || [];
  const i = list.indexOf(name);
  if (i < 0) return list[0] || null;
  return list[(i + 1) % list.length];
}

export function computedUpcoming(schedule) {
  if (schedule.next) return schedule.next;
  const last = lastDone(schedule);
  if (!last) return (schedule.rotation || [])[0] || null;
  return sessionAfter(schedule.rotation, last.session);
}

export function isGymDay(schedule, date = new Date()) {
  const iso = isoDate(date);
  const override = (schedule.overrides || {})[iso];
  if (override && override.rest === true) return false;
  if (override && override.rest === false) return true;
  if (override && override.session) return true;
  const days = schedule.gymDays;
  if (!days || days.length === 0) return true;
  return days.includes(weekdayName(date));
}

export function weekStartMonday(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function weeklyDoneCount(schedule, date = new Date()) {
  const start = weekStartMonday(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const startIso = isoDate(start);
  const endIso = isoDate(end);
  return (schedule.log || []).filter(e => e.status === 'done' && e.date >= startIso && e.date < endIso).length;
}

export function weeklyTarget(schedule) {
  const days = schedule.gymDays;
  if (Array.isArray(days) && days.length) return days.length;
  return 4;
}

export function exercisesForSession(schedule, sessionName, location = 'gym') {
  if (!sessionName) return [];
  const table = location === 'home' ? schedule.homeSessions : schedule.sessions;
  return (table && table[sessionName]) || [];
}

export function formatSetsReps(exercise) {
  const n = Number(exercise.sets) || 0;
  const setWord = n === 1 ? '1 set' : `${n} sets`;
  const reps = String(exercise.reps ?? '').trim();
  if (!reps) return setWord;
  if (reps.includes('-')) {
    const [a, b] = reps.split('-').map(s => s.trim());
    return `${setWord} of ${a} to ${b}`;
  }
  return `${setWord} of ${reps} repetitions`;
}

export function exerciseDetail(exercise) {
  let text = formatSetsReps(exercise);
  if (exercise.note) {
    const note = String(exercise.note).trim();
    text += `. ${note}`;
  }
  if (exercise.alternative) {
    const alt = String(exercise.alternative).trim();
    text += `. Alternative: ${alt.endsWith('.') ? alt.slice(0, -1) : alt}`;
  }
  return text;
}

export function workoutNote(exercise) {
  const parts = [`Target: ${formatSetsReps(exercise)}.`];
  if (exercise.note) {
    const note = String(exercise.note).trim();
    parts.push(note.endsWith('.') ? note : note + '.');
  }
  if (exercise.alternative) {
    const alt = String(exercise.alternative).trim();
    parts.push(`Alternative: ${alt.endsWith('.') ? alt : alt + '.'}`);
  }
  return parts.join(' ');
}

export function computeToday(schedule, date = new Date()) {
  const when = date instanceof Date ? date : new Date(date);
  const iso = isoDate(when);
  const weekday = weekdayName(when);
  const override = (schedule.overrides || {})[iso] || null;
  const logEntry = todaysLog(schedule, iso);
  const gymDay = isGymDay(schedule, when);
  const upcoming = computedUpcoming(schedule);

  let todaySession = null;
  let status = null;
  if (override && override.session) {
    todaySession = override.session;
    status = logEntry ? logEntry.status : null;
  } else if (logEntry) {
    todaySession = logEntry.session;
    status = logEntry.status;
  } else if (gymDay) {
    todaySession = upcoming;
  }

  const completedOrRest = status === 'done' || !gymDay;
  let nextSession = upcoming;
  if (status === 'done') {
    if (schedule.next && schedule.next !== todaySession) nextSession = schedule.next;
    else if (schedule.next && schedule.next === todaySession) nextSession = schedule.next;
    else nextSession = sessionAfter(schedule.rotation, todaySession);
  } else if (status === 'skipped') {
    nextSession = upcoming;
  }

  const startSession = completedOrRest ? nextSession : todaySession;

  return {
    date: iso,
    weekday,
    displayDate: longDate(when),
    isGymDay: gymDay,
    isRestDay: !gymDay,
    todaySession,
    status,
    logEntry,
    override,
    nextSession,
    startSession,
    weeklyDone: weeklyDoneCount(schedule, when),
    weeklyTarget: weeklyTarget(schedule),
  };
}

const ALIASES = {
  'chest press machine': 'chest-press',
  'shoulder press machine': 'shoulder-press',
  'cable lateral raise': 'cable-lateral-raise',
  'triceps rope pushdown': 'triceps-pushdown',
  'triceps pushdown': 'triceps-pushdown',
  'shoulder-width lat pulldown': 'lat-pulldown',
  'lat pulldown': 'lat-pulldown',
  'hammer curl': 'hammer-curl',
  'seated leg curl': 'seated-leg-curl',
  'leg extension': 'leg-extension',
  'seated calf raise': 'seated-calf-raise',
  'cable fly or pec deck': 'cable-crossover',
  'overhead rope triceps extension': 'overhead-triceps-extension',
  'overhead triceps extension': 'overhead-triceps-extension',
  'neutral-grip or shoulder-width lat pulldown': 'lat-pulldown',
  'neutral-grip seated cable row': 'seated-cable-row',
  'seated cable row': 'seated-cable-row',
  'rear delt machine': 'reverse-fly',
  'preacher curl machine': 'preacher-curl',
  'preacher curl': 'preacher-curl',
  'cable crunch': 'cable-crunch',
  'seated dumbbell shoulder press, neutral grip': 'seated-dumbbell-shoulder-press',
  'seated dumbbell shoulder press': 'seated-dumbbell-shoulder-press',
  'dumbbell lateral raise': 'lateral-raise',
  'lateral raise': 'lateral-raise',
  'band triceps pushdown': 'triceps-pushdown',
  'pull-ups, neutral or shoulder-width grip': 'pull-up',
  'pull-ups': 'pull-up',
  'pull up': 'pull-up',
  'dumbbell one-arm row, other hand on a chair': 'single-arm-dumbbell-row',
  'dumbbell hammer curl': 'hammer-curl',
  'dumbbell goblet squat': 'goblet-squat',
  'goblet squat': 'goblet-squat',
  'dumbbell romanian deadlift': 'romanian-deadlift',
  'romanian deadlift': 'romanian-deadlift',
  'dumbbell split squat': 'bulgarian-split-squat',
  'standing calf raise holding a dumbbell': 'standing-calf-raise',
  'standing calf raise': 'standing-calf-raise',
  'dumbbell arnold press': 'arnold-press',
  'arnold press': 'arnold-press',
  'chin-ups or neutral-grip pull-ups': 'chin-up',
  'chin-ups': 'chin-up',
  'band face pull': 'face-pull',
  'face pull': 'face-pull',
  'hanging knee raise on the pull-up bar': 'hanging-leg-raise',
  'hanging knee raise': 'hanging-leg-raise',
};

function normalise(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slug(name) {
  return normalise(name).replace(/\s+/g, '-');
}

const ALIAS_BY_KEY = Object.fromEntries(Object.entries(ALIASES).map(([k, v]) => [normalise(k), v]));

export function matchExercise(name, library = []) {
  const raw = String(name || '').trim();
  const key = normalise(raw);
  const aliasId = ALIAS_BY_KEY[key];
  if (aliasId) {
    const found = library.find(e => e.id === aliasId);
    if (found) return { ...found, custom: false };
  }
  const exact = library.find(e => normalise(e.name) === key || e.id === slug(raw));
  if (exact) return { ...exact, custom: false };
  // Prefer the longest library name that is contained in the schedule name.
  const contained = library
    .filter(e => {
      const n = normalise(e.name);
      return n.length >= 8 && (key.includes(n) || n.includes(key));
    })
    .sort((a, b) => normalise(b.name).length - normalise(a.name).length);
  if (contained[0]) return { ...contained[0], custom: false };
  return { id: slug(raw) || 'custom-exercise', name: raw, muscle: '', equipment: guessEquipment(raw), custom: true };
}

function guessEquipment(name) {
  const n = normalise(name);
  if (n.includes('dumbbell')) return 'Dumbbell';
  if (n.includes('barbell')) return 'Barbell';
  if (n.includes('cable') || n.includes('band')) return 'Cable';
  if (n.includes('machine')) return 'Machine';
  if (n.includes('pull up') || n.includes('chin up') || n.includes('push up')) return 'Bodyweight';
  return 'Other';
}

export function readLocation() {
  try {
    return localStorage.getItem(LOCATION_KEY) === 'home' ? 'home' : 'gym';
  } catch {
    return 'gym';
  }
}

export function writeLocation(location) {
  try {
    localStorage.setItem(LOCATION_KEY, location === 'home' ? 'home' : 'gym');
  } catch { /* ignore */ }
}

export async function loadSchedule(url = './schedule.json') {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    try { localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    return data;
  } catch {
    try {
      const raw = localStorage.getItem(SCHEDULE_CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  }
}
