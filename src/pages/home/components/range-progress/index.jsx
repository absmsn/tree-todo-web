import { useMemo } from "react"
import { observer } from "mobx-react";
import { Popover } from "antd";
import { DEFAULT_STROKE_WIDTH } from "../../../../constants/geometry";
import dayjs from "dayjs";
import { useState } from "react";
import { useEffect } from "react";
import { timer } from "../../../../utils/time";
import { isNumber } from "lodash";

const getProgressColor = progress => {
  return progress < 180 ? (progress < 36 ? "#f5222d" : "#fadb14") : "#95de64";
}

export default observer(function RangeProgress({ node }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (node.startTime && node.endTime) {
      let duration = node.endTime.getTime() - Date.now(), timeoutTimerId, intervalTimerId;
      const unit = Math.floor((node.endTime.getTime() - node.startTime.getTime()) / 100);
      // 还未开始
      if (duration > (node.endTime.getTime() - node.startTime.getTime())) {
        const wait = node.startTime.getTime() - Date.now();
        timeoutTimerId = timer.setTimeout(() => {
          setNow(Date.now());
          intervalTimerId = timer.setInterval(() => {
            setNow(Date.now());
            if (Date.now() - node.endTime.getTime() > 0) {
              timer.clearInterval(timeoutTimerId);
            }
          }, unit);
        }, wait);
      } else if (duration > unit) {
        setNow(Date.now());
        intervalTimerId = timer.setInterval(() => {
          setNow(Date.now());
          if (Date.now() - node.endTime.getTime() > 0) {
            timer.clearInterval(timeoutTimerId);
          }
        }, unit);
      } else if (duration > 0) { // 如果还不到百分之一的时间就要结束了
        timeoutTimerId = timer.setTimeout(() => setNow(Date.now(), duration));
      } else { // 已经结束
        setNow(Date.now());
      }
      return () => {
        if (isNumber(intervalTimerId)) {
          timer.clearInterval(intervalTimerId);
        }
        if (isNumber(timeoutTimerId > 0)) {
          timer.clearTimeout(timeoutTimerId);
        }
      };
    }
  }, [node.startTime, node.endTime]);

  const progress = useMemo(() => {
    let progress = 0, timeNow = now;
    if (node.finished || (node.startTime && node.startTime.getTime() > timeNow)) {
      return progress;
    }
    if (node.startTime && node.endTime) {
      const start = node.startTime.getTime(), end = node.endTime.getTime();
      if (timeNow > end) {
        timeNow = end;
      }
      progress = Math.floor((end - timeNow) / Math.max((end - start), 1) * 360);
    }
    return progress;
  }, [node.startTime, node.endTime, node.finished, now]);
  const endPos = useMemo(() => {
    // 如果是0度,需要至少展示一点,所以设置为1度
    const angle = ((!progress ? 1 : progress) - 90) / 180 * Math.PI;
    return {
      x: node.x + node.r * Math.cos(angle),
      y: node.y + node.r * Math.sin(angle)
    };
  }, [progress, node.x, node.y]);

  return (
    <Popover
      trigger="hover"
      content={
        Date.now() > node.endTime.getTime()
          ? "任务已过期"
          : <>
            <div className="mb-1">还剩{Math.ceil(progress / 360 * 100)}%的时间</div>
            <div>
              <span>{dayjs(node.endTime).fromNow()}结束</span>
              <span>({dayjs(node.endTime).format("MM-DD HH:mm")})</span>
            </div>
          </>
      }
      overlayClassName="tooltip-style"
    >
      {
        // 当为0或360度时,起始和终止坐标重叠,无法确认绘制方向,使用circle
        progress > 0 && (
          progress === 360
            ? <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill="none"
              stroke={`${getProgressColor(progress)}`}
              strokeWidth={DEFAULT_STROKE_WIDTH + 1}
              strokeLinecap="round"
            >
            </circle>
            : <path
              d={`M ${node.x} ${node.y - node.r} A ${node.r} ${node.r} 0 ${progress > 180 ? 1 : 0} 1 ${endPos.x} ${endPos.y}`}
              fill="none"
              stroke={`${getProgressColor(progress)}`}
              strokeWidth={DEFAULT_STROKE_WIDTH + 1}
              strokeLinecap="round"
            >
            </path>
        )
      }
    </Popover>
  )
});