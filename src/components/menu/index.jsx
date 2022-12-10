import { useEffect, useRef } from "react";
import styled from "styled-components"

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
  background-color: #ffffff;
  background-clip: padding-box;
  border-radius: 8px;
  outline: none;
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08),0 3px 6px -4px rgba(0, 0, 0, 0.12),0 9px 28px 8px rgba(0, 0, 0, 0.05);
`;

const MenuItemContainer = styled.div`
  clear: both;
  margin: 0;
  padding: 5px 12px;
  color: rgba(0, 0, 0, 0.88);
  font-weight: normal;
  font-size: 14px;
  line-height: 1.5714285714285714;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 4px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
`

function MenuItem({ children, onClick }) {
  return (
    <MenuItemContainer
      onClick={onClick}
    >
      {children}
    </MenuItemContainer>
  )
}

function Menu({ children, show, setShow, x, y }) {
  const prevFun = useRef(null);
  const onClick = () => {
    if (show) {
      setShow(false);
    }
  }

  useEffect(() => {
    if (show) {
      // 避免添加重复的事件监听器
      if (!prevFun.current) {
        document.addEventListener("click", onClick, true);
        prevFun.current = onClick;
      }
    } else if (prevFun.current) {
      document.removeEventListener("click", prevFun.current, true);
      prevFun.current = null;
    }
  }, [show, setShow]);

  return (
    <MenuContainer
      show={show}
      x={x}
      y={y}
    >
      {children}
    </MenuContainer>
  )
}

export {
  Menu,
  MenuItem
};