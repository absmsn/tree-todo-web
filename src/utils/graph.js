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
  forceCollide
 } from "d3-force";
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

const NODE_MIN_DISTANCE = 10; // 节点之间的安全距离
const ROOT_PLAIN_DISTANCE = ROOT_NODE_DEFAULT_SIZE + DEFAULT_EDGE_LENGTH + PLAIN_NODE_DEFAULT_SIZE; // 根节点和其子节点的最小距离
const PLAIN_DISTANCE = PLAIN_NODE_DEFAULT_SIZE * 2 + DEFAULT_EDGE_LENGTH; // 普通子节点与其子节点的最小距离
const SIBLING_MIN_DISTANCE_HALF = PLAIN_NODE_DEFAULT_SIZE + NODE_MIN_DISTANCE / 2 + 2; // 两个兄弟节点之间的最小距离的一半,另外添加一个常数,免受斥力影响

export async function reArrangeTreeFull(tree) {
  const stack = [tree.root], nodes = [], links = [], groupsMap = new Map();
  // 两个步骤
  // 1. 使用forceLink和forceCollide确定大体轮廓,将那些没有子节点的子节点分为一组
  // 2. 使用forceLink和forceManyBody进行微调
  while (stack.length > 0) {
    const node = stack.pop(), children = node.children, length = children.length;
    if (children.length !== 0) {
      // 考虑到子节点数量过多时，固定的父子节点距离不能获取合适的布局
      let noChildNum = 0, group = [];
      for (let i = 0; i < children.length; i++) {
        if (children[i].children.length === 0) {
          noChildNum++;
        }
      }
      const linkLength = Math.max(
        node.parent ? PLAIN_DISTANCE : ROOT_PLAIN_DISTANCE,
        noChildNum > 1 ? SIBLING_MIN_DISTANCE_HALF / Math.sin((Math.PI / noChildNum)) : 0
      );
      // 兄弟节点之间的夹角
      const betweenTheta = length > 1 ? Math.asin(SIBLING_MIN_DISTANCE_HALF / linkLength) * 2 : 0;
      // 如果是根节点，则使它的子节点均匀分布
      if (!node.parent) {
        const angle = (Math.PI * 2) / length;
        for (let i = 0; i < length; i++) {
          node.children[i].setPosition(
            node.x + linkLength * Math.cos(angle * i),
            node.y + linkLength * Math.sin(angle * i)
          );
        }
      } else if (length > 0) {
        // 如果不是根节点，则使它的子节点们沿着延长线两侧分布
        const parentAngle = atan(node.y - node.parent.y, node.x - node.parent.x);
        const initialAngle = parentAngle - (betweenTheta * (length - 1)) / 2;
        for (let i = 0; i < length; i++) {
          const theta = initialAngle + i * betweenTheta;
          node.children[i].setPosition(
            node.x + linkLength * Math.cos(theta),
            node.y + linkLength * Math.sin(theta)
          );
        }
      }
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.children.length > 0) {
          stack.push(children[i]);
        } else { // 没有子节点的将和node组成一组
          group.push(child);
        }
      }
      if (group.length > 0) {
        group.unshift(node); // 父节点放在第一个
        const points = group.map(c => ({
          x: c.x,
          y: c.y
        }));
        const hull = getHull(points);
        const circle = getHullCircle(hull);
        // 从父节点到当前节点的连线
        if (node.parent) {
          // 获取父节点的半径,父节点已经和其子节点形成了一组或是一个单独的节点
          const parent = groupsMap.has(node.parent.id) ? groupsMap.get(node.parent.id) : node.parent;
          links.push({
            source: node.parent.id,
            target: node.id,
            linkLength: parent.r + circle.r + node.r
          });
        }
        circle.id = node.id;
        circle.depth = node.depth;
        circle.prevX = node.x;
        circle.prevY = node.y;
        circle.r += node.r;
        circle.node = node;
        circle.nodes = group;
        nodes.push(circle);
        groupsMap.set(node.id, circle);
      } else { // 当所有子节点均有其子节点
        nodes.push({
          x: node.x,
          y: node.y,
          id: node.id,
          depth: node.depth,
          r: node.r,
          node: node
        });
      }
    } else {
      // 没有子节点，单独作为一个节点
      nodes.push({
        x: node.x,
        y: node.y,
        id: node.id,
        depth: node.depth,
        r: node.r,
        node: node
      });
    }
  }
  const rootX = tree.root.x, rootY = tree.root.y;
  return new Promise((resolve) => {
    forceSimulation(nodes)
      .alpha(0.5)
      .alphaMin(0.05)
      .alphaDecay(0.05)
      .on("end", async () => {
        await reArrangeTree(tree);
        resolve();
      })
      .on("tick", throttle(() => {
        let rootDisturbanceX, rootDisturbanceY, root = nodes[0]; // 要始终保持根节点的位置不变
        // 使其和根节点的初始位置对齐
        if (root.nodes) { // 父子节点作为一组
          rootDisturbanceX = root.x - root.prevX;
          rootDisturbanceY = root.y - root.prevY;
        } else {
          rootDisturbanceX = root.x - rootX;
          rootDisturbanceY = root.y - rootY;
        }
        for (let i = 1; i < nodes.length; i++) {
          const node = nodes[i];
          node.x -= rootDisturbanceX;
          node.y -= rootDisturbanceY;
        }
        for (let i = 1; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodes) {
            const offsetX = node.x - node.prevX, offsetY = node.y - node.prevY;
            for (let j = 0; j < node.nodes.length; j++) {
              // 加上整个组的偏移量
              node.nodes[j].setPosition(node.nodes[j].x + offsetX, node.nodes[j].y + offsetY);
            }
            node.prevX = node.x;
            node.prevY = node.y;
          } else {
            node.node.setPosition(node.x, node.y);
          }
        }
      }, 120))
      .force("link", forceLink(links)
        .id(d => d.id)
        .distance(l => l.linkLength))
      .force("collide", forceCollide(d => d.r));
  });
}

export function reArrangeTree(tree) {
  const nodes = tree.nodes.map((node) => ({
    x: node.x,
    y: node.y,
    id: node.id,
    depth: node.depth,
    r: node.r
  }));
  const stack = [tree.root], links = [];
  while (stack.length > 0) {
    const node = stack.pop();
    const children = node.children;
    if (children.length !== 0) {
      // 考虑到子节点数量过多时，固定的父子节点距离不能获取合适的布局
      let linkLength = Math.max(
        node.parent ? PLAIN_DISTANCE : ROOT_PLAIN_DISTANCE,
        children.length > 1 ? SIBLING_MIN_DISTANCE_HALF / Math.sin((Math.PI / children.length)) : 0
      );
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // 这是父节点和子节点的连线,长度还和子节点的子节点数目相关,这里经验性的设置一个值
        const newLinkLength = linkLength + !!child.children.length * 15;
        links.push({
          source: node.id,
          target: child.id,
          linkLength: newLinkLength
        });
        if (child.children.length > 0) {
          const ratio = linkLength / newLinkLength;
          // 用于驱逐其它兄弟节点,防止这些节点覆盖父节点到某个子节点的连接
          nodes.push({
            x: node.x + ratio * (child.x - node.x),
            y: node.y + ratio * (child.y - node.y),
            r: NODE_MIN_DISTANCE / 2,
            id: -child.id,
            virtual: true,
            parent: node,
            child: child,
            linkLength
          });
        }
        stack.push(child);
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
        // 要始终保持根节点的位置不变
        const disturbanceX = nodes[0].x - rootX, disturbanceY = nodes[0].y - rootY;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (!node.virtual) {
            tree.nodes[i].setPosition(node.x - disturbanceX, node.y - disturbanceY);
          }
        }
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.virtual) {
            const {parent, child, linkLength} = node;
            const distance = pointDistance(child.x, child.y, parent.x, parent.y);
            const ratio = linkLength / distance;
            node.x = parent.x + ratio * (child.x - parent.x);
            node.y = parent.y + ratio * (child.y - parent.y);
            node.vx = 0;
            node.vy = 0;
          }
        }
      }, 120))
      .force("link", forceLink(links)
        .id(d => d.id)
        .distance(l => l.linkLength))
      .force("charge", forceManyBody()
        .strength(node => {
          return -(300 * (.35 ** (node.depth + 1)));
        }))
      .force("collide", forceCollide(d => d.r + NODE_MIN_DISTANCE));
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
  return tree;
}