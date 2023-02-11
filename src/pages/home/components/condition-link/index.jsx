import { useEffect, useMemo, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react";
import { Dropdown, Input } from "antd";
import { asin, atan, crossProduct } from "../../../../utils/math";
import { getQuaraticBezierControlPoint } from "../../../../utils/graph";
import conditionAPI from "../../../../apis/condition";
import style from "./index.module.css";

const arrowLength = 10;
const arrowAngle = Math.PI / 6; // 箭头和所指方向的夹角
const inputWidth = 48, inputHeight = 20;
const inputStyle = {
  width: inputWidth,
  height: inputHeight
};

const menuItems = [
  { key: "remove-link", label: "删除连接" },
  { key: "edit-text", label: "编辑提示" }
];

const initialMenuPos = {x: 0, y: 0};

export default observer(({ map, condition, source, target }) => {
  const controlPos = computed(() => {
    return getQuaraticBezierControlPoint({
      x: source.x,
      y: source.y
    }, {
      x: target.x,
      y: target.y
    }, map.tree.root);
  }).get();
  const pointPos = useMemo(() => {
    const offsetX = target.x - source.x, offsetY = target.y - source.y;
    // 源节点中心到目的节点中心向量的角度
    const pointTheta = asin(offsetX, offsetY, Math.sqrt(offsetX ** 2 + offsetY ** 2));
    const cross = crossProduct(target.x - source.x, target.y - source.y, controlPos.x - source.x, controlPos.y - source.y);
    // 贝塞尔曲线的出发点和终止点,与控制点的方位有关
    const fromTheta = pointTheta + Math.sign(cross) * Math.PI / 3;
    const toTheta = pointTheta + Math.sign(cross) * (2 / 3 * Math.PI);
    const sx = source.x + source.r * Math.cos(fromTheta);
    const sy = source.y + source.r * Math.sin(fromTheta);
    const tx = target.x + target.r * Math.cos(toTheta);
    const ty = target.y + target.r * Math.sin(toTheta);

    // 计算箭头的两个点
    const theta = atan(controlPos.y - ty, controlPos.x - tx);
    const bottomCenterXToCx = controlPos.x - sx / 2 - tx / 2; // 起点终点连线的中点到控制点方向向量x
    const bottomCenterYToCy = controlPos.y - sy / 2 - ty / 2; // 起点终点连线的中点到控制点方向向量y
    const bottomToCDistance = Math.sqrt(bottomCenterXToCx ** 2 + bottomCenterYToCy ** 2);
    return [
      sx,
      sy,
      tx,
      ty,
      tx + Math.cos(theta + arrowAngle) * arrowLength,
      ty + Math.sin(theta + arrowAngle) * arrowLength,
      tx + Math.cos(theta - arrowAngle) * arrowLength,
      ty + Math.sin(theta - arrowAngle) * arrowLength,
      (sx + 2 * controlPos.x + tx) / 4 + (bottomCenterXToCx / bottomToCDistance) * 5, // 二次贝塞尔曲线的中心点再向外稍微偏移一些
      (sy + 2 * controlPos.y + ty) / 4 + (bottomCenterYToCy / bottomToCDistance) * 5
    ];
  }, [source.x, source.y, target.x, target.y]);
  const [text, setText] = useState(condition.text);
  const [isInputShow, setIsInputShow] = useState(false);
  const [isDropdownShow, setIsDropdownShow] = useState(false);
  const [menuPos, setMenuPos] = useState(initialMenuPos);

  useEffect(() => {
    if (isDropdownShow) {
      const fn = () => setTimeout(() => setIsDropdownShow(false), 50);
      document.addEventListener("mousedown", fn);
      return (() => document.removeEventListener("mousedown", fn));
    }
  }, [isDropdownShow]);

  const onClickMenu = ({ key }) => {
    switch (key) {
      case "remove-link":
        source.removeCondition(target);
        conditionAPI.remove(source.id, target.id);
        break;
      case "edit-text":
        setIsInputShow(true);
        break;
    }
    setIsDropdownShow(false);
  }

  const onContextMenu = e => {
    e.stopPropagation();
    setMenuPos(map.coordination.clientToSvg(e.clientX, e.clientY));
    setIsDropdownShow(true);
  }

  const onFinished = () => {
    if (text !== condition.text) {
      condition.setText(text);
      conditionAPI.edit(source.id, target.id, { text });
    }
    setIsInputShow(false);
  }

  return (
    <>
      {
        isDropdownShow && <Dropdown
          menu={{ items: menuItems, onClick: onClickMenu}}
          open={isDropdownShow}
        >
          <circle
            cx={menuPos.x}
            cy={menuPos.y}
            r={1}
            fill="transparent"
          />
        </Dropdown>
      }
      <path
        d={`M ${pointPos[0]} ${pointPos[1]} Q ${controlPos.x} ${controlPos.y} ${pointPos[2]} ${pointPos[3]}`}
        className={`${style.arrow} ${source.finished ? style.finished : ""}`}
        onContextMenu={onContextMenu}
      >
      </path>
      <polyline
        points={`${pointPos[4]} ${pointPos[5]}, ${pointPos[2]} ${pointPos[3]}, ${pointPos[6]} ${pointPos[7]}`}
        className={`${style.line} ${source.finished ? style.finished : ""}`}
      >
      </polyline>
      {
        source.finished && !target.finished && <circle
          cx={pointPos[2]}
          cy={pointPos[3]}
          r={8}
          className={style.unfinshedWarn}
        >
        </circle>
      }
      {
        isInputShow
          ? <foreignObject
            x={pointPos[8] - inputWidth / 2}
            y={pointPos[9] - inputHeight / 2}
            width={inputWidth}
            height={inputHeight}
          >
            <Input
              size="small"
              value={text}
              onPressEnter={onFinished}
              onChange={e => setText(e.target.value)}
              style={inputStyle}
            />
          </foreignObject>
          : <text
            x={pointPos[8]}
            y={pointPos[9]}
            onDoubleClick={() => setIsInputShow(true)}
            className={style.text}
          >
            {condition.text}
          </text>
      }
    </>
  )
});