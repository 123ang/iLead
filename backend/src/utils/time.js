const DAY_MS = 24 * 60 * 60 * 1000;

export const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);
export const daysBetween = (from, to) => Math.floor((to.getTime() - from.getTime()) / DAY_MS);
