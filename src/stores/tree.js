import { makeAutoObservable } from "mobx";
import NodeStore from "./node";
import EdgeStore from "./edge";
import { geneID } from "../utils";
import { DEFAULT_STROKE_WIDTH } from "../constants/geometry";
import { isObject } from "lodash";
import nodeAPI from "../apis/node";

const defaultNodeName = "title";

// 递归的向上查询所有父节点是否已是完成状态，如果是，则设置为完成状态。
async function toggleParentFinished(node) {
  const mutations = [], mutation = {finished: true}, ids = [];
  while (node.parent) {
    // 检查是否所有兄弟节点都是已完成状态
    let not = node.parent.children.some(d => !d.finished);
    if (!node.parent.children.length || not) {
      break;
    }
    node.parent.setFinished(true);
    mutations.push(mutation);
    ids.push(node.parent.id);
    node = node.parent;
  }
  if (ids.length > 0) {
    await nodeAPI.editBatch(ids, mutations);
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

  fromPartial(partial) {
    if (isObject(partial)) {
      for (let key in partial) {
        this[key] = partial[key];
      }
    }
  }

  addNode(parent, geometry) {
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

  async removeNode(id) {
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
    const ids = [];
    for (let node of toRemove.values()) {
      ids.push(node.id);
    }
    await nodeAPI.removeBatch(ids);
    if (node.parent) {
      let i = node.parent.children.findIndex(n => n === node);
      node.parent.children.splice(i, 1);
    }
    // 当要被删除的节点是未完成状态，则需要检查删除该节点后它的父节点们是否可以变为完成状态。
    if (!node.finished) {
      await toggleParentFinished(node);
    }
    this.nodes = this.nodes.filter(n => {
      return !toRemove.has(n);
    });
    this.edges = this.edges.filter(e => {
      return !toRemove.has(e.source) && !toRemove.has(e.target);
    });
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      if (n.conditions.length > 0 && !toRemove.has(n)) {
        n.setConditions(n.conditions.filter(c => !toRemove.has(c.target)));
      }
    }
  }

  changeNodeParent(node, newParent) {
    const nodeIndex = node.parent.children.findIndex(c => c === node);
    node.parent.children.splice(nodeIndex, 1);
    const edgeIndex = this.edges.findIndex(e => {
      return e.source === node.parent && e.target === node;
    });
    this.edges.splice(edgeIndex, 1);
    node.setParent(newParent);

    const edge = new EdgeStore(newParent, node, {...this.nodeStyle});
    newParent.children.push(node);
    this.edges.push(edge);
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