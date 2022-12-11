// 该组件用于展示在与svg交互时需展示的控件
import { useEffect, useRef, useState } from "react";
import { Menu, MenuItem } from "../../../../components/menu";
import { PLAIN_NODE_DEFAULT_SIZE } from "../../../../constants/geometry";
import { NODE_ADD_CHILD } from "../../../../constants/event";
import eventChannel from "../../../../utils/event";

export default function NodeMenu({
  node,
  tree,
  x,
  y,
  isMenuShow, 
  setIsMenuShow
}) {
  const container = useRef(null);

  const onAddChild = e => {
    tree.addNode(node.id, {
      x: e.clientX,
      y: e.clientY,
      r: PLAIN_NODE_DEFAULT_SIZE,
    });
    eventChannel.emit(NODE_ADD_CHILD, tree.id);
  };

  return (
    <Menu show={isMenuShow} setShow={setIsMenuShow} x={x} y={y}>
      <MenuItem key="add-child" onClick={onAddChild}>
        添加子节点
      </MenuItem>
      <MenuItem key="delete">
        删除
      </MenuItem>
      <MenuItem key="comment">
        备注
      </MenuItem>
    </Menu>
  )
};