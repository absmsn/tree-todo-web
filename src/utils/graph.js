import {
  DEFAULT_EDGE_LENGTH,
  DEFAULT_STROKE_WIDTH,
  ROOT_NODE_DEFAULT_SIZE,
  PLAIN_NODE_DEFAULT_SIZE
} from "../constants/geometry";
import { isNull, isNumber } from "lodash";
import { 
  atan,
  crossProduct,
  pointDistance
} from "./math";
import TreeStore from "../stores/tree";
import ConditionStore from "../stores/condition";
import { count, randomBgColor } from ".";
import { flextree } from "d3-flextree";

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
  // 根号3倍起始点和终止点距离,即两点连线旋转60度
  const length = pointDistance(centerX, centerY, end.x, end.y) * (3 ** .5);
  const cross = crossProduct(offsetX, offsetY, parent.x - start.x, parent.y - start.y);
  // 控制点和父节点中心分别在start和end连线的两侧
  const rotatedTheta = theta - (Math.sign(cross) || 1) * (Math.PI / 2);
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

export function reArrangeTree(tree) {
  const linkLength = 20, spacing = 12;
  const flexRoot = {
    children: [],
    size: [tree.root.r * 2, tree.root.r * 2 + linkLength],
    sourceNode: tree.root
  };
  const queueSource = [tree.root]; // 遍历原始的树所需的队列
  const queueFlex = [flexRoot]; // 遍历生成的树所需的队列
  while (queueSource.length > 0) {
    const nodeSource = queueSource.pop(), nodeFlex = queueFlex.pop();
    if (nodeSource.childrenWrapped) continue;
    for (let i = 0; i < nodeSource.children.length; i++) {
      const child = nodeSource.children[i];
      // 如果父节点已经和子节点聚成簇,则跳过这些没有子节点的子节点
      if (nodeFlex.linkLength && !child.children.length) {
        continue;
      }
      // 没有子节点的子节点的数目
      const noChildNum = count(child.children, c => !c.children.length);
      if (child.children.length > 0 && !child.childrenWrapped && child.parent && noChildNum > 2) {
        // 将父节点和子节点组成一个簇,一同参与布局的生成
        const oneChild = child.children[0];
        // 子节点没有围绕父节点形成一圈时子节点中心到父节点中心的距离
        const plainDistance = child.r + linkLength + oneChild.r;
        const parentChildDistance = Math.max(
          plainDistance,
          (oneChild.r + spacing / 2) / Math.sin((Math.PI / noChildNum))
        );
        // 子节点数目足够围绕父节点一圈
        const newNode = {
          children: [],
          sourceNode: child,
          linkLength: parentChildDistance,
          noChildNum: noChildNum
        };
        let minX = 0, maxX = minX, minY = -child.r, maxY = child.r;
        const theta = Math.asin((oneChild.r + spacing / 2) / parentChildDistance) * 2;
        const startAngle = -Math.PI / 2 + theta * ((noChildNum - 1) / 2);
        // 计算父节点及其子节点的包围盒
        for (let i = 0, j = 0; i < child.children.length; i++) {
          const c = child.children[i];
          if (!c.children.length) {
            const x = parentChildDistance * Math.cos(theta * j - startAngle);
            const y = parentChildDistance * Math.sin(theta * j - startAngle);
            minX = Math.min(minX, x - c.r);
            maxX = Math.max(maxX, x + c.r);
            minY = Math.min(minY, y - c.r);
            maxY = Math.max(maxY, y + c.r);
            j++;
          }
        }
        newNode.size = [maxX - minX, maxY - minY + linkLength];
        // 父节点的中心到包围盒top边的中心
        newNode.offsetY = minY;

        nodeFlex.children.push(newNode);
        queueFlex.unshift(newNode);
        queueSource.unshift(child);
      } else {
        const size = child.r * 2;
        const newNode = {
          children: [],
          size: [size, size + linkLength],
          sourceNode: child
        };
        nodeFlex.children.push(newNode);
        queueFlex.unshift(newNode);
        queueSource.unshift(child);
      }
    }
  }

  let minLeft = 0, maxRight = 0;
  const layout = flextree({
    spacing: spacing
  });
  const treeData = layout.hierarchy(flexRoot);
  layout(treeData);

  const setLeftRight = () => {
    treeData.each(node => {
      if ((node.x - node.xSize / 2) < minLeft) minLeft = node.x - node.xSize / 2;
      if ((node.x + node.xSize / 2) > maxRight) maxRight = node.x + node.xSize / 2;
    });
    minLeft -= spacing / 2;
    maxRight += spacing / 2;
  }
  setLeftRight();
  let maxSpan = maxRight - minLeft;
  const rs = [0]; // 为每层设置一个粗略的半径
  // 有第1层的节点,要保证第一层的半径不能小于最小的值
  if (treeData.height > 0) {
    const sourceNode = treeData.root.data.sourceNode;
    const minR = sourceNode.r + sourceNode.children[0].r + linkLength, r = maxSpan / (Math.PI * 2);
    rs[1] = r > minR ? r : minR;
  }
  for (let i = 2; i <= treeData.height; i++) {
    // 每向外一层,半径增加一点
    rs.push(rs[rs.length - 1] + linkLength + PLAIN_NODE_DEFAULT_SIZE * 2);
  }
  if (treeData.height > 1) {
    // 让兄弟节点尽量靠近
    let depth = 2, queue = treeData.root.children.flatMap(node => node.children || []);
    treeData.root.children.forEach(node => node.originalX = node.x);
    while (queue.length) {
      const length = queue.length, ratio = rs[depth] / rs[1]; // 从原始的大小拉伸到当前的圆周放大了多少
      for (let i = 0; i < length; i++) {
        const node = queue.pop();
        node.originalX = node.x;
        node.x = node.parent.x + (node.x - node.parent.originalX) / ratio;
        for (let j = 0; j < node.children?.length; j++) {
          queue.unshift(node.children[j]);
        }
      }
      depth++;
    }
    setLeftRight();
    const shrink = maxSpan - (maxRight - minLeft); // 周长减少了多少
    maxSpan = maxRight - minLeft;
    for (let i = 1; i < rs.length; i++) {
      rs[i] -= shrink / (Math.PI * 2);
    }
    // 将根节点的每棵子树向左移动,使其不留空隙
    let sum = 0, children = treeData.children; // 所有子树移动的总距离
    for (let i = 1; i < children.length; i++) {
      let minLayerDistance = Number.MAX_SAFE_INTEGER;
      const leftNodes = [], rightNodes = []; // 左子树每层的最后一个节点和右子树的每层第一个节点
      const leftQueue = [children[i - 1]], rightQueue = [children[i]];
      while (leftQueue.length) {
        let size = leftQueue.length;
        for (let i = 0; i < size; i++) {
          const node = leftQueue.pop();
          if (i === size - 1) {
            leftNodes.push(node);
          }
          for (let j = 0; j < node.children?.length; j++) {
            leftQueue.unshift(node.children[j]);
          }
        }
      }
      while (rightQueue.length) {
        let size = rightQueue.length;
        for (let i = 0; i < size; i++) {
          const node = rightQueue.pop();
          if (i === 0) {
            rightNodes.push(node);
          }
          for (let j = 0; j < node.children?.length; j++) {
            rightQueue.unshift(node.children[j]);
          }
        }
      }
      for (let i = 0; i < rightNodes.length; i++) {
        const rightNode = rightNodes[i];
        for (let j = 0; j < leftNodes.length; j++) {
          const leftNode = leftNodes[j];
          if ((rightNode.bottom > leftNode.top && rightNode.top < leftNode.bottom)) {
            minLayerDistance = Math.min(minLayerDistance, rightNode.left - leftNode.right);
          }
        }
      }
      const movement = minLayerDistance - spacing;
      children[i].each(node => node.x -= movement);
      sum = movement;
    }
    maxSpan -= sum;
    // 周长减小了,半径也要相应减小
    for (let i = 1; i < rs.length; i++) {
      rs[i] -= sum / (Math.PI * 2);
    }
  }
  
  const rootDisturbanceX = tree.root.x - treeData.x, rootDisturbanceY = tree.root.y - treeData.y;
  treeData.root.data.sourceNode.setPosition(rootDisturbanceX, rootDisturbanceY);
  let queue = [...treeData.root.children || []];
  if (queue.length > 0) {
    rs[0] = rs[1] - queue[0].y - queue[0].data.sourceNode.r;
  }
  while (queue.length) {
    const length = queue.length;
    for (let i = 0; i < length; i++) {
      let node = queue.pop(), r = node.y + rs[0];
      if (node.data.linkLength) {
        const linkLength = node.data.linkLength;
        if (node.data.offsetY) {
          r -= node.data.offsetY;
        }
        const children = node.data.sourceNode.children;
        // 根节点到当前父节点的向量的角度
        const angle = (node.x - minLeft) / maxSpan * (Math.PI * 2);
        const theta = Math.asin((children[0].r + spacing / 2) / linkLength) * 2;
        const startAngle = angle + theta * ((node.data.noChildNum - 1) / 2);
        const parentX = r * Math.cos(angle) + rootDisturbanceX;
        const parentY = r * Math.sin(angle) + rootDisturbanceY;
        node.data.sourceNode.setPosition(parentX, parentY);
        for (let j = 0, k = 0, l = 0; j < children.length; j++) {
          const child = children[j];
          if (!child.children.length) {
            const x = parentX + linkLength * Math.cos(startAngle - theta * k);
            const y = parentY + linkLength * Math.sin(startAngle - theta * k);
            children[j].setPosition(x, y);
            k++;
          } else {
            queue.unshift(node.children[l++]);
          }
        }
      } else {
        // flex节点的坐标是top边中心的坐标,要转换为节点中心的坐标
        r += (node.ySize - linkLength) / 2;
        const angle = (node.x - minLeft) / maxSpan * (Math.PI * 2);
        const x = r * Math.cos(angle) + rootDisturbanceX;
        const y = r * Math.sin(angle) + rootDisturbanceY;
        node.data.sourceNode.setPosition(x, y);
        for (let j = 0; j < node.children?.length; j++) {
          queue.unshift(node.children[j]);
        }
      }
    }
  }
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