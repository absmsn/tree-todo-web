import { useState } from "react";
import { observer } from "mobx-react";
import styled from "styled-components";
import { Tooltip } from "antd";
import {
  TagsOutlined,
  SelectOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from "@ant-design/icons";
import TagManager from "../tag-manager";
import style from "./index.module.css";

const Icon = styled.div`
  display: inline-flex;
  margin: 4px;
  padding: 4px;
  border-radius: 10%;
  &:hover {
    background-color: ${props => props.selected ? "var(--selected-bgColor)" : "var(--hover-bgColor)"}
  }
  background-color: ${props => props.selected ? "var(--selected-bgColor)" : "var(--bgColor)"}
`;

export default observer(function FloatPanel({map, isMouseZoom, setIsMouseZoom}) {
  const [isTagPanelShow, setIsTagPanelShow] = useState(false);

  const resetScale = () => {
    if (map.coordination.scale > 1) {
      map.coordination.setViewBox({
        left: map.coordination.viewBox.left + .5 * map.coordination.viewBox.width * (1 - 1 / map.coordination.scale),
        top: map.coordination.viewBox.top + .5 * map.coordination.viewBox.height * (1 - 1 / map.coordination.scale),
        width: map.coordination.viewBox.width / map.coordination.scale,
        height: map.coordination.viewBox.height / map.coordination.scale
      });
    } else {
      map.coordination.setViewBox({
        left: map.coordination.viewBox.left - .5 * map.coordination.viewBox.width * (1 - map.coordination.scale),
        top: map.coordination.viewBox.top - .5 * map.coordination.viewBox.height * (1 - map.coordination.scale),
        width: map.coordination.viewBox.width * map.coordination.scale,
        height: map.coordination.viewBox.height * map.coordination.scale
      });
    }
    map.coordination.setScale(1);
  }

  const onCenterMap = () => {
    let minX = Number.MAX_SAFE_INTEGER, maxY = Number.MIN_SAFE_INTEGER, maxX = maxY, minY = minX;
    for (let node of map.tree.nodes) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    }
    map.coordination.setViewBox({
      left: (minX + maxX) / 2 - map.coordination.viewBox.width / 2, 
      top: (minY + maxY) / 2 - map.coordination.viewBox.height / 2
    });
  }

  return (
    <div className={style.container}>
      <TagManager map={map} show={isTagPanelShow}>
        <Tooltip placement="bottom" title="管理标签" overlayClassName={"tooltip-style"}>
          <Icon
            className="icon-color"
            selected={isTagPanelShow}
            onClick={() => setIsTagPanelShow(!isTagPanelShow)}
          >
            <TagsOutlined />
          </Icon>
        </Tooltip>
      </TagManager>
      <Tooltip placement="bottom" title="使用鼠标进行缩放" overlayClassName={"tooltip-style"}>
        <Icon
          className="icon-color"
          selected={isMouseZoom}
          onClick={() => setIsMouseZoom(!isMouseZoom)}
        >
          <FullscreenOutlined />
        </Icon>
      </Tooltip>
      <Tooltip placement="bottom" title="居中" overlayClassName={"tooltip-style"}>
        <Icon className="icon-color" onClick={onCenterMap}>
          <FullscreenExitOutlined />
        </Icon>
      </Tooltip>
      <Tooltip placement="bottomRight" title="重置缩放比例" overlayClassName={"tooltip-style"}>
        <Icon className="icon-color" onClick={resetScale}>
          <SelectOutlined />
        </Icon>
      </Tooltip>
    </div>
  )
});