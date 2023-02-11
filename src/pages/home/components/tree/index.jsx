import { useContext, useEffect, useState } from "react";
import { observer } from "mobx-react";
import Edge from "../edge";
import Node from "../circle-node";
import ConditionLink from "../condition-link";
import { 
  isParentOfAnother,
  whichNodeIsPointIn,
  getQuaraticBezierControlPoint
} from "../../../../utils/graph";
import { isWrapped } from "../../../../utils/node";
import { Add_CONDITION_TASK } from "../../../../constants/event";
import { DarkModeContext } from "../../../main";
import eventChannel from "../../../../utils/event";
import nodeAPI from "../../../../apis/node";
import style from "./index.module.css";

const initialPos = {x: 0, y: 0};

const AddPath = observer(({map, tree, svgRef}) => {
  const [isAddPreShow, setIsAddPreShow] = useState(false);
  const [startPoint, setStartPoint] = useState(initialPos);
  const [endPoint, setEndPoint] = useState(initialPos);
  const [controlPos, setControlPos] = useState(initialPos);

  useEffect(() => {
    const startMove = (mapID, node, e) => {
      if (mapID === map.id) {
        setIsAddPreShow(true);
        const start = {x: node.x, y: node.y}, end = map.coordination.clientToSvg(e.clientX, e.clientY);
        setStartPoint(start);
        setControlPos(getQuaraticBezierControlPoint(start, end, tree.root));
        setEndPoint(end);
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
            if (target && !node.conditions.find(p => p.target === target)) {
              // 两个节点不能是父子节点关系，否则没有意义
              if (isParentOfAnother(target, node) || isParentOfAnother(node, target)) {
                return;
              }
              // 不允许双向连接,即已有a->b,想要添加b->a的情况
              if (target.conditions.find(p => p.target === node)) {
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
  const {on: dark} = useContext(DarkModeContext);

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