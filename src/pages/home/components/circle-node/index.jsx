import { useState, useEffect, useRef, useContext } from "react";
import { observer } from "mobx-react";
import NodeMenu from "../node-menu";
import NodeTags from "../node-tags";
import NodeComment from "../node-comment";
import ConfigPopover from "../config-popover";
import AddTagPopover from "../add-tag-popover";
import DeadlineRemind from "../deadline-remind";
import { TodayContext } from "../../../../App";
import { MILLSECONDS_PER_DAY } from "../../../../constants/number";
import { DEFAULT_THIN_STROKE_WIDTH } from "../../../../constants/geometry";
import { reArrangeTree } from "../../../../utils/graph";
import style from "./index.module.css";

const initialPos = {x: 0, y: 0};

export default observer(function CircleNode({ map, node, tree, coordination, dark }) {
  const inputRef = useRef(null);
  const nodeAreaRef = useRef(null);
  const prevMousePos = useRef(initialPos);
  const today = useContext(TodayContext);
  const [menuPos, setMenuPos] = useState(initialPos);
  const [nearDeadline, setNearDeadline] = useState(false);
  const [isMenuShow, setIsMenuShow] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  const [isAddTagShow, setIsAddTagShow] = useState(false);
  const [isCommentShow, setIsCommentShow] = useState(false);
  const [isTitleInputShow, setIsTitleInputShow] = useState(false);
  const [configPopoverShow, setConfigPopoverShow] = useState(true);
  const [foreignSize, setForeignSize] = useState({width: node.r * 2, height: 0});

  let inputLength = node.r * 2, nodeCommentView = null;
  if (isCommentShow) {
    // 节点的中心位置在client中的坐标
    const nodeClientPos = coordination.svgToClient(node.x, node.y);
    nodeCommentView = <NodeComment
      node={node}
      show={isCommentShow}
      x={nodeClientPos.x}
      y={nodeClientPos.y}
      setIsCommentShow={setIsCommentShow}
    />
  }

  // 高亮显示当天要完成的任务
  useEffect(() => {
    // 设置为完成状态,此时要取消高亮效果
    if (node.finished) {
      return setNearDeadline(false);
    }
    // 设置了终止日期,终止日期在今天,并且任务还未过期
    const deadlineMs = node.endTime?.getTime(), now = Date.now();
    if (node.endTime && (deadlineMs - today.getTime()) < MILLSECONDS_PER_DAY && (deadlineMs >= now)) {
      setNearDeadline(true);
      const timer = setTimeout(() => setNearDeadline(false), deadlineMs - now); // 到期的时候取消闪烁
      return (() => {
        clearTimeout(timer);
      });
    }
  }, [node.endTime, node.finished, today]);

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
          node.setTitle(inputRef.current.value);
          setIsTitleInputShow(false);
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
        setIsTitleInputShow(false);
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

  const onContextMenu = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!isMenuShow) {
      setIsMenuShow(true);
      setMenuPos({
        x: e.clientX,
        y: e.clientY
      });
    }
  }
 
  return (
    <g className={`${dark ? style.dark : ""}`}>
      <g
        ref={nodeAreaRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onContextMenu={onContextMenu}
        className={`${nearDeadline ? style.nearDeadline : ""}`}
        style={{cursor: isMouseDown ? "grabbing" : ""}}
      >
        <circle
          cx={node.x}
          cy={node.y}
          r={node.r}
          stroke={node.stroke}
          strokeWidth={node.strokeWidth}
          className={`${style.contentCircle} ${node.finished ? style.finished : style.unfinished}`}
        />
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
      </g>
      {
        configPopoverShow && <ConfigPopover
          node={node}
          show={configPopoverShow}
          setShow={setConfigPopoverShow}
        />
      }
      {
        isAddTagShow && <AddTagPopover
          map={map}
          node={node}
          show={isAddTagShow}
          setShow={setIsAddTagShow}
        />
      }
      {
        isTitleInputShow && <foreignObject
          x={node.x}
          y={node.y}
          width={foreignSize.width}
          height={foreignSize.height}
          transform={`translate(${-foreignSize.width / 2} ${-foreignSize.height / 2})`}
        >
          <input 
            ref={inputRef}
            value={node.title}
            style={{ width: inputLength }}
            onChange={e => node.setTitle(e.target.value)}
          />
        </foreignObject>
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
      {
        nodeCommentView
      }
      {
        isMenuShow && <NodeMenu
          x={menuPos.x}
          y={menuPos.y}
          map={map}
          node={node}
          tree={tree}
          isMenuShow={isMenuShow}
          setIsMenuShow={setIsMenuShow}
          setIsAddTagShow={setIsAddTagShow}
          setIsCommentShow={setIsCommentShow}
          setConfigPopoverShow={setConfigPopoverShow}
        />
      }
    </g>
  )
});