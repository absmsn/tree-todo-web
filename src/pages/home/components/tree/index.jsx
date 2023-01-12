import { useContext, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Add_PRECURSOR_TASK } from "../../../../constants/event";
import Edge from "../edge";
import Node from "../circle-node";
import ConditionLink from "../condition-link";
import { 
  isParentOfAnother,
  whichNodeIsPointIn,
  getQuaraticBezierControlPoint
} from "../../../../utils/graph";
import { DarkModeContext } from "../../../../App";
import eventChannel from "../../../../utils/event";
import style from "./index.module.css";

const initialPos = {x: 0, y: 0};

export default observer(function Tree({ map, tree, coordination, svgRef }) {
  const gRef = useRef(null);
  const {on: dark} = useContext(DarkModeContext);
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
            if (target && !node.precursors.includes(target)) {
              // 两个节点不能是父子节点关系，否则没有意义
              if (isParentOfAnother(target, node) || isParentOfAnother(node, target)) {
                return;
              }
              node.addPrecursor(target);
              setIsAddPreShow(false);
              removeListeners();
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
    eventChannel.on(Add_PRECURSOR_TASK, startMove);
    return (() => {
      eventChannel.off(Add_PRECURSOR_TASK, startMove);
    });
  }, []);

  const precursors = [];
  for (let i = 0; i < tree.nodes.length; i++) {
    const node = tree.nodes[i], peers = node.precursors;
    for (let j = 0; j < peers.length; j++) {
      precursors.push(<ConditionLink
        tree={tree}
        source={node}
        target={peers[j]}
        key={`${node.id}-${peers[j].id}`}
      />);
    }
  }

  return (
    <g ref={gRef}>
      {precursors}
      {
        isAddPreShow && <path
          d={`M ${startPoint.x} ${startPoint.y} Q ${controlPos.x} ${controlPos.y} ${endPoint.x} ${endPoint.y}`}
          className={style.AddPrePath}
        >
        </path>
      }
      {
        tree.edges.map(edge =>
          <Edge edge={edge} key={edge.id} />
        )
      }
      {
        tree.nodes.map(node =>
          <Node
            map={map}
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