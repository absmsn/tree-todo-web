import { useContext, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { App as AntdApp } from "antd";
import Edge from "../edge";
import Node from "../circle-node";
import ConditionLink from "../condition-link";
import {
  isParentOfAnother,
  whichNodeIsPointIn,
  getQuaraticBezierControlPoint
} from "../../../../utils/graph";
import { getPosRelatedNode, isWrapped } from "../../../../utils/node";
import { Add_CONDITION_TASK, DRAG_TAG_END } from "../../../../constants/event";
import { DarkModeContext } from "../../../main";
import eventChannel from "../../../../utils/event";
import nodeAPI from "../../../../apis/node";
import style from "./index.module.css";

const initialPos = { x: 0, y: 0 };

const AddPath = observer(({ map, tree, svgRef }) => {
  const [isAddPreShow, setIsAddPreShow] = useState(false);
  const [startPoint, setStartPoint] = useState(initialPos);
  const [endPoint, setEndPoint] = useState(initialPos);
  const [controlPos, setControlPos] = useState(initialPos);
  const { message } = AntdApp.useApp();

  useEffect(() => {
    const startMove = (mapID, node, e) => {
      if (mapID === map.id) {
        setIsAddPreShow(true);
        const start = { x: node.x, y: node.y }, end = map.coordination.clientToSvg(e.clientX, e.clientY);
        setStartPoint(start);
        setControlPos(getQuaraticBezierControlPoint(start, end, tree.root));
        setEndPoint(end);
        message.info("点击你要连接到的节点,按下ESC键以取消。");
        const moving = e => {
          const end = map.coordination.clientToSvg(e.clientX, e.clientY);
          setEndPoint(end);
          // 寻找两个节点的公共父节点计算量比较大，使用根节点来替代
          setControlPos(getQuaraticBezierControlPoint(start, end, tree.root));
        }
        const mousedown = e => {
          const point = map.coordination.clientToSvg(e.clientX, e.clientY);
          if (point) {
            const target = whichNodeIsPointIn(tree, point.x, point.y);
            if (target) {
              if (node.conditions.find(p => p.target === target)) {
                message.error("不能添加重复连接！");
                return;
              }
              if (target === node) {
                message.error("不能与自己相连！");
                return;
              }
              // 两个节点不能是父子节点关系，否则没有意义
              if (isParentOfAnother(target, node) || isParentOfAnother(node, target)) {
                message.error("不能与父节点或子节点相连！");
                return;
              }
              // 不允许双向连接,即已有a->b,想要添加b->a的情况
              if (target.conditions.find(p => p.target === node)) {
                message.error("只允许添加一个方向的连接！");
                return;
              }
              node.addCondition(target);
              setIsAddPreShow(false);
              removeListeners();
              nodeAPI.addCondition(node.id, target.id, "");
            }
          }
        }
        const keydown = e => {
          if (e.key === "Esc" || e.key === "Escape") {
            setIsAddPreShow(false);
            removeListeners();
          }
        }
        const removeListeners = () => {
          svgRef.current.removeEventListener("mousemove", moving);
          svgRef.current.removeEventListener("mousedown", mousedown);
          window.removeEventListener("keydown", keydown);
        }
        svgRef.current.addEventListener("mousemove", moving);
        svgRef.current.addEventListener("mousedown", mousedown);
        window.addEventListener("keydown", keydown);
      }
    }
    eventChannel.on(Add_CONDITION_TASK, startMove);
    return (() => {
      eventChannel.off(Add_CONDITION_TASK, startMove);
    });
  }, []);

  return (
    isAddPreShow && <path
      d={`M ${startPoint.x} ${startPoint.y} Q ${controlPos.x} ${controlPos.y} ${endPoint.x} ${endPoint.y}`}
      className={style.AddPrePath}
    >
    </path>
  )
});

export default observer(function Tree({ map, tree, coordination, svgRef }) {
  const { on: dark } = useContext(DarkModeContext);

  const conditions = [];
  for (let i = 0; i < tree.nodes.length; i++) {
    const node = tree.nodes[i], peers = node.conditions;
    for (let j = 0; j < peers.length; j++) {
      const target = peers[j].target;
      if (!isWrapped(node) && !isWrapped(target)) {
        conditions.push(<ConditionLink
          map={map}
          source={node}
          target={target}
          condition={peers[j]}
          key={`${node.id}-${target.id}`}
        />);
      }
    }
  }

  useEffect(() => {
    const onDragTagEnd = (mapID, tag, e) => {
      if (mapID === map.id) {
        const node = getPosRelatedNode(map, e.clientX, e.clientY);
        if (node && !node.tags.includes(tag)) {
          node.addTag(tag);
        }
      }
    }
    eventChannel.on(DRAG_TAG_END, onDragTagEnd);
    return () => {
      eventChannel.off(DRAG_TAG_END, onDragTagEnd);
    };
  }, []);

  const edges = tree.edges.filter(edge => !edge.source.childrenWrapped);

  const nodes = tree.nodes.filter(node => !isWrapped(node));

  return (
    <g>
      {conditions}
      {
        <AddPath
          map={map}
          tree={tree}
          svgRef={svgRef}
        />
      }
      {
        edges.map(edge =>
          <Edge
            edge={edge}
            key={edge.id}
          />
        )
      }
      {
        nodes.map(node =>
          <Node
            node={node}
            tree={tree}
            dark={dark}
            key={node.id}
            coordination={coordination}
          />
        )
      }
    </g>
  )
});