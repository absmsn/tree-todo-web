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
  globalId = -1; // 为了避免与JS的定时器id冲突,使用负数

  timeoutMap = new Map();

  intervalMap = new Map();

  setTimeout(callback, ms) {
    if (ms > maxDuration) {
      const deadline = Date.now() + ms, id = this.globalId--;
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
      return id;
    } else {
      return setTimeout(callback, ms);
    }
  }

  clearTimeout(timeoutId) {
    if (this.timeoutMap.has(timeoutId)) {
      const timerId = this.timeoutMap.get(timeoutId);
      clearTimeout(timerId);
      this.timeoutMap.delete(timeoutId);
    } else {
      clearTimeout(timeoutId);
    }
  }

  setInterval(callback, ms) {
    let id = this.globalId--, deadline = Date.now();
    const tick = () => {
      deadline += ms;
      // 校准
      const duration = Math.max(deadline - Date.now(), 0);
      const timerId = this.setTimeout(() => {
        callback();
        tick();
      }, duration);
      this.intervalMap.set(id, timerId);
    }
    tick();
    return id;
  }

  clearInterval(intervalId) {
    const timeoutId = this.intervalMap.get(intervalId);
    this.clearTimeout(timeoutId);
  }
}

export const timer = new Timer();