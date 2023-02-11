export function dotProduct(x1, y1, x2, y2) {
  return x1 * x2 + y1 * y2;
}

// 求两个向量的叉积（看做z为0），并取在z方向上的值
// x ^ y = y1*z2 - y2*z1, z1*x2 - z2*x1, x1*y2 - x2*y1
export function crossProduct(x1, y1, x2, y2) {
  return x1 * y2 - y1 * x2;
}

export function pointDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2 , 2) + Math.pow(y1 - y2 , 2));
}

export function atan(offsetY, offsetX) {
  let theta = Math.atan(offsetY / offsetX);
  if (offsetX < 0) {
    theta += Math.PI;
  }
  return theta;
}

export function asin(offsetX, offsetY, hypotenuse) {
  if (!hypotenuse) {
    return 0;
  }
  let theta = Math.asin(offsetY / hypotenuse);
  if (offsetX < 0) {
    theta = Math.PI - theta;
  }
  return theta;
}