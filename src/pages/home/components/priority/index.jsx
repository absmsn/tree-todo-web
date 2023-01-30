import { observer } from "mobx-react";
import style from "./index.module.css"

export default observer(({node}) => {
  let content = null;
  if (node.priority !== 0) {
    let text = "", className = "", x = node.x, y = node.y - node.r - 5;
    if (node.priority === 1) {
      text = "!";
      className = style.low;
    } else if (node.priority === 2) {
      text = "!!";
      className = style.medium;
    } else if (node.priority === 3) {
      text = "!!!";
      className = style.high;
    }
    content = <text
      x={x}
      y={y}
      className={className}
    >
      {text}
    </text>;
  }

  return (
    <>
      {content}
    </>
  )
});