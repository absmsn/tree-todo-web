import { MILLSECONDS_PER_DAY } from "../constants/number";

export function toHourMinute(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function getFirstMsOfDay(date) {
  const ms = date.getTime(), offset = date.getTimezoneOffset() * 60000;
  return ms - ((ms - offset) % MILLSECONDS_PER_DAY);
}