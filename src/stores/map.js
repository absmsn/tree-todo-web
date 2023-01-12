import { makeAutoObservable } from "mobx";
import { geneID } from "../utils";
import CoordinationStore from "./coordination";
import Tag from "./tag";
export default class MapStore {
  id = geneID();

  name = "";

  tree = null;

  creationTimestamp = Date.now();

  coordination = new CoordinationStore();

  showCanvas = true;

  showTaskList = false;

  exist = false; // 是否为存储到服务器的数据

  tags = [];

  constructor(name, tree) {
    if (name) {
      this.name = name;
    }
    if (tree) {
      this.tree = tree;
    }
    makeAutoObservable(this);
  }

  setShowTaskList(show) {
    this.showTaskList = show;
  }
  
  setShowCanvas(show) {
    this.showCanvas = show;
  }

  setTree(tree) {
    this.tree = tree;
  }

  addTag(name) {
    if (!this.tags.find(t => t.name === name)) {
      const tag = new Tag(name); 
      this.tags.push(tag);
      return tag;
    }
  }

  removeTag(name) {
    const i = this.tags.findIndex(t => t.name === name);
    if (i !== -1) {
      this.tags.splice(i, 1);
    }
  }
}