import { useState, useEffect, useRef, useContext } from "react";
import { observer } from "mobx-react";
import { Space, Tooltip, App as AntdAppConfig } from "antd";
import { PlusSquareOutlined } from "@ant-design/icons";
import Priority from "../priority";
import NodeTags from "../node-tags";
import RangeProgress from "../range-progress";
import DeadlineRemind from "../deadline-remind";
import { TodayContext } from "../../../main";
import { MILLSECONDS_PER_DAY } from "../../../../constants/number";
import { DEFAULT_THIN_STROKE_WIDTH } from "../../../../constants/geometry";
import { toHourMinute, timer } from "../../../../utils/time";
import { 
  expandChildren,
  getRepeatPattern,
  markAsFinished,
  markAsUnfinished
} from "../../../../utils/node";
import { reArrangeTree } from "../../../../utils/graph";
import nodeAPI from "../../../../apis/node";
import { Howl } from "howler";
import style from "./index.module.css";

const initialPos = { x: 0, y: 0 };

// 在执行重复任务任务时,根据当前时间获取下一个周期的起始时间和终止时间
const getNextLoop = (startTime, endTime, repeat) => {
  let {month, day, hour, minute} = getRepeatPattern(repeat);
  if (!month && !day && !hour && !minute) {
    throw Error();
  }
  const start = new Date(startTime), now = Date.now(), duration = endTime.getTime() - startTime.getTime();
  if (now <= endTime.getTime()) {
    start.setMonth(start.getMonth() + month);
    start.setDate(start.getDate() + day);
    start.setHours(start.getHours() + hour, start.getMinutes() + minute);
  } else { // 已经超时,需要找到当前所在的周期内
    while (start.getTime() < now) {
      if (month > 0) {
        start.setMonth(start.getMonth() + month);
      }
      if (day > 0) {
        start.setDate(start.getDate() + day);
      }
      if (hour > 0) {
        start.setHours(start.getHours() + hour);
      }
      if (minute > 0) {
        start.setMinutes(start.getMinutes() + minute);
      }
    }
  }
  return [
    start,
    new Date(start.getTime() + duration)
  ];
}

const stopPropagation = e => {
  e.stopPropagation();
  return false;
};

const BackgroundImage = observer(({node}) => {
  return (
    <>
      <defs>
        <clipPath id={`bg-${node.id}`}>
          <circle cx={node.x} cy={node.y} r={node.r} />
        </clipPath>
      </defs>
      <image
        href={node.backgroundImageURL}
        x={node.x - node.r}
        y={node.y - node.r}
        height={node.r * 2}
        width={node.r * 2}
        clipPath={`url(#bg-${node.id})`}
      />
    </>
  )
});

// 折叠和展开子节点的按钮
const WrapExtendIcon = observer(({tree, node}) => {
  return <foreignObject
    x={node.x - node.r - 8}
    y={node.y - node.r - 8}
    width={16}
    height={16}
  >
    <PlusSquareOutlined
      className="foreign-antd-icon"
      onClick={() => expandChildren(tree, node)}
      style={{backgroundColor: "var(--bgColor)"}}
    />
  </foreignObject>
});

const TitleInput = observer(({ node, isTitleInputShow, setIsTitleInputShow }) => {
  const inputRef = useRef(null);
  const [title, setTitle] = useState(node.title);
  const [foreignSize, setForeignSize] = useState({ width: node.r * 2, height: 0 });
  const inputLength = node.r * 2;

  useEffect(() => {
    if (isTitleInputShow) {
      setForeignSize({
        width: inputRef.current.offsetWidth,
        height: inputRef.current.offsetHeight
      });
      inputRef.current.select();
      const onKeyUp = e => {
        // 输入回车，关闭输入框
        if (e.key === "Enter") {
          node.setTitle(inputRef.current.value); // 没有将title加入依赖数组，直接使用输入框内的值
          setIsTitleInputShow(false);
          nodeAPI.edit(node.id, {
            title: node.title
          });
        }
      }
      document.addEventListener("keyup", onKeyUp);
      return (() => {
        document.removeEventListener("keyup", onKeyUp);
      });
    }
  }, [isTitleInputShow]);

  // blur事件会在菜单点击后直接触发，会导致输入框直接关闭，因此使用mousedown事件替代
  useEffect(() => {
    const onBlur = e => {
      if (isTitleInputShow && e.target !== inputRef.current) {
        node.setTitle(inputRef.current.value);
        setIsTitleInputShow(false);
        nodeAPI.edit(node.id, {
          title: node.title
        });
      }
    };
    if (isTitleInputShow) {
      document.addEventListener("mousedown", onBlur);
    }
    return (() => {
      if (isTitleInputShow) {
        document.removeEventListener("mousedown", onBlur);
      }
    });
  }, [isTitleInputShow]);

  return (
    <foreignObject
      x={node.x}
      y={node.y}
      width={foreignSize.width}
      height={foreignSize.height}
      transform={`translate(${-foreignSize.width / 2} ${-foreignSize.height / 2})`}
    >
      <input
        ref={inputRef}
        value={title}
        style={{ width: inputLength }}
        onChange={e => setTitle(e.target.value)}
      />
    </foreignObject>
  )
});

export default observer(({ node, tree, coordination, dark }) => {
  const nodeAreaRef = useRef(null);
  const prevMousePos = useRef(initialPos);
  const today = useContext(TodayContext);
  const [nearDeadline, setNearDeadline] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  const [isTitleInputShow, setIsTitleInputShow] = useState(false);
  const { notification, message } = AntdAppConfig.useApp();

  // 高亮显示当天要完成的任务
  useEffect(() => {
    // 设置为完成状态,此时要取消高亮效果
    if (node.finished) {
      return setNearDeadline(false);
    }
    // 设置了终止日期,终止日期在今天,并且任务还未过期
    const deadlineMs = node.endTime?.getTime(), now = Date.now();
    if (node.endTime && ((deadlineMs - today.getTime()) < MILLSECONDS_PER_DAY) && (deadlineMs >= now)) {
      setNearDeadline(true);
      const timer = setTimeout(() => {
        setNearDeadline(false);
        notification.info({
          message: "任务过期",
          description: <>
            <div className="mb-2">任务{node.title}于{toHourMinute(node.endTime)}到期</div>
            <Space size={12}>
              <a onClick={() => tree.setSelectedNode(node)}>定位</a>
              {
                !node.finished && <a
                  onClick={() => !node.finished && markAsFinished(node)}>标记为已完成</a>
              }
            </Space>
          </>,
          duration: 30
        });
        const sound = new Howl({
          src: ["/audios/expired.mp3"]
        });
        sound.play();
      }, deadlineMs - now); // 到期的时候取消闪烁
      return (() => {
        clearTimeout(timer);
      });
    }
  }, [node.endTime, node.finished, today]);

  // 到期后自动设置为完成
  useEffect(() => {
    if (node.autoFinish && node.endTime) {
      const duration = node.endTime.getTime() - Date.now();
      if (duration >= 0) {
        const timerId = timer.setTimeout(async () => {
          await markAsFinished(node);
          message.success(<span>任务{node.title}已自动设置为完成!</span>);
        }, duration);
        return (() => {
          timer.clearTimeout(timerId);
        });
      }
    }
  }, [node.autoFinish, node.endTime]);

  useEffect(() => {
    if (node.startTime, node.endTime && node.autoFinish && node.repeat) {
      let setRangeTimerId, setFinishTimerId;
      const tick = () => {
        const [nextStart, nextEnd] = getNextLoop(node.startTime, node.endTime, node.repeat);
        // 达到结束时间则自动向后延期
        // 还有多长时间结束,如果已经结束则立即执行
        const deadlineDuration = Math.max(nextStart.getTime() - Date.now(), 0);
        setRangeTimerId = timer.setTimeout(() => {
          node.setStartTime(nextStart);
          node.setEndTime(nextEnd);
          const duration = Math.max(nextStart.getTime() - Date.now(), 0);
          setFinishTimerId = timer.setTimeout(() => {
            // 在新一轮开始时,如果已经完成,则要设置为未完成
            if (node.finished) {
              markAsUnfinished(node);
            }
          }, duration);
          message.success(<span>任务{node.title}已开始下一次循环!</span>);
          tick();
        }, deadlineDuration);
      }
      tick();
      return (() => {
        setRangeTimerId && timer.clearTimeout(setRangeTimerId);
        setFinishTimerId && timer.clearTimeout(setFinishTimerId);
      });
    }
  }, [node.startTime, node.endTime, node.autoFinish, node.repeat]);

  const onMouseDown = e => {
    if (e.button === 0) {
      e.stopPropagation();
      // 取消选中之前选中的节点，选中当前节点
      if (tree.selectedNode !== node) {
        tree.setSelectedNode(node);
      }
      setIsMouseDown(true);
      prevMousePos.current.x = e.clientX;
      prevMousePos.current.y = e.clientY;
    }
  }

  const onMouseMove = e => {
    if (isMouseDown && e.button === 0) {
      e.stopPropagation();
      if (e.ctrlKey || e.metaKey) {
        node.setPosition(
          node.x + (e.clientX - prevMousePos.current.x) * coordination.scale,
          node.y + (e.clientY - prevMousePos.current.y) * coordination.scale
        );
      } else {
        let stack = [node];
        while (stack.length > 0) {
          const node = stack.pop();
          node.setPosition(
            node.x + (e.clientX - prevMousePos.current.x) * coordination.scale,
            node.y + (e.clientY - prevMousePos.current.y) * coordination.scale
          );
          for (let i = 0; i < node.children.length; i++) {
            stack.push(node.children[i]);
          }
        }
      }
      prevMousePos.current.x = e.clientX;
      prevMousePos.current.y = e.clientY;
      if (!isMouseMoving) {
        setIsMouseMoving(true);
      }
    }
  }

  const onMouseUp = async e => {
    if (e.button === 0) {
      e.stopPropagation();
      if (isMouseDown) {
        setIsMouseDown(false);
        // 正在移动中且移动的节点不是根节点时，调整坐标
        if (isMouseMoving && node.parent) {
          await reArrangeTree(tree);
        }
        setIsMouseMoving(false);
      }
      if (!isTitleInputShow && e.detail === 2) { // 双击
        setIsTitleInputShow(true);
      }
    }
  }

  const onMouseLeave = e => {
    e.stopPropagation();
    if (isMouseDown) {
      setIsMouseDown(false);
    }
  }

  const circleAndText = <g>
    <circle
      cx={node.x}
      cy={node.y}
      r={node.r}
      stroke={node.stroke}
      strokeWidth={node.strokeWidth}
      className={`${style.contentCircle} ${node.backgroundImageURL && style.mask} ${node.finished ? style.finished : style.unfinished}`}
    />
    <text
      x={node.x}
      y={node.y}
      dominantBaseline="middle"
      textDecoration={node.finished ? "line-through" : ""}
      className={style.contentText}
    >
      {node.title}
    </text>
  </g>

  return (
    <g
      className={`${dark ? style.dark : ""}`}
      onContextMenu={stopPropagation}
    >
      <g
        ref={nodeAreaRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        className={`${nearDeadline && style.nearDeadline} ${isMouseDown && "cursor-grabbing"}`}
      >
        {
          node.backgroundImageURL && <BackgroundImage node={node} />
        }
        {
          node.comment
            ? <Tooltip
              title={node.comment}
              placement="right"
              overlayClassName="tooltip-style"
            >
              {circleAndText}
            </Tooltip>
            : circleAndText
        }
        {
          node.selected && <circle
            cx={node.x}
            cy={node.y}
            stroke={node.stroke}
            r={node.r + node.strokeWidth + 4}
            strokeWidth={DEFAULT_THIN_STROKE_WIDTH}
            className={style.emphasizeCircle}
          />
        }
      </g>
      {
        !!node.priority && <Priority node={node} />
      }
      {
        node.childrenWrapped && <WrapExtendIcon
          tree={tree}
          node={node} 
        />
      }
      {
        node.endTime && <RangeProgress node={node} />
      }
      {
        isTitleInputShow && <TitleInput
          node={node}
          isTitleInputShow={isTitleInputShow}
          setIsTitleInputShow={setIsTitleInputShow}
        />
      }
      {
        node.tags.length > 0 && <NodeTags
          node={node}
          tags={node.tags}
        />
      }
      {
        nearDeadline && <DeadlineRemind
          node={node}
          setNearDeadline={setNearDeadline}
        />
      }
    </g>
  )
});