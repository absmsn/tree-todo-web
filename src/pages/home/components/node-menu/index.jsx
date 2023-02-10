// 该组件用于展示在与svg交互时需展示的控件
import { useEffect, useState, useMemo } from "react";
import { observer } from "mobx-react";
import { Dropdown, message } from "antd";
import { PLAIN_NODE_DEFAULT_SIZE } from "../../../../constants/geometry";
import { getChildNodePosition, reArrangeTree } from "../../../../utils/graph";
import { Add_CONDITION_TASK } from "../../../../constants/event";
import nodeAPI from "../../../../apis/node";
import eventChannel from "../../../../utils/event";
import NodeComment from "../node-comment";
import ConfigPopover from "../config-popover";
import AddTagPopover from "../add-tag-popover";
import { 
  expandChildren,
  isWrapped,
  markAsFinished,
  markAsUnfinished,
  wrapChildren
} from "../../../../utils/node";
import { pointDistance } from "../../../../utils/math";

const baseDropdownItems = [
  {key: "add-child", label: "添加子节点"},
  {key: "edit-info", label: "修改信息"},
  {key: "comment", label: "编辑备注"},
  {key: "add-tag", label: "添加标签"},
  {key: "edit-notes", label: "编辑笔记"},
  {key: "add-condition-task", label: "作为前置任务"},
  {key: "set-background", label: "设置背景"}
];

const markAsUnfinishedItem = {key: "mark-as-unfinished", label: "标记为未完成"};
const markAsFinishedItem = {key: "mark-as-finished", label: "标记为已完成"};
const removeNodeItem = {key: "remove-node", label: "删除节点"};
const removeBackgroundItem = {key: "remove-background", label: "删除背景"};
const wrapChildrenItem = {key: "wrap-children", label: "收起子节点"};
const expandChildrenItem = {key: "expand-children", label: "展开子节点"};

export default observer(function NodeMenu({
  map,
  tree,
  svgRef
}) {
  const [left, setLeft] = useState(0); // 弹出窗口距离父容器左边缘的距离
  const [top, setTop] = useState(0);
  const [node, setNode] = useState(null);
  const [isAddTagShow, setIsAddTagShow] = useState(false);
  const [isCommentShow, setIsCommentShow] = useState(false);
  const [configPopoverShow, setConfigPopoverShow] = useState(false);
  const [menuShow, setMenuShow] = useState(false);
  const [messageAPI, messageContext] = message.useMessage();
  const nodePos = useMemo(() => {
    const pos = {x: 0, y: 0};
    if (node) {
      const nodeClientPos = map.coordination.svgToClient(node.x, node.y);
      pos.x = nodeClientPos.x - map.coordination.svgLeft;
      pos.y = nodeClientPos.y - map.coordination.svgTop;
    }
    return pos;
  }, [node, node?.x, node?.y]);

  let nodeCommentView = null;
  if (isCommentShow && node) {
    // 节点的中心位置在client中的坐标
    nodeCommentView = <NodeComment
      node={node}
      show={isCommentShow}
      x={nodePos.x}
      y={nodePos.y}
      setIsCommentShow={setIsCommentShow}
    />
  }

  const onAddChild = async () => {
    let center = getChildNodePosition(node, PLAIN_NODE_DEFAULT_SIZE);
    const newNode = tree.addNode(node, {
      x: center.x,
      y: center.y,
      r: PLAIN_NODE_DEFAULT_SIZE
    });
    await reArrangeTree(tree);
    const nodeResult = (await nodeAPI.add({
      mapId: map.id,
      title: newNode.title,
      finished: newNode.finished,
      comment: newNode.comment,
      priority: newNode.priority,
      parentId: node.id
    })).data;
    newNode.setId(nodeResult.id);
  };

  useEffect(() => {
    const onContextMenu = e => {
      e.preventDefault();
      const pos = map.coordination.clientToSvg(e.clientX, e.clientY);
      for (let i = 0; i < tree.nodes.length; i++) {
        const node = tree.nodes[i];
        if (pointDistance(pos.x, pos.y, node.x, node.y) <= node.r && !isWrapped(node)) {
          const box = svgRef.current.getBoundingClientRect();
          setLeft(e.clientX - box.left);
          setTop(e.clientY - box.top);
          setNode(node);
          setMenuShow(true);
          break;
        }
      }
    };
    const onClick = () => {
      setMenuShow(false);
    };
    svgRef.current.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("click", onClick);
    return () => {
      if (svgRef.current) {
        svgRef.current.removeEventListener("contextmenu", onContextMenu);
      }
      document.removeEventListener("click", onClick);
    }
  }, []);

  const onAddComment = () => {
    setIsCommentShow(true);
  }

  const onRemoveNode = async () => {
    await tree.removeNode(node.id);
    await reArrangeTree(tree);
  }

  const onEditConfig = () => {
    setConfigPopoverShow(true);
  }

  const onAddTag = () => {
    setIsAddTagShow(true);
  }

  const setBackground = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();
    input.addEventListener("change", e => {
      const file = e.target.files[0];
      if (file.size <= 10485760) {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.addEventListener("load", () => {
          node.setBackgroundImageURL(fileReader.result);
        });
        nodeAPI.setBackground(node.id, file);
      } else {
        messageAPI.warning("文件大小不能超过10M!");
      }
    });
  }

  const removeBackground = () => {
    node.setBackgroundImageURL("");
    nodeAPI.removeBackground(node.id);
  }

  const onEditNotes = () => {

  }

  // 通知tree添加一个前驱任务
  const addConditionTask = (e) => {
    eventChannel.emit(Add_CONDITION_TASK, map.id, node, e);
  }

  const onClick = ({key, domEvent}) => {
    switch(key) {
      case "add-child":
        onAddChild();
        break;
      case "edit-info":
        onEditConfig();
        break;
      case "remove-node":
        onRemoveNode();
        break;
      case "comment":
        onAddComment();
        break;
      case "add-tag":
        onAddTag();
        break;
      case "set-background":
        setBackground();
        break;
      case "remove-background":
        removeBackground();
        break;
      case "edit-notes":
        onEditNotes();
        break;
      case "add-condition-task":
        addConditionTask(domEvent);
        break;
      case "mark-as-unfinished":
        markAsUnfinished(node);
        break;
      case "mark-as-finished":
        markAsFinished(node);
        break;
      case "wrap-children":
        wrapChildren(tree, node);
        break;
      case "expand-children":
        expandChildren(tree, node);
        break;
    }
  }

  return (
    <>
      {messageContext}
      <Dropdown
        menu={{
          items: [
            ...baseDropdownItems,
            node?.backgroundImageURL && removeBackgroundItem,
            node?.finished ? markAsUnfinishedItem : markAsFinishedItem,
            node?.parent && removeNodeItem,
            !!node?.children.length && (node?.childrenWrapped ? expandChildrenItem : wrapChildrenItem)
          ],
          onClick: onClick
        }}
        open={menuShow}
      >
        <div style={{
          position: "absolute",
          left: left,
          top: top,
          width: 0,
          height: 0,
        }}></div>
      </Dropdown>
      {nodeCommentView}
      {
        configPopoverShow && <ConfigPopover
          x={nodePos.x}
          y={nodePos.y}
          node={node}
          show={configPopoverShow}
          setShow={setConfigPopoverShow}
        />
      }
      {
        isAddTagShow && <AddTagPopover
          x={nodePos.x}
          y={nodePos.y}
          map={map}
          node={node}
          show={isAddTagShow}
          setShow={setIsAddTagShow}
        />
      }
    </>
  )
});