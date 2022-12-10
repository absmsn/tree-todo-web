import { makeAutoObservable } from "mobx";
import { geneID } from "../utils";
import TreeStore from "./tree";

const defaultMapName = "untitled";

export default class MapStore {
  trees = [];

  id = geneID();

  creationTimestamp = Date.now();

  name = defaultMapName;

  constructor(name) {
    if (name) {
      this.name = name;
    }
    makeAutoObservable(this);
  }

  addTree(firstNode, nodeStyle) {
    const tree = new TreeStore(firstNode, nodeStyle);
    this.trees.push(tree);
  }
}