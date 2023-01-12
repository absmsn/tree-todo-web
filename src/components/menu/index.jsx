import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import * as ReactDOM from 'react-dom';
import style from "./style.module.css";

// 设置display: none会使子组件接收不到事件，尚不清楚原因
// 使用visibility或transform或者设置宽高的方式替代
const MenuContainer = styled.div`
  transform-origin: top;
  transform: ${props => props.show ? "scaleY(1)": "scaleY(0)"};
  transition: transform 0.1s ease-in-out 0s;
  left: ${props => props.x || 0}px;
  top: ${props => props.y || 0}px;
  position: fixed;
  margin: 0;
  padding: 4px;
  list-style-type: none;
  background-color: rgba(255, 255, 255, 0.875);
  background-clip: padding-box;
  backdrop-filter: blur(2px);
  border-radius: 8px;
  outline: none;
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08),
    0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 9px 28px 8px rgba(0, 0, 0, 0.05);
  z-index: 2147483647;
`;

function MenuItem({ children, onClick, left, right, disabled = false }) {
  return (
    <div className={`${style.menuItem} ${disabled ? style.disabled : ""}`}
      onMouseDown={e => !disabled && onClick(e)}
    >
      <div className={style.left}>{left}</div>
        {children}
      <div className={style.right}>{right}</div>
    </div>
  )
}

function Menu({ children, show, setShow, x, y }) {
  const domRef = useRef(document.createElement("div"));
  const prevFun = useRef(null);
  const onMouseDown = e => {
    if (show) {
      // 事件是在冒泡阶段触发的或者事件在捕获阶段的且不是由子节点触发的
      if (e.eventPhase === 3 || (e.eventPhase === 1 && !e.composedPath().includes(domRef.current))) {
        setShow(false);
      }
    }
  }

  useEffect(() => {
    domRef.current.style.width = 0;
    document.body.appendChild(domRef.current);
    return (() => {
      document.body.removeChild(domRef.current);
    });
  }, []);

  useEffect(() => {
    if (show) {
      // 避免添加重复的事件监听器
      if (!prevFun.current) {
        document.body.addEventListener("mousedown", onMouseDown, true);
        domRef.current.addEventListener("mousedown", onMouseDown);
        prevFun.current = onMouseDown;
      }
    } else if (prevFun.current) {
      // show设为false但不移除节点时会执行
      document.body.removeEventListener("mousedown", prevFun.current, true);
      domRef.current.removeEventListener("mousedown", prevFun.current);
      prevFun.current = null;
    }
    return (() => {
      // show设为false且移除节点时会执行
      if (prevFun.current) {
        document.body.removeEventListener("mousedown", prevFun.current, true);
        domRef.current.removeEventListener("mousedown", prevFun.current);
        prevFun.current = null;
      }
    });
  }, [show, setShow])

  return (
    ReactDOM.createPortal(<MenuContainer
      show={show}
      x={x}
      y={y}
    >
      {children}
    </MenuContainer>, domRef.current)
  )
}

// 使用createPortal创建的节点，在触发事件时，会沿着dom树和React树同时
// 向上传递事件，所以需要创建一个组件来包裹原组件，在其中阻止事件向上传递
function MenuWrapper({ children, show, setShow, x, y }) {
  return (
    <div onMouseDown={e => e.stopPropagation()}>
      <Menu
        show={show}
        x={x}
        y={y}
        setShow={setShow}
      >
        {children}
      </Menu>
    </div>
  )
}

export {
  MenuWrapper as Menu,
  MenuItem
};