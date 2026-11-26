# Daily gym schedule

The live app reads `public/schedule.json` (served at `/repforge/schedule.json`) every time it is opened, and falls back to the last saved copy on the phone if the network is unavailable. Edit this file and commit the change to the `master` branch. After GitHub Pages has deployed, Victricius will see the update when he next opens the app (or when he brings it back to the foreground).

Do not put Victricius's private training notes anywhere except this file and the app itself. The repository is public, so keep the file to session names, set and repetition ranges, and dates only.

## File shape

| Field | Meaning |
| --- | --- |
| `version` | Number. Raise it when you change the meaning of a field. |
| `updated` | The date you last edited the file, as `YYYY-MM-DD`. |
| `rotation` | The five sessions in order: Push A, Pull A, Legs, Push B, Pull B. |
| `gymDays` | Weekday names such as `"Monday"`. An empty list or `null` means the days are not set, so the app treats every day as a possible gym day unless you override it. |
| `homeEquipment` | A short note shown when the Home list is selected. |
| `sessions` | The gym exercise list for each session name. |
| `homeSessions` | The home exercise list for the same five session names. |
| `log` | A list of completed or skipped sessions, oldest first. Append a new row; do not rewrite history unless you are correcting a mistake. |
| `overrides` | A map of `YYYY-MM-DD` to a one-day change (swap the session, force a rest day, or add a note). |
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

1. If `overrides` has an entry for today and `rest` is `true`, today is a rest day.
2. If that override has `rest` set to `false`, or names a `session`, today is a gym day and the named session is used.
3. Otherwise, if `gymDays` is empty or missing, today is treated as a gym day. If `gymDays` lists weekdays, today is a gym day only when today's weekday is in that list.
4. Today's session is, in this order: the override's `session` if present; otherwise the log entry for today if one exists; otherwise the `next` field if it is set; otherwise the session after the most recent log entry whose status is `"done"`. Skipped entries are ignored when advancing the rotation.
5. When today is already completed, or is a rest day, the card also shows **Next up**: the session that should be done next, using the same rule.

The Gym / Home toggle only changes which exercise list is shown and which exercises are copied into a started workout. It does not change which session name is due.

## Examples

### Swap today's session

To give Victricius Legs today (for example 27 November 2026) instead of the computed session:

```json
"overrides": {
  "2026-11-27": { "session": "Legs", "note": "Swapped because the squat rack was free" }
}
```

### Force a rest day, or force a gym day

```json
"overrides": {
  "2026-11-28": { "rest": true, "note": "Travel day" }
}
```

```json
"overrides": {
  "2026-11-29": { "rest": false, "session": "Pull A" }
}
```

The second form is useful when `gymDays` is set and you want him to train on a day that is not in the list.

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

### Set the usual gym days

Once the four weekdays are confirmed:

```json
"gymDays": ["Monday", "Tuesday", "Thursday", "Friday"]
```

Use full English weekday names, with a capital letter.

## After you commit

Push to `master` and wait until the Pages deployment on the repository has finished. Victricius should fully close and reopen the app, or switch away and back, to pick up the new file. If the phone is offline it will keep showing the last copy it saved.
