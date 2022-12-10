import { makeAutoObservable } from "mobx";
import NodeStore from "./node";
import EdgeStore from "./edge";
import { geneID } from "../utils";

const defaultNodeName = "title";

export default class TreeStore {
  root = null;

  nodes = [];

  edges = [];

  nodeStyle = {
    stroke: "#096dd9",
    strokeWidth: 2
  }

  constructor(firstNode, nodeStyle) {
    this.id = geneID();
    this.nodeStyle = {...nodeStyle, ...this.nodeStyle};
    const node = new NodeStore(defaultNodeName, firstNode, this.nodeStyle);
    node.depth = 0;
    this.root = node;
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
    }
  }
}