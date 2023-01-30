import { makeAutoObservable } from "mobx";

export default class CoordinationStore {
  scale = 1;

  viewBox = {
    left: 0,
    top: 0,
    width: 0,
    height: 0
  };

  svgLeft = 0; // svg的clientX坐标

  svgTop = 0; // svg的clientY坐标

  constructor() {
    makeAutoObservable(this);
  }

  setScale(scale) {
    this.scale = scale;
  }

  setViewBox({left, top, width, height}) {
    if (left !== undefined) {
      this.viewBox.left = left;
    }
    if (top !== undefined) {
      this.viewBox.top = top;
    }
    if (width !== undefined) {
      this.viewBox.width = width;
    }
    if (height !== undefined) {
      this.viewBox.height = height;
    }
  }

  setSvgOffset(left, top) {
    this.svgLeft = left;
    this.svgTop = top;
  }

  clientToSvg(x, y) {
    return {
      x: this.viewBox.left + (x - this.svgLeft) * this.scale,
      y: this.viewBox.top + (y - this.svgTop) * this.scale
    };
  }

  svgToClient(x, y) {
    return {
      x: (x - this.viewBox.left) / this.scale + this.svgLeft,
      y: (y - this.viewBox.top) / this.scale + this.svgTop
    };
  }
}