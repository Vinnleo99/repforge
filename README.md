# Repforge

A workout tracker that runs as an installable web app. All workout data stays on the device (localStorage). Use Profile → Export backup regularly. The daily gym schedule is a public file, `schedule.json`; see SCHEDULE.md if you need to edit it.

- Install: `npm install`
- Develop: `npm run dev`
- Build: `npm run build` (static files in `dist/`, relative paths, works under a GitHub Pages sub-path)
- Preview the build: `npm run preview`
- Test the core flow and refresh screenshots: `npm run build && npm test`
