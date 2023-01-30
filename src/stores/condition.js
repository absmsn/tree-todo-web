import { makeAutoObservable } from "mobx";

export default class ConditionStore {
  target = null;

  text = "";

  constructor(target, text) {
    if (target) {
      this.target = target;
    }
    if (text) {
      this.text = text;
    }
    makeAutoObservable(this);
  }

  setText(text) {
    this.text = text;
  }
}