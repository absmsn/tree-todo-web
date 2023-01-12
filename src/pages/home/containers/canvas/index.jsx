import { useEffect, useRef, useState } from "react"
import { observer } from "mobx-react";
import { useThrottle } from "../../../../hooks";
import { Dropdown } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { ROOT_NODE_DEFAULT_SIZE } from "../../../../constants/geometry";
import { randomBgColor } from "../../../../utils";
import Tree from "../../components/tree";
import FloatPanel from "../../components/float-panel";
import TreeStore from "../../../../stores/tree";
import style from "./style.module.css";

const initialPreMousePos = { x: 0, y: 0 };

const Canvas = observer(({ map }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const preMousePos = useRef(initialPreMousePos);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [viewBoxWidth, setViewBoxWidth] = useState(0);
  const [viewBoxHeight, setViewBoxHeight] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isMouseZoom, setIsMouseZoom] = useState(false);
 
  const items = [
    { label: '列表视图', key: 'list-view', icon: map.showTaskList ? <CheckOutlined /> : false }
  ];

  useEffect(() => {
    const observer = new ResizeObserver(onResize);
    observer.observe(containerRef.current);
    return (() => {
      observer.disconnect();
    });
  }, []);

  const fitSvg = () => {
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;
    setCanvasWidth(width);
    setCanvasHeight(height);
    setViewBoxWidth(width * map.coordination.scale);
    setViewBoxHeight(height * map.coordination.scale);
  };

  // 当dom构建完毕后设置画布的尺寸
  useEffect(fitSvg, [containerRef, map.coordination.scale]);

  const onResize = () => {
    containerRef && fitSvg();
  };

  useEffect(() => {
    if (canvasWidth && canvasHeight && !map.tree) {
      const tree = new TreeStore({
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        r: ROOT_NODE_DEFAULT_SIZE
      }, {
        stroke: randomBgColor()
      });
      map.setTree(tree);
    }
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
     // 禁止触控板捏合缩放
    const wheel = e => {
      if (e.target === svgRef.current) {
        e.stopPropagation();
        e.preventDefault();
        return false;
      }
    }
    document.addEventListener("wheel", wheel ,{ passive: false });
    const {left, top} = containerRef.current.getBoundingClientRect();
    map.coordination.setSvgOffset(left, top);
    return (() => {
      document.removeEventListener("wheel", wheel);
    });
  }, []);

  const onMenuClick = ({key}) => {
    switch (key) {
      case "list-view":
        map.setShowTaskList(!map.showTaskList);
        break;
    }
  };

  const onCenterMap = () => {
    const root = map.tree.root;
    map.coordination.setViewBox(root.x - viewBoxWidth / 2, root.y - viewBoxHeight / 2);
  }

  const onWheel = useThrottle(e => {
    if (!e.nativeEvent.composedPath().includes(svgRef.current)) {
      return;
    }
    // 双指捏合或者开启了鼠标缩放选项
    if (e.ctrlKey === true || isMouseZoom) {
      const ratio = 1.25; // 缩放因子，操作一次要放缩的比例
      const {left, top} = containerRef.current.getBoundingClientRect();
      const x = e.clientX - left, y = e.clientY - top;
      // 向内捏合
      if (e.deltaY > 0) {
        map.coordination.setScale(map.coordination.scale * ratio);
        map.coordination.setViewBox(
          map.coordination.viewBoxLeft - ((x / canvasWidth) * viewBoxWidth * (ratio - 1)),
          map.coordination.viewBoxTop - ((y / canvasHeight) * viewBoxHeight * (ratio - 1))
        );
        setViewBoxWidth(viewBoxWidth * ratio);
        setViewBoxHeight(viewBoxHeight * ratio);
      } else if (e.deltaY < 0) { // 向外捏合
        map.coordination.setScale(map.coordination.scale / ratio);
        map.coordination.setViewBox(
          map.coordination.viewBoxLeft + ((x / canvasWidth) * viewBoxWidth * (1 - 1 / ratio)),
          map.coordination.viewBoxTop + ((y / canvasHeight) * viewBoxHeight * (1 - 1 / ratio))
        );
        setViewBoxWidth(viewBoxWidth / ratio);
        setViewBoxHeight(viewBoxHeight / ratio);
      }
    } else {
      map.coordination.setViewBox(
        map.coordination.viewBoxLeft + 20 * Math.sign(e.deltaX) * map.coordination.scale,
        map.coordination.viewBoxTop + 20 * Math.sign(e.deltaY) * map.coordination.scale
      );
    }
  }, 100, [
    map.coordination.scale,
    map.coordination.viewBoxLeft,
    map.coordination.viewBoxTop,
    viewBoxWidth,
    viewBoxHeight
  ]);

  const onMouseDown = e => {
    if (e.target === svgRef.current && e.button === 0) {
      // 控制拖动画布
      setIsMouseDown(true);
      // 点击画布空白区域时，将已选中的节点设置未选中状态
      if (map.tree.selectedNode) {
        map.tree.unselectNode();
      }
      preMousePos.current.x = e.nativeEvent.clientX;
      preMousePos.current.y = e.nativeEvent.clientY;
    }
  }

  const onMouseUp = e => {
    if (e.target === svgRef.current && e.button === 0) {
      setIsMouseDown(false);
    }
  }

  const onMouseMove = e => {
    if (e.target === svgRef.current && e.button === 0 && isMouseDown) {
      // 在火狐中，移动距离过小时offsetX和offsetY偶尔会为0，在这里不使用
      const x = e.nativeEvent.clientX;
      const y = e.nativeEvent.clientY;
      map.coordination.setViewBox(
        map.coordination.viewBoxLeft - map.coordination.scale * (x - preMousePos.current.x),
        map.coordination.viewBoxTop - map.coordination.scale * (y - preMousePos.current.y)
      );
      preMousePos.current.x = x;
      preMousePos.current.y = y;
    }
  };

  const onMouseLeave = () => {
    if (isMouseDown) {
      setIsMouseDown(false);
    }
  }
 
  return (
    <div 
      className={`${style.mainContainer} h-full`}
      ref={containerRef}
    >
      <Dropdown 
        menu={{items, onClick: onMenuClick}}
        trigger={"contextMenu"}
      >
        <svg
          ref={svgRef}
          baseProfile="full"
          width={canvasWidth}
          height={canvasHeight}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          style={{cursor: isMouseDown ? "grabbing" : "default"}}
          viewBox={`${map.coordination.viewBoxLeft} ${map.coordination.viewBoxTop} ${viewBoxWidth} ${viewBoxHeight}`}
        >
          {
            map.tree && <Tree
              map={map}
              tree={map.tree}
              svgRef={svgRef}
              coordination={map.coordination}
            />
          }
        </svg>
      </Dropdown>
      <div className={style.floatPanelContainer}>
        <FloatPanel
          map={map}
          isMouseZoom={isMouseZoom}
          setIsMouseZoom={setIsMouseZoom}
          onCenter={onCenterMap}
        />
      </div>
    </div>
  )
});

export default Canvas;