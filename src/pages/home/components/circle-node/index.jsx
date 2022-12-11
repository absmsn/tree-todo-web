import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import NodeMenu from "../node-menu";

export default observer(function CircleNode({ node, tree, scale }) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [isMenuShow, setIsMenuShow] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isTitleInputShow, setIsTitleInputShow] = useState(true);
  const [prevMousePos] = useState({x: 0, y: 0});
  const [menuPos, setMenuPos] = useState({x: 0, y: 0});
  const [foreignSize, setForeignSize] = useState({width: node.r * 2, height: 0});
  const inputLength = node.r * 2;

  useEffect(() => {
    if (isTitleInputShow) {
      setForeignSize({
        width: inputRef.current.offsetWidth,
        height: inputRef.current.offsetHeight
      });
      inputRef.current.select();
      const onKeyUp = e => {
        // 输入回车，关闭输入框
        if (e.key === "Enter") {
          node.changeTitle(inputRef.current.value);
          setIsTitleInputShow(false);
        }
      }
      document.addEventListener("keyup", onKeyUp);
      return (() => {
        document.removeEventListener("keyup", onKeyUp);
      });
    }
  }, [isTitleInputShow]);

  const onMouseDown = e => {
    if (e.button === 0) {
      e.stopPropagation();
      setIsMouseDown(true);
      prevMousePos.x = e.clientX;
      prevMousePos.y = e.clientY;
    }
  }

  const onMouseMove = e => {
    if (isMouseDown && e.button === 0) {
      e.stopPropagation();
      let stack = [node];
      while (stack.length > 0) {
        const node = stack.pop();
        node.changePosition(
          node.x + (e.clientX - prevMousePos.x) * scale,
          node.y + (e.clientY - prevMousePos.y) * scale
        );
        for (let i = 0; i < node.children.length; i++) {
          stack.push(node.children[i]);
        }
      }
      prevMousePos.x = e.clientX;
      prevMousePos.y = e.clientY;
    }
  }

  const onMouseUp = e => {
    if (e.button === 0) {
      e.stopPropagation();
      if (isMouseDown) {
        setIsMouseDown(false);
      }
      if (!isTitleInputShow && e.detail === 2) { // 双击
        setIsTitleInputShow(true);
      }
    }
  }

  const onMouseLeave = e => {
    e.stopPropagation();
    if (isMouseDown) {
      setIsMouseDown(false);
    }
  }

  const onContextMenu = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!isMenuShow) {
      setIsMenuShow(true);
      setMenuPos({
        x: e.clientX,
        y: e.clientY
      });
    }
  }
 
  return (
    <g
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
      style={{cursor: isMouseDown ? "grabbing" : "default"}}
    >
      <text 
        x={node.x}
        y={node.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="14px"
        style={{ userSelect: "none" }}
      >
        {node.title}
      </text>
      <circle 
        cx={node.x}
        cy={node.y}
        r={node.r}
        fill="transparent"
        stroke={node.stroke}
        strokeWidth={node.strokeWidth}
      />
      {
        isMouseDown && <circle
          cx={node.x}
          cy={node.y}
          r={node.r + node.strokeWidth + 4}
          fill="transparent"
          stroke={node.stroke}
          strokeWidth={1}
          strokeDasharray="5 2"
        />
      }
      {
        isTitleInputShow && <foreignObject
          x={node.x}
          y={node.y}
          width={foreignSize.width}
          height={foreignSize.height}
          transform={`translate(${-foreignSize.width / 2} ${-foreignSize.height / 2})`}
        >
          <input 
            ref={inputRef}
            value={node.title}
            style={{ width: inputLength }}
            onBlur={() => setIsTitleInputShow(false)}
            onChange={e => node.changeTitle(e.target.value) }
          />
        </foreignObject>
      }
      {
        isMenuShow && <NodeMenu
            x={menuPos.x}
            y={menuPos.y}
            node={node}
            tree={tree}
            isMenuShow={isMenuShow}
            setIsMenuShow={setIsMenuShow}
          />
      }
    </g>
  )
});