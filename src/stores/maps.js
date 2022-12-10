import { makeAutoObservable } from "mobx";
import MapStore from "./map";

export default class MapsStore {
  maps = [];

  selectedMap = null;

  constructor() {
    makeAutoObservable(this);
  }

  add(name) {
    const map = new MapStore(name);
    this.maps.push(map);
  }

  remove(id) {
    const i = this.maps.findIndex(map => map.id === id);
    if (i !== -1) {
      this.maps.splice(i, 1);
    }
  }
}
