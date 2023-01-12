import { isArray } from "lodash";
import { computed } from "mobx";
import { observer } from "mobx-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MILLSECONDS_PER_DAY } from "../../../../constants/number";
import { DAY_UNIT_HEIGHT, TASK_STRIP_GAP, TASK_STRIP_WIDTH } from "../../constant";
import { 
  getFirstMsOfDay,
  getFirstTask,
  getIntervalDaysIncludingStart,
  getIntervalDaysIncludingStartEnd,
  getLastMsOfDay,
  getLastTask
} from "../../util";
import RangeItem from "../range-item";
import RangeTimeline from "../range-timeline";
import style from "./index.module.css";

const unitWidth = TASK_STRIP_WIDTH + TASK_STRIP_GAP;

export default observer(({ map, tasks, descend, selectedTags, filterFinished }) => {
  const todayTimer = useRef(null);
  const [today, setToday] = useState(new Date());

  useState(() => {
    const tick = () => {
      const ms = MILLSECONDS_PER_DAY - (today.getSeconds() % MILLSECONDS_PER_DAY);
      todayTimer.current = setTimeout(() => {
        setToday(new Date());
        tick();
      }, ms);
    }
    tick();
    return (() => {
      clearTimeout(todayTimer.current);
    });
  }, []);

  const timedTasks = computed(() => {
    const tagIDs = new Set(selectedTags);
    let validTasks = tasks.filter(t => {
      if (filterFinished !== "all") {
        if ((filterFinished === "finished" && !t.finished) || 
          (filterFinished === "unfinished" && t.finished)) {
          return false;
        }
      }
      if (selectedTags.length > 0 && !t.tags.some(tag => tagIDs.has(tag.id))) {
        return false;
      }
      return t.startTime && t.endTime;
    });
    validTasks.sort((a, b) => {
      if (descend) {
        return b.endTime.getTime() - a.endTime.getTime();
      } else {
        return a.startTime.getTime() - b.startTime.getTime();
      }
    });
    if (validTasks.length < 2) {
      return validTasks;
    }
    let newValidTasks = [], i = 1;
    const before = (a, b, equal) => {
      if (equal) {
        return descend ? a >= b : a <= b;
      } else {
        return descend ? a > b : a < b;
      }
    };
    const farther = (a, b) => {
      return descend ? Math.min(a, b) : Math.max(a, b);
    }
    if (before(getLastMsOfDay(validTasks[0].endTime), getFirstMsOfDay(validTasks[1].startTime))) {
      newValidTasks.push(validTasks[0]);
    }
    while (i < validTasks.length) {
      // 找出事件互相重叠的一组任务并分层
      // 首尾时间相等不算重叠
      if (before(getFirstMsOfDay(validTasks[i].startTime), getLastMsOfDay(validTasks[i - 1].endTime))) {
        let layers = [[validTasks[i - 1]]], fartherEndTime = farther(
          getLastMsOfDay(validTasks[i - 1].endTime),
          getLastMsOfDay(validTasks[i].endTime)
        );
        while(i < validTasks.length) {
          const cur = validTasks[i];
          // 已经不与之前的任务重叠了，跳出
          if (before(fartherEndTime, getFirstMsOfDay(cur.startTime))) {
            newValidTasks.push(validTasks[i++]);
            break;
          }
          for (let k = 0; k < layers.length; k++) {
            let layer = layers[k], tail = layer[layer.length - 1];
            // 当在一天时也算作重叠
            if (before(getLastMsOfDay(tail.endTime), getFirstMsOfDay(cur.startTime))) {
              layer.push(validTasks[i]);
              fartherEndTime = farther(fartherEndTime, getLastMsOfDay(validTasks[i].endTime));
              break;
            }
            if (k === layers.length - 1) {
              layers.push([validTasks[i]]);
              fartherEndTime = farther(fartherEndTime, getLastMsOfDay(validTasks[i].endTime));
              break;
            }
          }
          i++;
        }
        if (newValidTasks.length > 0) {
          newValidTasks[newValidTasks.length - 1] = layers; // 替换上一个元素
        } else {
          newValidTasks.push(layers);
        }
      } else {
        newValidTasks.push(validTasks[i++]);
      }
    }
    return newValidTasks;
  }).get();

  let timedTasksView = null, firstTask, maxLayerNum = 1;
  if (timedTasks.length > 0) {
    timedTasks.forEach(task => {
      if (isArray(task)) {
        maxLayerNum = Math.max(maxLayerNum, task.length);
      }
    });
    firstTask = getFirstTask(timedTasks);
  }

  const timeLinePos = useMemo(() => {
    let height = 0, left = (maxLayerNum - 1) * unitWidth + TASK_STRIP_WIDTH * .5;
    if (timedTasks.length > 0) {
      const lastTask = getLastTask(timedTasks);
      if (descend) {
        height = Math.abs(getIntervalDaysIncludingStartEnd(lastTask.startTime, firstTask.endTime) * DAY_UNIT_HEIGHT);
      } else {
        height = getIntervalDaysIncludingStartEnd(firstTask.startTime, lastTask.endTime) * DAY_UNIT_HEIGHT;
      }
    }
    return { left, height };
  }, [timedTasks]);

  let todayMarkerTop = 0;
  if (timedTasks.length > 0) {
    if (descend) {
      todayMarkerTop = -getIntervalDaysIncludingStart(firstTask.endTime, today) * DAY_UNIT_HEIGHT;
    } else {
      todayMarkerTop = getIntervalDaysIncludingStart(firstTask.startTime, today) * DAY_UNIT_HEIGHT;
    }
  }

  if (timedTasks.length > 0) {
    timedTasksView = timedTasks.reduce((all, task) => {
      if (isArray(task)) {
        let groups = task;
        for (let i = 0; i < groups.length; i++) {
          for(let j = 0; j < groups[i].length; j++) {
            const task = groups[i][j];
            all.push(<RangeItem
              map={map}
              task={task}
              key={task.id}
              firstTask={firstTask}
              containerStyle={{
                right: 0,
                left: (maxLayerNum - i - 1) * unitWidth,
              }}
              defaultBehind={!!i}
              descend={descend}
            />);
          }
        }
      } else {
        all.push(<RangeItem
          map={map}
          task={task}
          key={task.id}
          firstTask={firstTask}
          containerStyle={{
            right: 0,
            left: (maxLayerNum - 1) * unitWidth
          }}
          defaultBehind={false}
          descend={descend}
        />);
      }
      return all;
    }, [])
  }

  return (
    <div className={style.mainContainer}>
      <div className="overflow-y-scroll overflow-x-hidden relative h-full">
        {timedTasksView}
        {
          timedTasks.length > 0 && <RangeTimeline
            descend={descend}
            left={timeLinePos.left}
            height={timeLinePos.height}
            startDate={new Date(firstTask.startTime.toLocaleDateString())}
            endTime={new Date(firstTask.endTime.toLocaleDateString())}
          />
        }
      </div>
      <div 
        className={style.todayMarker}
        style={{top: todayMarkerTop}}
      >
        →
      </div>
    </div>
  )
})