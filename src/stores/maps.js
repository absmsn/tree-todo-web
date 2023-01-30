import { makeAutoObservable } from "mobx";
import MapStore from "./map";

export default class MapsStore {
  maps = [];

  selectedMap = null;

  constructor() {
    makeAutoObservable(this);
  }

  setMaps(maps) {
    this.maps = maps;
  }

  add(name, tree) {
    const map = new MapStore(name, tree);
    this.maps.push(map);
    return map;
  }

  remove(id) {
    const i = this.maps.findIndex(map => map.id === id);
    if (i !== -1) {
      this.maps.splice(i, 1);
    }
  }

  setSelectedMap(map) {
    this.selectedMap = map;
  }

  destroy() {
    this.maps = [];
    this.selectedMap = null;
  }
}
