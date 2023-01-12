import { makeAutoObservable } from "mobx";
import NodeStore from "./node";
import EdgeStore from "./edge";
import { geneID } from "../utils";
import { DEFAULT_STROKE_WIDTH } from "../constants/geometry";

const defaultNodeName = "title";

// 递归的向上查询所有父节点是否已是完成状态，如果是，则设置为完成状态。
function toggleParentFinished(node) {
  while (node.parent) {
    // 检查是否所有兄弟节点都是已完成状态
    let not = node.parent.children.some(d => !d.finished);
    if (not) {
      break;
    }
    node.parent.setFinished(true);
    node = node.parent;
  }
}

export default class TreeStore {
  root = null;

  nodes = [];

  edges = [];

  selectedNode = null;

  nodeStyle = {
    stroke: "#096dd9",
    strokeWidth: DEFAULT_STROKE_WIDTH
  };

  constructor(firstNode, nodeStyle) {
    this.id = geneID();
    this.nodeStyle = {...this.nodeStyle, ...nodeStyle};
    const node = new NodeStore(defaultNodeName, firstNode, this.nodeStyle);
    this.root = node;
    node.depth = 0;
    this.nodes.push(node);
    makeAutoObservable(this);
  }

  addNode(parentID, geometry) {
    const parent = this.nodes.find(n => n.id === parentID);
    if (parent) {
      const node = new NodeStore(
        defaultNodeName,
        geometry,
        this.nodeStyle
      );
      const edge = new EdgeStore(parent, node, {...this.nodeStyle});
      this.nodes.push(node);
      this.edges.push(edge);
      parent.addChild(node);
      return node;
    }
  }

  removeNode(id) {
    let node = this.nodes.find(n => n.id === id);
    if (!node) {
      return;
    }
    let stack = [node];
    let toRemove = new Set();
    while (stack.length) {
      let ele = stack.pop();
      toRemove.add(ele);
      for (let i = 0; i < ele.children.length; i++) {
        stack.push(ele.children[i]);
      }
    }
    if (node.parent) {
      let i = node.parent.children.findIndex(n => n === node);
      node.parent.children.splice(i, 1);
    }
    // 当要被删除的节点是未完成状态，则需要检查删除该节点后它的父节点们是否可以变为完成状态。
    if (!node.finished) {
      toggleParentFinished(node);
    }
    this.nodes = this.nodes.filter(n => {
      return !toRemove.has(n);
    });
    this.edges = this.edges.filter(e => {
      return !toRemove.has(e.source) && !toRemove.has(e.target);
    });
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      let index = n.precursors.findIndex(p => p === node);
      if (index !== -1) {
        n.precursors.splice(index, 1);
      }
    }
  }

  unselectNode() {
    if (this.selectedNode) {
      this.selectedNode.setSelected(false);
      this.selectedNode = null;
    }
  }
  setSelectedNode(node) {
    this.unselectNode();
    this.selectedNode = node;
    node.selected = true;
  }
}