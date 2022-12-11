import { useEffect, useRef, useState, useMemo } from "react"
import { observer } from "mobx-react";
import { useThrottle } from "../../../../hooks";
import { Dropdown, Modal, Form, Input } from "antd";
import { CheckOutlined } from "@ant-design/icons"
import FloatPanel from "../../components/float-panel";
import Tree from "../../components/tree";
import { ROOT_NODE_DEFAULT_SIZE } from "../../../../constants/geometry";
import style from "./style.module.css";
import { randonBgColor } from "../../../../utils";

const Canvas = observer(({ map }) => {
  const container = useRef(null);
  const [scale, setScale] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [showTaskList, setShowTaskList] = useState(false);
  const [viewBoxLeft, setViewBoxLeft] = useState(0);
  const [viewBoxTop, setViewBoxTop] = useState(0);
  const [viewBoxWidth, setViewBoxWidth] = useState(0);
  const [viewBoxHeight, setViewBoxHeight] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isMouseZoom, setIsMouseZoom] = useState(false);
 
  const items = [
    { label: '添加树', key: 'add-tree' },
    { label: '列表视图', key: 'list-view', icon: showTaskList ? <CheckOutlined /> : false }
  ];

  const preMousePos = useMemo(() => ({ x: 0, y: 0 }), []);

  const fitSvg = () => {
    const width = container.current.offsetWidth;
    const height = container.current.offsetHeight;
    setCanvasWidth(width);
    setCanvasHeight(height);
    setViewBoxWidth(width * scale);
    setViewBoxHeight(height * scale);
  };

  // 当dom构建完毕后设置画布的尺寸
  useEffect(fitSvg, [container, scale]);

  const onResize = () => {
    container && fitSvg();
  };

  useEffect(() => {
    window.addEventListener("resize", onResize);
    return (() => {
      window.removeEventListener("resize", onResize);
    })
  }, [scale]); // FIXME: 修改每次scale就会执行effect的问题，尝试使用useReducer

  useEffect(() => {
     // 禁止触控板捏合缩放
     const wheel = e => {
      e.stopPropagation();
      e.preventDefault();
      return false;
    }
    document.addEventListener("wheel", wheel ,{ passive: false });
    return (() => {
      document.removeEventListener("wheel", wheel);
    });
  }, []);

  const onRightClick = ({key, domEvent}) => {
    switch (key) {
      case "add-tree":
        const {offsetLeft, offsetTop} = container.current;
        const {clientX, clientY, offsetX, offsetY} = domEvent.nativeEvent;
        // 将屏幕上的坐标转换为画布上的坐标
        map.addTree({
          x: ((clientX - offsetLeft - offsetX) / canvasWidth) * viewBoxWidth + viewBoxLeft,
          y: ((clientY - offsetTop - offsetY) / canvasHeight) * viewBoxHeight + viewBoxTop,
          r: ROOT_NODE_DEFAULT_SIZE
        }, {
          stroke: randonBgColor()
        });
        break;
      case "list-view":
        setShowTaskList(!showTaskList);
        break;
    }
  };

  const onWheel = useThrottle(e => {
    // 双指捏合
    if (e.ctrlKey === true) {
      const ratio = 1.5; // 缩放因子，操作一次要放缩的比例
      const x = e.nativeEvent.clientX - container.current.offsetLeft;
      const y = e.nativeEvent.clientY - container.current.offsetTop;
      // 向内捏合
      if (e.deltaY > 0) {
        setScale(scale * ratio);
        setViewBoxLeft(viewBoxLeft - ((x / canvasWidth) * viewBoxWidth * (ratio - 1)));
        setViewBoxTop(viewBoxTop - ((y / canvasHeight) * viewBoxHeight * (ratio - 1)));
        setViewBoxWidth(viewBoxWidth * ratio);
        setViewBoxHeight(viewBoxHeight * ratio);
      } else if (e.deltaY < 0) { // 向外捏合
        setScale(scale / ratio);
        setViewBoxLeft(viewBoxLeft + ((x / canvasWidth) * viewBoxWidth * (1 - 1 / ratio)));
        setViewBoxTop(viewBoxTop + ((y / canvasHeight) * viewBoxHeight * (1 - 1 / ratio)));
        setViewBoxWidth(viewBoxWidth / ratio);
        setViewBoxHeight(viewBoxHeight / ratio);
      }
    } else {
      setViewBoxLeft(viewBoxLeft + 20 * Math.sign(e.deltaX) * scale);
      setViewBoxTop(viewBoxTop + 20 * Math.sign(e.deltaY) * scale);
    }
  }, 100, [scale, viewBoxLeft, viewBoxTop, viewBoxWidth, viewBoxHeight]);

  const onMouseDown = e => {
    if (e.button === 0) {
      // 控制拖动画布
      setIsMouseDown(true);
      preMousePos.x = e.nativeEvent.clientX;
      preMousePos.y = e.nativeEvent.clientY;
    }
  }

  const onMouseUp = e => {
    if (e.button === 0) {
      setIsMouseDown(false);
    }
  }

  const onMouseMove = e => {
    if (e.button === 0 && isMouseDown) {
      // 在火狐中，移动距离过小时offsetX和offsetY偶尔会为0，在这里不使用
      const x = e.nativeEvent.clientX;
      const y = e.nativeEvent.clientY;
      setViewBoxLeft(viewBoxLeft - scale * (x - preMousePos.x));
      setViewBoxTop(viewBoxTop - scale * (y - preMousePos.y));
      preMousePos.x = x;
      preMousePos.y = y;
    }
  };
 
  return (
    <div 
      className={`${style.mainContainer} full-height`}
      ref={container}
    >
      <Dropdown 
        menu={{items, onClick: onRightClick}}
        trigger={['contextMenu']}
      >
        <svg
          id="main-svg"
          xmlns="http://www.w3.org/2000/svg"
          baseProfile="full"
          width={canvasWidth}
          height={canvasHeight}
          viewBox={`${viewBoxLeft} ${viewBoxTop} ${viewBoxWidth} ${viewBoxHeight}`}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          style={{cursor: isMouseDown ? "grabbing" : "default"}}
        >
          {
            map.trees.map(tree => 
              <Tree tree={tree} scale={scale} key={tree.id} />
            )
          }
        </svg>
      </Dropdown>
      <div className={style.floatPanelContainer}>
        <FloatPanel
          isMouseZoom={isMouseZoom}
          setIsMouseZoom={setIsMouseZoom}
        />
      </div>
    </div>
  )
});

export default Canvas;