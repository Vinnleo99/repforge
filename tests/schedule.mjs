import assert from 'assert';
import { readFileSync } from 'fs';
import {
  isoDate, weekdayName, computeToday, computedUpcoming, isGymDay,
  lastDone, sessionAfter, weeklyDoneCount, formatSetsReps, exerciseDetail,
  exercisesForSession, matchExercise,
} from '../src/schedule.js';
import { EXERCISES } from '../src/exercises.js';

const file = JSON.parse(readFileSync(new URL('../public/schedule.json', import.meta.url), 'utf8'));
const thu = new Date(2026, 10, 26); // 26 November 2026, Thursday
const fri = new Date(2026, 10, 27);
const sat = new Date(2026, 10, 28);
const mon = new Date(2026, 10, 30);
const tue = new Date(2026, 11, 1);

assert.equal(isoDate(thu), '2026-11-26');
assert.equal(weekdayName(thu), 'Thursday');
assert.equal(file.rotation.length, 5);
assert.equal(lastDone(file).session, 'Push A');
assert.equal(computedUpcoming(file), 'Pull A');
assert.equal(sessionAfter(file.rotation, 'Pull B'), 'Push A');

// 1. Today is the day Push A was completed: show it as done, next up is Pull A.
const todayDone = computeToday(file, thu);
assert.equal(todayDone.date, '2026-11-26');
assert.equal(todayDone.isGymDay, true);
assert.equal(todayDone.isRestDay, false);
assert.equal(todayDone.todaySession, 'Push A');
assert.equal(todayDone.status, 'done');
assert.equal(todayDone.nextSession, 'Pull A');
assert.equal(todayDone.startSession, 'Pull A');
assert.equal(todayDone.weeklyDone, 1);
assert.equal(todayDone.weeklyTarget, 4);
assert.ok(exercisesForSession(file, 'Pull A', 'gym').some(e => e.name === 'Shoulder-width lat pulldown'));
assert.ok(exercisesForSession(file, 'Pull A', 'home').some(e => /pull-ups/i.test(e.name)));

// 2. The next day, with no further log, is Pull A and not yet done.
const tomorrow = computeToday(file, fri);
assert.equal(tomorrow.todaySession, 'Pull A');
assert.equal(tomorrow.status, null);
assert.equal(tomorrow.startSession, 'Pull A');
assert.equal(tomorrow.isGymDay, true);

// 3. A skipped session does not advance the rotation.
const skipped = {
  ...file,
  log: [
    ...file.log,
    { date: '2026-11-27', session: 'Pull A', status: 'skipped' },
  ],
};
const afterSkip = computeToday(skipped, sat);
assert.equal(computedUpcoming(skipped), 'Pull A');
assert.equal(afterSkip.todaySession, 'Pull A');
assert.equal(afterSkip.status, null);
assert.equal(lastDone(skipped).session, 'Push A');

const skipDay = computeToday(skipped, fri);
assert.equal(skipDay.todaySession, 'Pull A');
assert.equal(skipDay.status, 'skipped');
assert.equal(skipDay.nextSession, 'Pull A');
assert.equal(skipDay.startSession, 'Pull A');

// 4. An explicit next overrides the computed session.
const restarted = { ...file, next: 'Legs' };
assert.equal(computedUpcoming(restarted), 'Legs');
assert.equal(computeToday(restarted, fri).todaySession, 'Legs');

// Restart to the same name as the last completed session.
const sameAgain = { ...file, next: 'Push A' };
assert.equal(computeToday(sameAgain, fri).todaySession, 'Push A');

// 5. Override swaps today's session.
const swapped = { ...file, overrides: { '2026-11-27': { session: 'Legs' } } };
const swapDay = computeToday(swapped, fri);
assert.equal(swapDay.todaySession, 'Legs');
assert.equal(swapDay.isGymDay, true);
assert.equal(swapDay.status, null);

// 6. Override rest day.
const rest = { ...file, overrides: { '2026-11-27': { rest: true } } };
const restDay = computeToday(rest, fri);
assert.equal(restDay.isGymDay, false);
assert.equal(restDay.isRestDay, true);
assert.equal(restDay.todaySession, null);
assert.equal(restDay.nextSession, 'Pull A');
assert.equal(restDay.startSession, 'Pull A');

// 7. gymDays set: Thursday is a rest day if it is not in the list.
const weekdays = { ...file, gymDays: ['Monday', 'Wednesday', 'Friday'] };
assert.equal(isGymDay(weekdays, thu), false);
assert.equal(isGymDay(weekdays, fri), true);
assert.equal(computeToday(weekdays, thu).isRestDay, true);
// But 26 November already has a done log, so the completed session is still shown.
assert.equal(computeToday(weekdays, thu).todaySession, 'Push A');
assert.equal(computeToday(weekdays, thu).status, 'done');
assert.equal(computeToday(weekdays, thu).nextSession, 'Pull A');

// 8. rest: false forces a gym day on a weekday that is not in gymDays.
const forced = {
  ...file,
  gymDays: ['Monday', 'Wednesday', 'Friday'],
  overrides: { '2026-11-26': { rest: false, session: 'Pull A' } },
};
// 26 November is Thursday. The override forces a gym day, and names Pull A.
// There is also a log entry for that date (Push A done). Session comes from the override.
const forcedDay = computeToday(forced, thu);
assert.equal(forcedDay.isGymDay, true);
assert.equal(forcedDay.todaySession, 'Pull A');
assert.equal(forcedDay.status, 'done');

// 9. Rotation wraps after Pull B.
const wrapped = {
  ...file,
  log: [
    ...file.log,
    { date: '2026-11-27', session: 'Pull A', status: 'done' },
    { date: '2026-11-28', session: 'Legs', status: 'done' },
    { date: '2026-11-29', session: 'Push B', status: 'done' },
    { date: '2026-11-30', session: 'Pull B', status: 'done' },
  ],
};
assert.equal(computedUpcoming(wrapped), 'Push A');
assert.equal(computeToday(wrapped, tue).todaySession, 'Push A');

// 10. A home 'done' advances the rotation and counts in the week, just like gym.
const homeDone = {
  ...file,
  log: [
    ...file.log,
    { date: '2026-11-27', session: 'Pull A', status: 'done', location: 'home' },
  ],
};
assert.equal(computedUpcoming(homeDone), 'Legs');
assert.equal(weeklyDoneCount(homeDone, fri), 2);
assert.equal(computeToday(homeDone, sat).todaySession, 'Legs');

// 11. Later log entries on the same date win.
const doubled = {
  ...file,
  log: [
    { date: '2026-11-26', session: 'Push A', status: 'skipped' },
    { date: '2026-11-26', session: 'Push A', status: 'done' },
  ],
};
assert.equal(computeToday(doubled, thu).status, 'done');
assert.equal(computedUpcoming(doubled), 'Pull A');

// 12. Empty log starts at the first rotation entry.
const fresh = { ...file, log: [], next: null };
assert.equal(computedUpcoming(fresh), 'Push A');
assert.equal(computeToday(fresh, mon).todaySession, 'Push A');

// Sets and repetitions wording.
assert.equal(formatSetsReps({ sets: 3, reps: '6-8' }), '3 sets of 6 to 8');
assert.equal(formatSetsReps({ sets: 2, reps: '15' }), '2 sets of 15 repetitions');
assert.equal(formatSetsReps({ sets: 1, reps: '10-12' }), '1 set of 10 to 12');
assert.ok(exerciseDetail({ sets: 3, reps: '10-12', alternative: 'Half-range multi-flight' }).includes('Alternative: Half-range multi-flight'));

// Exercise library matching.
assert.equal(matchExercise('Chest press machine', EXERCISES).id, 'chest-press');
assert.equal(matchExercise('Hammer curl', EXERCISES).id, 'hammer-curl');
assert.equal(matchExercise('Dumbbell goblet squat', EXERCISES).id, 'goblet-squat');
assert.equal(matchExercise('Pull-ups, neutral or shoulder-width grip', EXERCISES).id, 'pull-up');
assert.equal(matchExercise('Seated dumbbell shoulder press, neutral grip', EXERCISES).id, 'seated-dumbbell-shoulder-press');
const custom = matchExercise('High-to-low cable fly', EXERCISES);
assert.equal(custom.custom, true);
assert.equal(custom.name, 'High-to-low cable fly');
assert.ok(custom.id.length > 0);

// Every programmed session has a gym list and a home list.
for (const name of file.rotation) {
  assert.ok((file.sessions[name] || []).length > 0, `missing gym list for ${name}`);
  assert.ok((file.homeSessions[name] || []).length > 0, `missing home list for ${name}`);
}

console.log('Schedule calculation checks passed.');
