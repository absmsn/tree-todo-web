import nodeAPI from "../apis/node";
import { reArrangeTree } from "./graph";
import { pointDistance } from "./math";

export const markAsFinished = async node => {
  const stack = [node], ids= [], mutations = [], mutation = {finished: true};
  while (stack.length) {
    let n = stack.pop();
    if (!n.finished) {
      ids.push(n.id);
      mutations.push(mutation);
      n.setFinished(true);
      for(let i = 0; i < n.children.length; i++) {
        if (!n.children[i].finished) {
          stack.push(n.children[i]);
        }
      }
    }
  }
  let n = node;
  while (n.parent) {
    // 检查是否所有兄弟节点都是已完成状态
    let not = n.parent.children.some(d => !d.finished);
    if (not) {
      break;
    }
    ids.push(n.parent.id);
    mutations.push(mutation);
    n.parent.setFinished(true);
    n = n.parent;
  }
  if (ids.length > 0) {
    await nodeAPI.editBatch(ids, mutations);
  }
}

export const markAsUnfinished = async node => {
  const stack = [node], ids= [], mutations = [], mutation = {finished: false};
  while (stack.length) {
    let n = stack.pop();
    if (n.finished) {
      ids.push(n.id);
      mutations.push(mutation);
      n.setFinished(false);
      for(let i = 0; i < n.children.length; i++) {
        if (n.children[i].finished) {
          stack.push(n.children[i]);
        }
      }
    }
  }
  let n = node;
  while (n.parent) {
    if (!n.parent.finished) {
      break;
    }
    ids.push(n.parent.id);
    mutations.push(mutation);
    n.parent.setFinished(false);
    n = n.parent;
  }
  if (ids.length > 0) {
    await nodeAPI.editBatch(ids, mutations);
  }
}

// 将所有子节点折叠
export function wrapChildren(tree, node) {
  const stack = [node];
  while (stack.length > 0) {
    const n = stack.pop();
    n.setChildrenWrapped(true);
    for (let i = 0; i < n.children.length; i++) {
      const child = n.children[i];
      if (child.children.length > 0) {
        stack.push(child);
      }
    }
  }
  reArrangeTree(tree);
}

export function expandChildren(tree, node) {
  const stack = [node];
  while (stack.length > 0) {
    const n = stack.pop();
    if (n.childrenWrapped) {
      n.setChildrenWrapped(false);
    }
    for (let i = 0; i < n.children.length; i++) {
      const child = n.children[i];
      if (child.children.length > 0) {
        stack.push(child);
      }
    }
  }
  reArrangeTree(tree);
}

export function isWrapped(node) {
  if (!node.parent) {
    return false;
  } else {
    return node.parent.childrenWrapped;
  }
}

export function getRepeatPattern(repeatStr) {
  let [month, day, hour, minute] = repeatStr.split(/[a-zA-Z]/);
  return {
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute)
  };
}

// 获取坐标所在的节点
export function getPosRelatedNode(map, clientX, clientY) {
  const nodes = map.tree.nodes;
  const pos = map.coordination.clientToSvg(clientX, clientY);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (pointDistance(node.x, node.y, pos.x, pos.y) <= node.r) {
      return node;
    }
  }
}