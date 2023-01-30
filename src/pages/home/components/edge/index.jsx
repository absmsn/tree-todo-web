import { observer } from "mobx-react"
import { useState, useEffect } from "react";

const initialPos = {
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0
};

export default observer(function Edge({ edge }) {
  const [joinPos, setJoinPos] = useState(initialPos);

  useEffect(() => {
    const x1 = edge.source.x, y1 = edge.source.y, r1 = edge.source.r;
    const x2 = edge.target.x, y2 = edge.target.y, r2 = edge.target.r;
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    if (distance !== 0) {
      setJoinPos({
        x1: x1 + r1 * (x2 - x1) / distance,
        y1: y1 + r1 * (y2 - y1) / distance,
        x2: x2 - r2 * (x2 - x1) / distance,
        y2: y2 - r2 * (y2 - y1) / distance
      });
    }
  }, [edge.source.x, edge.source.y, edge.target.x, edge.target.y, edge.source.r, edge.target.r]);

  return (
    <line
      x1={joinPos.x1}
      y1={joinPos.y1}
      x2={joinPos.x2}
      y2={joinPos.y2}
      stroke={edge.edgeStyle.stroke}
      strokeWidth={edge.edgeStyle.strokeWidth}
    />
  )
});