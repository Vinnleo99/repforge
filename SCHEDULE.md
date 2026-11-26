# Daily gym schedule

The live app reads `public/schedule.json` (served at `/repforge/schedule.json`) every time it is opened, and falls back to the last saved copy on the phone if the network is unavailable. Edit this file and commit the change to the `master` branch. After GitHub Pages has deployed, Victricius will see the update when he next opens the app (or when he brings it back to the foreground).

Do not put Victricius's private training notes anywhere except this file and the app itself. The repository is public, so keep the file to session names, set and repetition ranges, and dates only.

## File shape

| Field | Meaning |
| --- | --- |
| `version` | Number. Raise it when you change the meaning of a field. |
| `updated` | The date you last edited the file, as `YYYY-MM-DD`. |
| `rotation` | The five sessions in order: Push A, Pull A, Legs, Push B, Pull B. |
| `weeklyTarget` | How many sessions he aims to complete in a week (Monday to Sunday), as `{ "min": 4, "max": 5 }`. If this field is missing, the app uses 4 to 5. |
| `homeEquipment` | A short note shown when the Home list is selected. |
| `sessions` | The gym exercise list for each session name. |
| `homeSessions` | The home exercise list for the same five session names. |
| `log` | A list of completed or skipped sessions, oldest first. Append a new row; do not rewrite history unless you are correcting a mistake. |
| `overrides` | A map of `YYYY-MM-DD` to a one-day change (swap the session, mark a rest day with `"rest": true`, or add a note). There are no fixed gym weekdays; every day is a training day unless you set `rest` to `true`. |
| `next` | Optional. If set to a session name, that session is the next one to do, instead of the session after the last completed log entry. Set it back to `null` once that session has been logged as done, or the same session will be offered again. |

Each exercise is an object:

- `name` (required)
- `sets` (required, a number)
- `reps` (required, a number such as `"15"` or a range such as `"6-8"`)
- `note` (optional, for example `"Each side"` or `"With straps"`)
- `alternative` (optional, a substitute movement)

Each log entry is an object:

- `date` (required, `YYYY-MM-DD`)
- `session` (required, one of the rotation names)
- `status` (required, `"done"` or `"skipped"`)
- `extras` (optional, a list of `{ "name", "sets", "reps"? }` for work added on the day)
- `location` (optional, `"gym"` or `"home"`). A home session marked `"done"` counts toward the weekly total and advances the rotation in exactly the same way as a gym session. `"skipped"` never advances the rotation, wherever it was meant to be done.

## How the app decides what today is

There are no fixed training weekdays. Every day shows the next session in the rotation as **Today's workout**, unless you mark that date as a rest day.

1. If `overrides` has an entry for today and `rest` is `true`, today is a rest day. The card then shows **Next up** instead of today's workout.
2. Otherwise today's session is, in this order: the override's `session` if present; otherwise the log entry for today if one exists; otherwise the `next` field if it is set; otherwise the session after the most recent log entry whose status is `"done"`. Skipped entries are ignored when advancing the rotation.
3. When today is already completed, or is a rest day, the card also shows **Next up**: the session that should be done next, using the same rule.

The weekly line on the card counts completed sessions from Monday to Sunday, and reads them against `weeklyTarget` (for example, "1 of 4 to 5 sessions completed this week").

The Gym / Home toggle only changes which exercise list is shown and which exercises are copied into a started workout. It does not change which session name is due.

## Examples

### Swap today's session

To give Victricius Legs today (for example 27 November 2026) instead of the computed session:

```json
"overrides": {
  "2026-11-27": { "session": "Legs", "note": "Swapped because the squat rack was free" }
}
```

### Mark a rest day

```json
"overrides": {
  "2026-11-28": { "rest": true, "note": "Travel day" }
}
```

Only an explicit `"rest": true` override makes a rest day. There is no weekday list to maintain.

### Restart the rotation

Set `next` to the session that should be done next, usually `"Push A"`:

```json
"next": "Push A"
```

Leave the log as it is. After that Push A session is logged as `"done"`, set `next` back to `null`.

### Mark a session done or skipped

Append a row to `log`. Do not remove earlier rows.

```json
"log": [
  {
    "date": "2026-11-26",
    "session": "Push A",
    "status": "done",
    "location": "gym",
    "extras": [{ "name": "Machine biceps curl", "sets": 2 }]
  },
  {
    "date": "2026-11-27",
    "session": "Pull A",
    "status": "done",
    "location": "home"
  }
]
```

A skipped day, which does not advance the rotation:

```json
{
  "date": "2026-11-28",
  "session": "Legs",
  "status": "skipped",
  "note": "Felt unwell"
}
```

(The `note` field on a log entry is optional and is not shown in the app today; it is there for your own records.)

### Change an exercise

Edit the object inside `sessions` (gym) or `homeSessions` (home). Keep the session name the same.

```json
{"name": "Chest press machine", "sets": 3, "reps": "5-7", "note": "Heavier top set"}
```

### Change the weekly target

```json
"weeklyTarget": { "min": 4, "max": 5 }
```

If the minimum and the maximum are the same number, the card will say "4 sessions" rather than "4 to 5 sessions".

## After you commit

Push to `master` and wait until the Pages deployment on the repository has finished. Victricius should fully close and reopen the app, or switch away and back, to pick up the new file. If the phone is offline it will keep showing the last copy it saved.
