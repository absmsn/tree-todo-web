import { isArray, isFunction } from "lodash";

export function geneID() {
  return String(Date.now()) + String(Math.floor(Math.random() * 1e4));
}

export function randomColorRGB() {
  return '#' + (Math.random() * 0xffffff << 0).toString(16);
}

export function randomColorHSL(minH = 0, maxH = 360, minS = 0, maxS = 100,minL = 0, maxL = 100) {
  let h = minH + Math.floor(Math.random() * (maxH - minH));
  let s = minS + Math.floor(Math.random() * (maxS - minS));
  let l = minL + Math.floor(Math.random() * (maxL - minL));
  return `hsl(${h},${s}%,${l}%)`;
}

export function randomBgColor() {
  return randomColorHSL(0, 360, 0, 100, 25, 75);
}

export function getTagsMutations(oldTags, newTags) {
  const oldMap = new Map(), newMap = new Map(), addItems = [], removeItems = [];
  for (let tag of oldTags) {
    oldMap.set(tag.id, tag);
  }
  for (let tag of newTags) {
    newMap.set(tag.id, tag);
  }
  newMap.forEach((tag, id) => {
    if (!oldMap.has(id)) {
      addItems.push(tag);
    }
  });
  oldMap.forEach((tag, id) => {
    if (!newMap.has(id)) {
      removeItems.push(tag);
    }
  });
  return {
    add: addItems,
    remove: removeItems
  };
}

export function count(arr, evaluate) {
  if (!isArray(arr) || !isFunction(evaluate)) {
    return 0;
  }
  let count = 0;
  for(let item of arr) {
    count += !!evaluate(item)
  }
  return count;
}