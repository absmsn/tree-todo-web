import { isObject } from "lodash";
import { makeAutoObservable } from "mobx";
import { geneID } from "../utils";
import CoordinationStore from "./coordination";
import mapAPI from "../apis/map";
import tagAPI from "../apis/tag";
import Tag from "./tag";
export default class MapStore {
  id = geneID();

  name = "";

  tree = null;

  creationTime = new Date();

  coordination = new CoordinationStore();

  showCanvas = true;

  showTaskList = false;

  showNotes = false;

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

  fromPartial(partial) {
    if (isObject(partial)) {
      for (let key in partial) {
        this[key] = partial[key];
      }
    }
  }

  setName(name) {
    this.name = name;
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

  setId(id) {
    this.id = id;
  }

  setTags(tags) {
    this.tags = tags;
  }

  addTag(name) {
    if (!this.tags.find(t => t.name === name)) {
      const tag = new Tag(name); 
      this.tags.push(tag);
      tagAPI.add(this.id, name).then(({data}) => {
        tag.setId(data.id);
      });
    }
  }

  removeTag(id) {
    const i = this.tags.findIndex(t => t.id === id);
    if (i !== -1) {
      this.tags.splice(i, 1);
    }
  }
}