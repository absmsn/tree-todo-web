import { Dropdown } from "antd";
import { observer } from "mobx-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DoubleLeftOutlined, DoubleRightOutlined } from "@ant-design/icons";
import { DAY_UNIT_HEIGHT } from "../../constant";
import { MILLSECONDS_PER_DAY } from "../../../../constants/number";
import { getIntervalDaysIncludingStart, getIntervalDaysIncludingStartEnd } from "../../util";
import { Resizable } from "re-resizable";
import { useSyncProp, useThrottle } from "../../../../hooks";
import style from "./index.module.css";

const taskMenuItems = [
  { key: "treeLocate", label: "在任务树中定位" },
  { key: "last", label: "上一个" },
  { key: "next", label: "下一个" }
];

const initialMousePos = {x: 0, y: 0};

const resizeEnable = {
  top: true,
  bottom: true
};

export default observer(({ map, task, firstTask, containerStyle, defaultBehind, descend }) => {
  const stripRef = useRef(null);
  const dragFrameRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [behind, setBehind] = useSyncProp(defaultBehind);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startTime, setStartTime] = useState(task.startTime);
  const [endTime, setEndTime] = useState(task.endTime);
  const prevMousePos = useRef(initialMousePos);
  const daysStartEnd = useMemo(() => {
    return Math.abs(getIntervalDaysIncludingStartEnd(startTime, endTime));
  }, [startTime, endTime, descend]); // 起始时间和终止时间的间隔，包括起始终止两天

  const onMenuClick = ({key}) => {
    switch(key) {
      case "treeLocate":
        map.tree.setSelectedNode(task);
      default:
        break;
    }
  }

  useEffect(() => {
    if (startTime.getTime() !== task.startTime.getTime()) {
      setStartTime(new Date(task.startTime));
    }
    if (endTime.getTime() !== task.endTime.getTime()) {
      setEndTime(new Date(task.endTime));
    }
  }, [task.startTime, task.endTime]);

  const onMouseDown = e => {
    setIsMouseDown(true);
    prevMousePos.current.x = e.clientX;
    prevMousePos.current.y = e.clientY;
  }

  const onMouseMove = useThrottle(e => {
    if (isMouseDown) {
      const offset = dragFrameRef.current.offsetTop; // drag容器离父容器的距离
      dragFrameRef.current.style.top = (offset + e.clientY - prevMousePos.current.y) + "px";
      prevMousePos.current.x = e.clientX;
      prevMousePos.current.y = e.clientY;
      if (Math.abs(offset) >= DAY_UNIT_HEIGHT) {
        const offsetMs = Math.floor(Math.abs(offset) / DAY_UNIT_HEIGHT) * Math.sign(offset) * MILLSECONDS_PER_DAY;
        setStartTime(new Date(startTime.getTime() + (descend ? -1 : 1) * offsetMs));
        setEndTime(new Date(endTime.getTime() + (descend ? -1 : 1) * offsetMs));
        dragFrameRef.current.style.top = (offset - DAY_UNIT_HEIGHT * Math.sign(offset)) + "px";
      }
    }
  }, 80, [startTime, endTime]);

  const releasePointer = () => {
    setIsMouseDown(false);
    task.setStartTime(startTime);
    task.setEndTime(endTime);
    dragFrameRef.current.style.top = 0;
  }

  const onMouseUp = () => {
    if (isMouseDown) {
      releasePointer();
    }
  }

  const onMouseLeave = () => {
    if (isMouseDown) {
      releasePointer();
    }
  }

  const onStretchStart = (e) => {
    prevMousePos.current.x = e.clientX;
    prevMousePos.current.y = e.clientY;
  }

  const onStretch = (e, direction) => {
    const offset = e.clientY - prevMousePos.current.y;
    if (Math.abs(offset) >= DAY_UNIT_HEIGHT) {
      const offsetMs = Math.floor(Math.abs(offset) / DAY_UNIT_HEIGHT) * Math.sign(offset) * MILLSECONDS_PER_DAY;
      if (direction === "top") {
        if (descend) {
          setEndTime(new Date(endTime.getTime() - offsetMs));
        } else {
          setStartTime(new Date(startTime.getTime() + offsetMs));
        }
      } else if (direction === "bottom") {
        if (descend) {
          setStartTime(new Date(startTime.getTime() - offsetMs));
        } else {
          setEndTime(new Date(endTime.getTime() + offsetMs));
        }
      }
      prevMousePos.current.x = e.clientX;
      prevMousePos.current.y = e.clientY;
    }
  }

  const onStretchStop = () => {
    task.setStartTime(startTime);
    task.setEndTime(endTime);
  }

  let dateView;
  if (!behind) {
    if (daysStartEnd > 1) {
      if (descend) {
        dateView = <>
          <div className={`${style.topTime} ${style.dimmedSmall}`}>
            {endTime.toLocaleDateString()}
          </div>
          <div className={`${style.bottomTime} ${style.dimmedSmall}`}>
            {startTime.toLocaleDateString()}
          </div>
        </>
      } else {
        dateView = <>
          <div className={`${style.topTime} ${style.dimmedSmall}`}>
            {startTime.toLocaleDateString()}
          </div>
          <div className={`${style.bottomTime} ${style.dimmedSmall}`}>
            {endTime.toLocaleDateString()}
          </div>
        </>
      }
    } else {
      dateView = <div className={`${style.topTime} ${style.sole} ${style.dimmedSmall}`}>
        {startTime.toLocaleDateString()}
      </div>
    }
  }

  return (
    <div
      className={`${style.mainContainer} ${behind ? style.behind : ""}`}
      style={{
        top: (descend ? getIntervalDaysIncludingStart(endTime, firstTask.endTime) : getIntervalDaysIncludingStart(firstTask.startTime, startTime)) * DAY_UNIT_HEIGHT,
        ...containerStyle
      }}
    >
      <Dropdown 
        trigger={"contextMenu"}
        menu={{items: taskMenuItems, onClick: onMenuClick}}
      >
        <Resizable
          enable={resizeEnable}
          onResizeStart={onStretchStart}
          onResize={onStretch}
          onResizeStop={onStretchStop}
          size={{ height: daysStartEnd * DAY_UNIT_HEIGHT }}
        >
          <div 
            ref={stripRef}
            className={`${style.taskStrip} ${task.finished ? style.finished : style.unfinished}`}
            style={{
              height: daysStartEnd * DAY_UNIT_HEIGHT,
              cursor: isMouseDown ? "move" : ""
            }}
          >
            <div
              ref={dragFrameRef}
              className={style.dragFrame}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onMouseMove={onMouseMove}
              onMouseLeave={onMouseLeave}
            >
            </div>
            {dateView}
          </div>
        </Resizable>
      </Dropdown>
      <div className={style.connectLine}></div>
      <div className={`${style.taskInfo} ${expanded ? "" : style.wrapped}`}>
        {
          expanded 
            ? <DoubleRightOutlined
              className={style.expandIcon}
              onClick={() => setExpanded(false)}
            />
            : <DoubleLeftOutlined 
              className={style.expandIcon}
              onClick={() => setExpanded(true)}
            />
        }
        <div className={style.title}>
          <div>{task.title}</div>
        </div>
        <div className={`${style.dimmedSmall} ${style.comment}`}>
          <div title={task.comment ? task.comment : "无"}>
            {task.comment ? task.comment : "无"}
          </div>
        </div>
        <div className={style.time}>
          <span className={style.timeLabel}>起始时间:</span>
          <div className={style.dimmedSmall}>
            {task.startTime.toLocaleDateString()} {task.startTime.toLocaleTimeString()}
          </div>
        </div>
        <div className={style.time}>
          <span className={style.timeLabel}>结束时间:</span>
          <div className={style.dimmedSmall}>
            {task.endTime.toLocaleDateString()} {task.endTime.toLocaleTimeString()}
          </div>
        </div>              
      </div>
    </div>
  )
});