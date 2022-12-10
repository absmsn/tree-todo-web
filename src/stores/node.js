import { makeAutoObservable } from "mobx";
import { geneID } from "../utils";
import { isNumber } from "lodash";

export default class NodeStore {
  children = [];

  title = "";

  x = 0;

  y = 0;

  r = 0;
  
  stroke = "";

  strokeWidth = 2;

  id = geneID();

  constructor(title, { x, y, r }, { stroke, strokeWidth}) {
    this.title = title;
    this.x = x;
    this.y = y;
    this.r = r;
    stroke && (this.stroke = stroke);
    strokeWidth && (this.strokeWidth = strokeWidth);
    makeAutoObservable(this);
  }

  changePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  changeTitle(newTitle) {
    this.title = newTitle;
  }

  addChild(peer) {
    peer.parent = this;
    if (isNumber(this.depth)) {
      peer.depth = this.depth + 1;
    }
    this.children.push(peer);
  }
}