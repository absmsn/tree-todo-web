import { useState, useEffect, useMemo } from "react"
import { observer } from "mobx-react";
import { Popover, Badge } from "antd";
import { DEFAULT_STROKE_WIDTH } from "../../../../constants/geometry";
import { TooltipSvgSon } from "../../../../components/tooltip-svg-son";
import { timer } from "../../../../utils/time";
import { isNumber } from "lodash";
import dayjs from "dayjs";
import "./index.css";

const getProgressColor = progress => {
  return progress < 180 ? (progress < 36 ? "#f5222d" : "#fadb14") : "#95de64";
}

export default observer(function RangeProgress({ node }) {
  const [now, setNow] = useState(Date.now());
  const [isPopoverShow, setIsPopoverShow] = useState(false);

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
      if (timeNow > end) { // 已经结束
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

  const onMouseEnter = () => !isPopoverShow && setIsPopoverShow(true);

  const onMouseLeave = () => isPopoverShow && setIsPopoverShow(false);

  let popoverContent = null;
  if (isPopoverShow) {
    let timeNow = Date.now(), timeFormat = "MM-DD HH:mm";
    if (node.finished) {
      const finishTime = dayjs(node.finishTime);
      popoverContent = <>
        <Badge color="green" text="已完成" className="mb-1" />
        任务已于{finishTime.toNow(true)}前 ({finishTime.format(timeFormat)}) 完成
      </>;
    } else if (timeNow > node.endTime.getTime()) {
      const end = dayjs(node.endTime);
      popoverContent = <>
        <Badge color="grey" text="已过期" className="mb-1" />
        任务已于{end.toNow(true)}前 ({end.format(timeFormat)}) 过期
      </>;
    } else if (timeNow < node.startTime.getTime()) {
      const start = dayjs(node.startTime);
      popoverContent = <>
        <Badge color="orange" text="未开始" className="mb-1" />
        任务将于{start.fromNow(true)}后 ({start.format(timeFormat)}) 开始
      </>;
    } else {
      popoverContent = <>
        <Badge color="yellow" text="进行中" className="mb-1" />
        <div className="mb-1">还剩{Math.ceil(progress / 360 * 100)}%的时间</div>
        <div>
          <span>{dayjs(node.endTime).fromNow()}结束</span>
          <span>({dayjs(node.endTime).format(timeFormat)})</span>
        </div>
      </>
    }
  }

  return (
    <>
      {
        isPopoverShow && <Popover
          open={isPopoverShow}
          content={popoverContent}
          overlayClassName="tooltip-style range-progess"
        >
          <TooltipSvgSon x={node.x} y={node.y} />
        </Popover>
      }
      <g
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {
          // 当为360度时,起始和终止坐标重叠,无法确认绘制方向,使用circle
          progress > 0
            ? (progress === 360
              ? <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill="none"
                stroke={`${getProgressColor(progress)}`}
                strokeWidth={DEFAULT_STROKE_WIDTH + 1}
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
          : <circle
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill="none"
            stroke="transparent"
            strokeWidth={DEFAULT_STROKE_WIDTH}
          />
        }
      </g>
    </>
  )
});