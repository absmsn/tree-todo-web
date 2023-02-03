import { MILLSECONDS_PER_DAY } from "../constants/number";

export function toHourMinute(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function getFirstMsOfDay(date) {
  const ms = date.getTime(), offset = date.getTimezoneOffset() * 60000;
  return ms - ((ms - offset) % MILLSECONDS_PER_DAY);
}

const maxDuration = Math.pow(2, 31) - 1;

class Timer {
  globalId = 0;

  timeoutMap = new Map();

  intervalMap = new Map();

  setTimeout(callback, delay) {
    const deadline = Date.now() + delay, id = this.globalId;
    const tick = () => {
      const duration = Math.min(maxDuration, deadline - Date.now());
      if (duration > 0) {
        const timer = setTimeout(tick, duration);
        this.timeoutMap.set(id, timer);
      } else {
        callback();
        this.timeoutMap.delete(id);
      }
    }
    tick();
    return this.globalId++;
  }

  clearTimeout(id) {
    if (this.timeoutMap.has(id)) {
      clearTimeout(id);
      this.timeoutMap.delete(id);
    }
  }
}

export const timer = new Timer();