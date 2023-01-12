import { makeAutoObservable } from "mobx";
import { isNumber } from "lodash";
import { geneID } from "../utils";
import { DEFAULT_STROKE_WIDTH } from "../constants/geometry";

// 将所有上层节点finished标记为false
function markParentUnfinished(node) {
  while (node.parent) {
    if (!node.parent.finished) {
      break;
    }
    node.parent.setFinished(false);
    node = node.parent;
  }
}

export default class NodeStore {
  parent = null;

  children = [];

  precursors = [];

  tags = [];

  title = "";

  comment = "";

  finished = false;

  selected = false;

  startTime = null;

  endTime = null;

  createTime = new Date();

  x = 0;

  y = 0;

  r = 0;

  stroke = "";

  strokeWidth = DEFAULT_STROKE_WIDTH;

  id = geneID();

  constructor(title, {
    x,
    y,
    r
  }, {
    stroke,
    strokeWidth
  }) {
    this.title = title;
    this.x = x;
    this.y = y;
    this.r = r;
    stroke && (this.stroke = stroke);
    strokeWidth && (this.strokeWidth = strokeWidth);
    makeAutoObservable(this);
  }

  setParent(parent) {
    this.parent = parent;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setTitle(newTitle) {
    this.title = newTitle;
  }

  setComment(newComment) {
    this.comment = newComment;
  }

  setFinished(finished) {
    this.finished = finished;
  }

  setStartTime(time) {
    this.startTime = time;
  }

  setEndTime(time) {
    this.endTime = time;
  }

  setSelected(selected) {
    this.selected = selected;
  }

  addChild(child) {
    child.setParent(this);
    if (isNumber(this.depth)) {
      child.depth = this.depth + 1;
    }
    this.children.push(child);
    markParentUnfinished(child);
  }

  setTags(tags) {
    this.tags = tags;
  }

  removeTag(name) {
    const i = this.tags.findIndex(t => t.name === name);
    if (i !== -1) {
      this.tags.splice(i, 1);
    }
  }

  addPrecursor(precursor) {
    this.precursors.push(precursor);
  }

  removePrecursor(node) {
    const i = this.precursors.findIndex(n => n === node);
    if (i !== -1) {
      this.precursors.splice(i, 1);
    }
  }
}