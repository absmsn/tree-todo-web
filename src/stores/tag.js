import { geneID } from "../utils";
import { makeAutoObservable } from "mobx";

export default class Tag {
  id = geneID();

  name = "";

  color = "purple";

  constructor(name, color) {
    this.name = name;
    if (color) {
      this.color = color;
    }
    makeAutoObservable(this);
  }

  setName(name) {
    this.name = name;
  }

  setId(id) {
    this.id = id;
  }

  setBackgroundColor(color) {
    this.color = color;
  }
}