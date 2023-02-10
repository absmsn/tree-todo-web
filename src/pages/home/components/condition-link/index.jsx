import { Dropdown, Input } from "antd";
import { computed } from "mobx";
import { observer } from "mobx-react";
import { useMemo, useState } from "react";
import { getQuaraticBezierControlPoint } from "../../../../utils/graph";
import conditionAPI from "../../../../apis/condition";
import { atan } from "../../../../utils/math";
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

export default observer(({ tree, condition, source, target }) => {
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
      <Dropdown
        menu={{ items: menuItems, onClick: onClickMenu }}
        trigger="contextMenu"
      >
        <path
          d={`M ${pointPos[0]} ${pointPos[1]} Q ${controlPos.x} ${controlPos.y} ${pointPos[2]} ${pointPos[3]}`}
          onContextMenu={e => e.stopPropagation()}
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