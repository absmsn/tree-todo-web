import { makeAutoObservable } from "mobx";

export default class AppStore {
  syncStatus = 'finished';

  mapsStore = null;

  constructor() {
    makeAutoObservable(this);
  }

  setSyncStatus(status) {
    this.syncStatus = status;
  }

  setMapsStore(mapsStore) {
    this.mapsStore = mapsStore;
  }

  exit() {
    if (this.mapsStore) {
      this.mapsStore.destroy();
    }
  }
}