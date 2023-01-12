// 该组件用于展示在与svg交互时需展示的控件
import { useEffect, useRef, useState } from "react";
import { CheckOutlined } from "@ant-design/icons";
import { Menu, MenuItem } from "../../../../components/menu";
import { PLAIN_NODE_DEFAULT_SIZE } from "../../../../constants/geometry";
import { getChildNodePosition, reArrangeTree } from "../../../../utils/graph";
import { Add_PRECURSOR_TASK } from "../../../../constants/event";
import eventChannel from "../../../../utils/event";

const markAsFinished = node => {
  const stack = [node];
  while (stack.length) {
    let n = stack.pop();
    if (!n.finished) {
      n.setFinished(true);
      for(let i = 0; i < n.children.length; i++) {
        if (!n.children[i].finished) {
          stack.push(n.children[i]);
        }
      }
    }
  }
  let n = node;
  while (n.parent) {
    // 检查是否所有兄弟节点都是已完成状态
    let not = n.parent.children.some(d => !d.finished);
    if (not) {
      break;
    }
    n.parent.setFinished(true);
    n = n.parent;
  }
}

const markAsUnfinished = node => {
  const stack = [node];
  while (stack.length) {
    let n = stack.pop();
    if (n.finished) {
      n.setFinished(false);
      for(let i = 0; i < n.children.length; i++) {
        if (n.children[i].finished) {
          stack.push(n.children[i]);
        }
      }
    }
  }
  let n = node;
  while (n.parent) {
    if (!n.parent.finished) {
      break;
    }
    n.parent.setFinished(false);
    n = n.parent;
  }
}

export default function NodeMenu({
  x,
  y,
  map,
  node,
  tree,
  isMenuShow,
  setIsMenuShow,
  setIsAddTagShow,
  setIsCommentShow,
  setConfigPopoverShow
}) {
  const onAddChild = async () => {
    let center = getChildNodePosition(node, PLAIN_NODE_DEFAULT_SIZE);
    tree.addNode(node.id, {
      x: center.x,
      y: center.y,
      r: PLAIN_NODE_DEFAULT_SIZE
    });
    await reArrangeTree(tree);
  };

  const onAddComment = () => {
    setIsCommentShow(true);
  }

  const onRemoveNode = async () => {
    tree.removeNode(node.id);
    await reArrangeTree(tree);
  }

  const onEditConfigClick = () => {
    setConfigPopoverShow(true);
  }

  const onAddTag = () => {
    setIsAddTagShow(true);
  }

  // 通知tree添加一个前驱任务
  const addPrecursorTask = (e) => {
    eventChannel.emit(Add_PRECURSOR_TASK, map.id, node, e);
  }

  return (
    <Menu show={isMenuShow} setShow={setIsMenuShow} x={x} y={y}>
      <MenuItem key="add-child" onClick={onAddChild}>
        添加子节点
      </MenuItem>
      <MenuItem key="edit-config" onClick={onEditConfigClick}>
        编辑配置
      </MenuItem>
      {
        node.parent && <MenuItem key="remove-node" onClick={onRemoveNode}>
          删除节点
        </MenuItem>
      }
      <MenuItem key="comment" onClick={onAddComment}>
        编辑备注
      </MenuItem>
      <MenuItem key="add-tag" onClick={onAddTag}>
        添加标签
      </MenuItem>
      <MenuItem key="add-precursor-task" onClick={addPrecursorTask}>
        作为前置任务
      </MenuItem>
      {
        node.finished
          ? <MenuItem key="mark" onClick={() => markAsUnfinished(node)} right={<CheckOutlined />}>
            标记为未完成
          </MenuItem>
          : <MenuItem key="mark" onClick={() => markAsFinished(node)}>
            标记为已完成
          </MenuItem>
      }
    </Menu>
  )
};