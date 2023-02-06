import { makeAutoObservable } from "mobx";
import { isNumber, isObject } from "lodash";
import { geneID } from "../utils";
import { DEFAULT_STROKE_WIDTH } from "../constants/geometry";
import ConditionStore from "./condition";

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

  conditions = [];

  tags = [];

  notes = [];

  title = "";

  comment = "";

  finished = false;

  selected = false;

  repeat = "";

  startTime = null;

  endTime = null;

  createTime = new Date();

  finishTime = null;

  backgroundImageURL = "";

  priority = 0;

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

  setId(id) {
    this.id = id;
  }

  fromPartial(partial) {
    if (isObject(partial)) {
      for (let key in partial) {
        this[key] = partial[key];
      }
    }
  }

  setParent(parent) {
    this.parent = parent;
  }

  setChildren(children) {
    this.children = children;
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
    this.finishTime = new Date();
  }

  setRepeat(repeat) {
    this.repeat = repeat;
  }

  setStartTime(time) {
    this.startTime = time;
  }

  setEndTime(time) {
    this.endTime = time;
  }
  
  setCreateTime(time) {
    this.createTime = time;
  }

  setFinishTime(time) {
    this.finishTime = time;
  }

  setSelected(selected) {
    this.selected = selected;
  }

  setBackgroundImageURL(url) {
    this.backgroundImageURL = url;
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

  removeTag(id) {
    if (this.tags.length > 0) {
      const i = this.tags.findIndex(t => t.id === id);
      if (i !== -1) {
        this.tags.splice(i, 1);
      }
    }
  }

  addCondition(condition) {
    const conditionStore = new ConditionStore(condition);
    this.conditions.push(conditionStore);
  }

  removeCondition(node) {
    const i = this.conditions.findIndex(n => n.target === node);
    if (i !== -1) {
      this.conditions.splice(i, 1);
    }
  }

  setConditions(conditions) {
    this.conditions = conditions;
  }

  setPriority(priority) {
    this.priority = priority;
  }
}