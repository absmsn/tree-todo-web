import { useState, useEffect, useRef, useContext } from "react";
import { observer } from "mobx-react";
import { notification, Space, Tooltip } from "antd";
import Priority from "../priority";
import NodeTags from "../node-tags";
import RangeProgress from "../range-progress";
import DeadlineRemind from "../deadline-remind";
import { TodayContext } from "../../../../App";
import { MILLSECONDS_PER_DAY } from "../../../../constants/number";
import { DEFAULT_THIN_STROKE_WIDTH } from "../../../../constants/geometry";
import { reArrangeTree } from "../../../../utils/graph";
import { toHourMinute } from "../../../../utils/time";
import nodeAPI from "../../../../apis/node";
import { timer } from "../../../../utils/time";
import dayjs from "dayjs";
import { Howl } from "howler";
import style from "./index.module.css";

const initialPos = {x: 0, y: 0};

const stopPropagation = e => e.stopPropagation();

const TitleInput = observer(({node, isTitleInputShow, setIsTitleInputShow}) => {
  const inputRef = useRef(null);
  const [title, setTitle] = useState(node.title);
  const [foreignSize, setForeignSize] = useState({width: node.r * 2, height: 0});
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
  const [notificationApi, notificationContext] = notification.useNotification();

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
        notificationApi.info({
          message: "任务过期",
          description: <>
            <div>任务{node.title}于{toHourMinute(node.endTime)}到期</div>
            <Space>
              <a>定位</a>
              <a>标记为已完成</a>
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
 
  return (
    <g
      className={`${dark ? style.dark : ""}`}
      onContextMenu={stopPropagation}
    >
      {notificationContext}
      <g
        ref={nodeAreaRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        className={`${nearDeadline ? style.nearDeadline : ""}`}
        style={{cursor: isMouseDown ? "grabbing" : ""}}
      >
        {
          node.backgroundImageURL && <>
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
        }
        <Tooltip
          title={node.comment} 
          placement="right"
          className="tooltip-style"
        >
          <circle
            cx={node.x}
            cy={node.y}
            r={node.r}
            stroke={node.stroke}
            strokeWidth={node.strokeWidth}
            className={`${style.contentCircle} ${node.backgroundImageURL && style.mask} ${node.finished ? style.finished : style.unfinished}`}
          />
        </Tooltip>
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
        <text
          x={node.x}
          y={node.y}
          dominantBaseline="middle"
          textDecoration={node.finished ? "line-through" : ""}
          className={style.contentText}
        >
          {node.title}
        </text>
        {
          node.priority && <Priority node={node} />
        }
      </g>
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