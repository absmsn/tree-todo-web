import { isArray } from "lodash";
import { MILLSECONDS_PER_DAY } from "../../constants/number";

// 计算两个日期的间隔日，包括开始那一天
export const getIntervalDaysIncludingStart = (start, end) => {
  let startMill = start.getTime(), endMill = end.getTime();
  return Math.floor(endMill / MILLSECONDS_PER_DAY) - Math.floor(startMill / MILLSECONDS_PER_DAY);
};

// 计算两个日期的间隔日，包括开始终止那两天
export const getIntervalDaysIncludingStartEnd = (start, end) => {
  let startMill = start.getTime(), endMill = end.getTime();
  return Math.ceil(endMill / MILLSECONDS_PER_DAY) - Math.floor(startMill / MILLSECONDS_PER_DAY);
};

export const getFirstTask = (tasks) => {
  return isArray(tasks[0]) ? tasks[0][0][0] : tasks[0];
}

export function getFirstMsOfDay(date) {
  const ms = date.getTime();
  return date.getTime() - (ms % MILLSECONDS_PER_DAY);
}

export function getLastMsOfDay(date) {
  return getFirstMsOfDay(date) + MILLSECONDS_PER_DAY;
}

// 获取区间任务的最后一个任务，按开始时间排序
export const getLastTask = (tasks) => {
  if (isArray(tasks[tasks.length - 1])) {
    let maxEnd = null, group = tasks[tasks.length - 1];
    for (let i = 0; i < group.length; i++) {
      for (let j = 0; j < group[i].length; j++) {
        if (!maxEnd || (group[i][j].endTime.getTime() > maxEnd.endTime.getTime())) {
          maxEnd = group[i][j];
        }
      }
    }
    return maxEnd;
  } else {
    return tasks[tasks.length - 1];
  }
}