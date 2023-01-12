import { makeAutoObservable } from "mobx";

export default class CoordinationStore {
  scale = 1;

  viewBoxLeft = 0;

  viewBoxTop = 0;

  svgLeft = 0; // svg的clientX坐标

  svgTop = 0; // svg的clientY坐标

  constructor() {
    makeAutoObservable(this);
  }

  setScale(scale) {
    this.scale = scale;
  }

  setViewBox(left, top) {
    this.viewBoxLeft = left;
    this.viewBoxTop = top;
  }

  setSvgOffset(left, top) {
    this.svgLeft = left;
    this.svgTop = top;
  }

  clientToSvg(x, y) {
    return {
      x: this.viewBoxLeft + (x - this.svgLeft) * this.scale,
      y: this.viewBoxTop + (y - this.svgTop) * this.scale
    };
  }

  svgToClient(x, y) {
    return {
      x: (x - this.viewBoxLeft) / this.scale + this.svgLeft,
      y: (y - this.viewBoxTop) / this.scale + this.svgTop
    };
  }
}