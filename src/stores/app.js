import { makeAutoObservable } from "mobx";

export default class AppStore {
  syncStatus = 'finished';

  constructor() {
    makeAutoObservable(this);
  }

  setSyncStatus(status) {
    this.syncStatus = status;
  }
}