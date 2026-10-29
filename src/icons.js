// Original line icons for muscle groups and equipment (24 by 24, stroke only).
const P={
 Chest:'<path d="M4 7c2.5-1.8 5.5-1.8 8 .3 2.5-2.1 5.5-2.1 8-.3v5.5c-2 3-5.6 3.4-8 1.2-2.4 2.2-6 1.8-8-1.2z"/><path d="M12 7.3v6.9"/>',
 Back:'<path d="M5 4.5h14l-2.2 8.5L16 20H8l-.8-7z"/><path d="M12 4.5V20M9 9.5l3 2 3-2"/>',
 Shoulders:'<circle cx="12" cy="5.5" r="2.2"/><path d="M3.5 15c0-4.4 3.8-7 8.5-7s8.5 2.6 8.5 7"/><path d="M7.5 11.5V20M16.5 11.5V20"/>',
 Biceps:'<path d="M4 19h8.5c4.1 0 7.5-3.1 7.5-7.2 0-2.9-1.8-5.3-4.2-5.3-1.9 0-3.1 1.5-3.3 3.4-2.3-.9-5.3.4-6.3 2.6z"/><path d="M6.2 12.5L4 19"/>',
 Triceps:'<path d="M6 3.5v10.2C6 17.2 8.7 20 12 20s6-2.8 6-6.3V3.5"/><path d="M9.3 8v5.2c0 1.7 1.2 3 2.7 3s2.7-1.3 2.7-3V8"/>',
 Legs:'<path d="M8 3.5 7 12l1.3 8.5M16 3.5l1 8.5-1.3 8.5M7 12h3.5M13.5 12H17"/>',
 Core:'<rect x="7" y="3.5" width="10" height="17" rx="4"/><path d="M12 3.5v17M7 9.3h10M7 14.7h10"/>',
 Cardio:'<path d="M12 20s-8-4.8-8-10.6A4 4 0 0 1 12 7a4 4 0 0 1 8 2.4C20 15.2 12 20 12 20z"/><path d="M6.5 12h3l1.2-2.2 2.3 4.4 1.2-2.2h3.3"/>',
 Barbell:'<path d="M2.5 12h19M5.5 8v8M8.5 6v12M15.5 6v12M18.5 8v8"/>',
 Dumbbell:'<path d="M7.5 12h9M4.5 9.5v5M7.5 7.5v9M16.5 7.5v9M19.5 9.5v5"/>',
 Cable:'<circle cx="12" cy="5" r="2"/><path d="M12 7v9M8 20.5h8M12 16l-3 4.5M12 16l3 4.5"/>',
 Machine:'<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/>',
 Bodyweight:'<circle cx="12" cy="5" r="2"/><path d="M12 7.5v6.5M8 20.5l4-6.5 4 6.5M6 10.5h12"/>',
 Other:'<circle cx="12" cy="12" r="8"/><path d="M8.5 12h7M12 8.5v7"/>'};
export const icon=k=>`<svg class="o" viewBox="0 0 24 24" aria-hidden="true">${P[k]||P.Other}</svg>`;
export const exThumb=e=>`<div class="thumb" title="${e.muscle}, ${e.equipment}">${icon(e.muscle)}<span class="eq">${icon(e.equipment)}</span></div>`;
