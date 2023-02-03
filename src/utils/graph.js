import {
  DEFAULT_EDGE_LENGTH,
  DEFAULT_STROKE_WIDTH,
  ROOT_NODE_DEFAULT_SIZE,
  PLAIN_NODE_DEFAULT_SIZE
} from "../constants/geometry";
import { isNull, isNumber, throttle } from "lodash";
import { 
  atan,
  crossProduct,
  pointDistance
} from "./math";
import { 
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceCenter
 } from "d3-force";
import {
  polygonHull,
  polygonContains
} from "d3-polygon";
import TreeStore from "../stores/tree";
import ConditionStore from "../stores/condition";
import { randomBgColor } from ".";

// 在创建一个新节点时，为这个节点指定一个合适的节点坐标
export function getChildNodePosition(parent, r, edgeLength = DEFAULT_EDGE_LENGTH) {
  // 两节点中心坐标连线的长度
  let x, y;
  let distance = parent.r + edgeLength + r;
  // 如果父节点就是根节点，让改节点与父节点垂直对齐
  if (!parent.parent) {
    x = parent.x;
    y = parent.y + distance;
  } else {
    let r1 = Math.sqrt(Math.pow(parent.parent.x - parent.x, 2) + Math.pow(parent.parent.y - parent.y, 2));
    let sinx = (parent.parent.y - parent.y) / r1,
      cosx = (parent.parent.x - parent.x) / r1;
    x = parent.x - distance * cosx;
    y = parent.y - distance * sinx;
  }
  return {
    x,
    y
  };
}

// 根据起始点和终止点计算二次贝塞尔曲线的控制点
// 以起始点和终止点作为等腰三角形底边的两个点，求另一个点
export function getQuaraticBezierControlPoint(start, end, parent) {
  const offsetX = end.x - start.x, offsetY = end.y - start.y;
  let theta = atan(offsetY, offsetX);
  const centerX = (start.x + end.x) / 2, centerY = (start.y + end.y) / 2;
  const length = pointDistance(centerX, centerY, end.x, end.y) * .75;
  const cross = crossProduct(offsetX, offsetY, parent.x - start.x, parent.y - start.y);
  // 控制点和父节点中心分别在start和end连线的两侧
  const rotatedTheta = theta - Math.sign(cross) * (Math.PI / 2);
  return {
    x: centerX + Math.cos(rotatedTheta) * length,
    y: centerY + Math.sin(rotatedTheta) * length
  };
}

// 检测当前某个点在树的哪个节点中
export function whichNodeIsPointIn(tree, x, y) {
  for (let i = 0; i < tree.nodes.length; i++) {
    const node = tree.nodes[i], nodeX = node.x, nodeY = node.y;
    if (pointDistance(nodeX, nodeY, x, y) <= node.r) {
      return node;
    }
  }
}

// 检测某个节点是否为另一个节点的父节点
export function isParentOfAnother(one, another) {
  let parent = one.parent;
  while (parent) {
    if (another === parent) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

// 生成点集的凸包，Graham Scan法
export function getHull(points) {
  if (points.length <= 3) {
    return points;
  }
  // 查找极点: x坐标最小，如果x坐标有相同的选择y最小的
  let minI = 0;
  for (let i = 0; i < points.length; i++) {
    if (points[i].x < points[minI].x ||
      (points[i].x === points[minI].x && points[i].y < points[minI].y)) {
      minI = i;
    }
  }
  // 将最小的点放到数组的第一位
  [points[0], points[minI]] = [points[minI], points[0]];
  // 做极角排序，如果极角相同的距离近的优先
  let first = points.shift();
  points.sort((a, b) => {
    const crossZ = crossProduct(a.x - first.x, a.y - first.y, b.x - first.x, b.y - first.y);
    if (crossZ === 0) {
      return pointDistance(a.x, a.y, first.x, first.y) - pointDistance(b.x, b.y, first.x, first.y);
    }
    return -crossZ;
  });
  points.unshift(first);
  const stack = [points[0], points[1]];
  for (let i = 2; i < points.length; i++) {
    const r = points[i];
    while (stack.length > 1) { // 栈内至少两个点
      const p = stack[stack.length - 2], q = stack[stack.length - 1];
      // 若当前点r和栈顶两个点q,p组成的两个向量叉积小于0，则持续的移除栈顶的点，直至其大于0
      if (crossProduct(q.x - p.x, q.y - p.y, r.x - q.x, r.y - q.y) >= 0) {
        break;
      }
      stack.pop();
    }
    // 如果栈内的点不足两个，则持续入栈
    stack.push(points[i]);
  }
  return stack;
}

// 生成凸包的外接圆，返回圆心和半径
export function getHullCircle(points) {
  if (points.length === 1) {
    return {x: points[0].x, y: points[0].y, r: 0};
  } else if (points.length === 2) {
    const [a, b] = points;
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      r: pointDistance(a.x, a.y, b.x, b.y) / 2
    };
  } else {
    let allArea = 0, xDenominator = 0, yDenominator = 0, a = points[points.length - 1];
    // 求多边形的质心
    for (let i = points.length - 2; i >= 1; i--) {
      let b = points[i], c = points[i - 1];
      let area = (((b.x - a.x) * (c.y - a.y)) - ((b.y - a.y) * (c.x - a.x))) / 2;
      xDenominator += area * (a.x + b.x + c.x);
      yDenominator += area * (a.y + b.y + c.y);
      allArea += area;
    }
    // 到离质心最远的那个点的距离为半径
    let x = xDenominator / (allArea * 3), y = yDenominator / (allArea * 3), r = 0;
    for (let i = 0; i < points.length; i++) {
      r = Math.max(r, pointDistance(x, y, points[i].x, points[i].y));
    }
    return {x, y, r};
  }
}

// 为一棵以圆形为节点的树生成凸包
export function getCircleTreeHull(points) {
  points = points.map(p => [p.x, p.y, p.r]);
  if (points.length <= 3) {
    return points;
  }
  const hull = polygonHull(points);
  return hull;
}


// 检测某个点是否在一棵以圆形为节点的树中
export function isPointInsideCircleTree(point, points) {
  point = [point.x, point.y];
  points = getCircleTreeHull(points);
  return polygonContains(points, point);
}

export function reArrangeTree(tree) {
  const nodes = tree.nodes.map((node) => ({
    x: node.x,
    y: node.y,
    id: node.id,
    depth: node.depth,
    r: node.r
  }));
  const nodeMinDistance = 10; // 节点之间的安全距离
  const rootPlainDistance = ROOT_NODE_DEFAULT_SIZE + DEFAULT_EDGE_LENGTH + PLAIN_NODE_DEFAULT_SIZE; // 根节点和其子节点的最小距离
  const plainsDistance = PLAIN_NODE_DEFAULT_SIZE * 2 + DEFAULT_EDGE_LENGTH; // 普通子节点与其子节点的最小距离
  const siblingMinDistanceHalf = PLAIN_NODE_DEFAULT_SIZE + nodeMinDistance / 2; // 两个兄弟节点之间的最小距离的一半
  const stack = [tree.root], links = [];
  while (stack.length > 0) {
    const node = stack.pop();
    const children = node.children;
    if (children.length !== 0) {
      // 考虑到子节点数量过多时，固定的父子节点距离不能获取合适的布局
      let linkLength = Math.max(
        node.parent ? plainsDistance : rootPlainDistance,
        children.length !== 1 ? siblingMinDistanceHalf / Math.sin((Math.PI / children.length)) : 0
      );
      for (let i = 0; i < children.length; i++) {
        // 这是父节点和子节点的连线,长度还和子节点的子节点数目相关,这里经验性的设置一个值
        const newLinkLength = linkLength + children[i].children.length * 15;
        links.push({
          source: node.id,
          target: children[i].id,
          linkLength: newLinkLength
        });
        stack.push(children[i]);
      }
    }
  }
  const rootX = tree.root.x, rootY = tree.root.y;
  return new Promise((resolve) => {
    forceSimulation(nodes)
      .alpha(1)
      .alphaMin(0.1)
      .alphaDecay(0.05)
      .on("end", () => {
        resolve();
      })
      .on("tick", throttle(() => {
        for (let i = 0; i < nodes.length; i++) {
          // 要始终保持根节点的位置不变
          const disturbanceX = nodes[0].x - rootX, disturbanceY = nodes[0].y - rootY;
          tree.nodes[i].setPosition(nodes[i].x - disturbanceX, nodes[i].y - disturbanceY);
        }
      }, 60))
      .force("link", forceLink(links)
        .id(d => d.id)
        .distance(l => l.linkLength))
      .force("charge", forceManyBody()
        .strength(node => {
          return -(300 * (.35 ** (node.depth + 1)));
        }))
      .force("collide", forceCollide(d => d.r + nodeMinDistance));
  });
}

export function buildTreeFromNodeItems(nodes, tags, x, y) {
  const tree = new TreeStore({
    x: x,
    y: y,
    r: ROOT_NODE_DEFAULT_SIZE
  }, {
    stroke: randomBgColor(),
    strokeWidth: DEFAULT_STROKE_WIDTH
  });
  const initialGeometry = {
    x: x,
    y: y,
    r: PLAIN_NODE_DEFAULT_SIZE
  }
  const idNode = new Map(), addedIdNodes = new Map(), idTag = new Map();
  const root = nodes.find(node => isNull(node.parentId));
  addedIdNodes.set(root.id, tree.root);
  tree.root.setId(root.id);
  const add = (node) => {
    if (addedIdNodes.has(node.id)) {
      return addedIdNodes.get(node.id);
    }
    if (addedIdNodes.has(node.parentId)) {
      const parent = addedIdNodes.get(node.parentId);
      const newNode = tree.addNode(parent, initialGeometry);
      addedIdNodes.set(node.id, newNode);
      return newNode;
    } else {
      const parentNode = idNode.get(node.parentId);
      const parent = add(parentNode);
      const newNode = tree.addNode(parent, initialGeometry);
      addedIdNodes.set(node.id, newNode);
      return newNode;
    }
  }
  for (let node of nodes) {
    idNode.set(node.id, node);
  }
  for (let tag of tags) {
    idTag.set(tag.id, tag);
  }
  for (let node of nodes) {
    if (isNumber(node.parentId)) {
      add(node);  
    }
  }
  for (let node of nodes) {
    const nodeStore = addedIdNodes.get(node.id);
    nodeStore.fromPartial(node);
    if (node.startTime) {
      nodeStore.setStartTime(new Date(node.startTime));
    }
    if (node.endTime) {
      nodeStore.setEndTime(new Date(node.endTime));
    }
    if (node.createTime) {
      nodeStore.setCreateTime(new Date(node.createTime));
    }
    if (node.finishTime) {
      nodeStore.setFinishTime(new Date(node.finishTime));
    }
    if (node.tags.length > 0) {
      nodeStore.setTags(node.tags.map(tag => idTag.get(tag.tagId)));
    }
    if (node.outs.length > 0) {
      const conditions = node.outs.map(out => {
        const target = addedIdNodes.get(out.targetId);
        const condition = new ConditionStore(target, out.text);
        return condition;
      });
      nodeStore.setConditions(conditions);
    }
  }
  const queue = [tree.root], betweenTheta = Math.PI / 4;
  while (queue.length > 0) {
    const node = queue.shift();
    const length = node.children.length;
    // 如果是根节点，则使它的子节点均匀分布
    if (!node.parent) {
      const angle = (Math.PI * 2) / length;
      const distance = DEFAULT_EDGE_LENGTH + ROOT_NODE_DEFAULT_SIZE + PLAIN_NODE_DEFAULT_SIZE;
      for (let i = 0; i < length; i++) {
        node.children[i].setPosition(
          node.x + distance * Math.cos(angle * i),
          node.y + distance * Math.sin(angle * i)
        );
      }
    } else if (length > 0) {
      // 如果不是根节点，则使它的子节点们沿着延长线两侧分布
      const distance = pointDistance(node.x, node.y, node.parent.x, node.parent.y);
      const parentAngle = atan(node.y - node.parent.y, node.x - node.parent.x);
      const initialAngle = parentAngle - (betweenTheta * (length - 1)) / 2;
      for (let i = 0; i < length; i++) {
        const theta = initialAngle + i * betweenTheta;
        node.children[i].setPosition(
          node.x + distance * Math.cos(theta),
          node.y + distance * Math.sin(theta)
        );
      }
    }
    for (let i = 0; i < length; i++) {
      queue.push(node.children[i]);
    }
  }
  return tree;
}