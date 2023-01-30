import { makeAutoObservable } from "mobx";
import { geneID } from "../utils";

export default class EdgeStore {
  id = geneID();

  source = null;

  target = null;

  edgeStyle = null;

  setId(id) {
    this.id = id;
  }

  constructor(source, target, edgeStyle) {
    this.source = source;
    this.target = target;
    this.edgeStyle = edgeStyle;
    makeAutoObservable(this);
  }
}