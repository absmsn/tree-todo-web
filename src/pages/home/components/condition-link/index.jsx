import { Dropdown } from "antd";
import { computed } from "mobx";
import { observer } from "mobx-react";
import { useMemo } from "react";
import { getQuaraticBezierControlPoint } from "../../../../utils/graph";
import style from "./index.module.css";

const arrowLength = 10;
const arrowAngle = Math.PI / 6; // 箭头和所指方向的夹角

const menuItems = [
  { key: "remove-link", label: "删除连接" }
];

export default observer(({tree, source, target}) => {
  const controlPos = computed(() => {
    return getQuaraticBezierControlPoint({
      x: source.x,
      y: source.y
    }, {
      x: target.x,
      y: target.y
    }, tree.root);
  }).get();
  const pointPos = useMemo(() => {
    const x1 = source.x, y1 = source.y, r1 = source.r;
    const x2 = target.x, y2 = target.y, r2 = target.r;
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const sx = x1 + r1 * (x2 - x1) / distance;
    const sy = y1 + r1 * (y2 - y1) / distance;
    const tx = x2 - r2 * (x2 - x1) / distance;
    const ty = y2 - r2 * (y2 - y1) / distance;

    // 计算箭头的两个点
    let theta = Math.atan((controlPos.y - ty) / (controlPos.x - tx));
    if (theta < 0 && controlPos.x - tx <= 0) {
      theta += Math.PI; 
    } else if (theta > 0 && controlPos.x - tx <= 0) {
      theta -= Math.PI;
    }
    return [
      sx,
      sy,
      tx,
      ty,
      tx + Math.cos(theta + arrowAngle) * arrowLength, // 坐标系不同，此处要用减号
      ty + Math.sin(theta + arrowAngle) * arrowLength,
      tx + Math.cos(theta - arrowAngle) * arrowLength,
      ty + Math.sin(theta - arrowAngle) * arrowLength
    ];
  }, [source.x, source.y, target.x, target.y]);

  const onClickMenu = ({key}) => {
    switch(key) {
      case "remove-link":
        source.removePrecursor(target);
        break;
    }
  }

  return (
    <>
      <Dropdown
        menu={{items: menuItems, onClick: onClickMenu}}
        trigger={"contextMenu"}
      >
        <path
          d={`M ${pointPos[0]} ${pointPos[1]} Q ${controlPos.x} ${controlPos.y} ${pointPos[2]} ${pointPos[3]}`}
          className={`${style.arrow} ${source.finished ? style.finished : ""}`}
        >
        </path>
      </Dropdown>
      <polyline
        points={`${pointPos[4]} ${pointPos[5]}, ${pointPos[2]} ${pointPos[3]}, ${pointPos[6]} ${pointPos[7]}`}
        className={`${style.line} ${source.finished ? style.finished : ""}`}
      >
      </polyline>
      {
        source.finished && !target.finished && <circle
          cx={pointPos[2]}
          cy={pointPos[3]}
          r={5}
          className={style.unfinshedWarn}
        >
        </circle>
      }
      
    </>
  )
});