import { useState } from "react";
import { observer } from "mobx-react";
import styled from "styled-components";
import { Tooltip } from "antd";
import {
  TagsOutlined,
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

export default observer(function FloatPanel({map, isMouseZoom, setIsMouseZoom, onCenter}) {
  const [isTagPanelShow, setIsTagPanelShow] = useState(false);

  return (
    <div className={style.container}>
      <TagManager map={map} show={isTagPanelShow}>
        <Tooltip placement="leftTop" title="管理标签" overlayClassName={style.tooltip}>
          <Icon
            className="icon-color"
            selected={isTagPanelShow}
            onClick={() => setIsTagPanelShow(!isTagPanelShow)}
          >
            <TagsOutlined />
          </Icon>
        </Tooltip>
      </TagManager>
      <Tooltip placement="leftTop" title="使用鼠标进行缩放" overlayClassName={style.tooltip}>
        <Icon
          className="icon-color"
          selected={isMouseZoom}
          onClick={() => setIsMouseZoom(!isMouseZoom)}
        >
          <FullscreenOutlined />
        </Icon>
      </Tooltip>
      <Tooltip placement="leftTop" title="居中" overlayClassName={style.tooltip}>
        <Icon className="icon-color" onClick={onCenter}>
          <FullscreenExitOutlined />
        </Icon>
      </Tooltip>
    </div>
  )
});