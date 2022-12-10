// 该组件用于展示在与svg交互时需展示的控件
import { useEffect, useRef, useState } from "react";
import { Menu, MenuItem } from "../../../../components/menu";
import eventChannel from "../../../../utils/event";
import { PLAIN_NODE_DEFAULT_SIZE } from "../../../../constants/geometry";
import {
  NODE_ADD_CHILD,
  NODE_RIGHT_CLICK
} from "../../../../constants/event";
import style from "./style.module.css";

export default function CanvasMenu({ map }) {
  const container = useRef(null);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [nodeRightInfo, setNodeRightInfo] = useState({ x: 0, y: 0, id: ""});

  useEffect(() => {
    eventChannel.on(NODE_RIGHT_CLICK, onNodeRightClick);
    return (() => {
      eventChannel.removeListener(NODE_RIGHT_CLICK, onNodeRightClick);
    });
  }, []);

  const onNodeRightClick = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setNodeRightInfo({ x: e.clientX, y: e.clientY, id });
    setShowNodeMenu(true);
  };

  const onAddChild = (e, id) => {
    for (let i = 0; i < map.trees.length; i++) {
      let nodes = map.trees[i].nodes;
      for (let j = 0; j < nodes.length; j++) {
        if (nodes[j].id === id) {
          console.log(e.clientX - container.current.offsetLeft, e.clientY - container.current.offsetTop);
          map.trees[i].addNode(id, {
            x: e.clientX - container.current.offsetLeft,
            y: e.clientY - container.current.offsetTop,
            r: PLAIN_NODE_DEFAULT_SIZE,
          });
          eventChannel.emit(NODE_ADD_CHILD, e, id);
        }
      }
    }
  };

  return (
    <div className={style.mainContainer} ref={container}>
      <Menu show={showNodeMenu} setShow={setShowNodeMenu} x={nodeRightInfo.x} y={nodeRightInfo.y}>
        <MenuItem key="add-child" onClick={e => onAddChild(e, nodeRightInfo.id)}>
          添加子节点
        </MenuItem>
        <MenuItem key="delete">
          删除
        </MenuItem>
        <MenuItem key="comment">
          备注
        </MenuItem>
      </Menu>
    </div>
  )
};