import { makeAutoObservable } from "mobx";
import { geneID } from "../utils";

export default class EdgeStore {
  edgeID = geneID();

  source = null;

  target = null;

  edgeStyle = null;

  constructor(source, target, edgeStyle) {
    this.source = source;
    this.target = target;
    this.edgeStyle = edgeStyle;
    makeAutoObservable(this);
  }
}