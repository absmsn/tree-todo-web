import { useEffect, useRef, useState } from "react"
import { observer } from "mobx-react";
import { Dropdown, Spin } from "antd";
import { useThrottle } from "../../../../hooks";
import { CheckOutlined } from "@ant-design/icons";
import { ROOT_NODE_DEFAULT_SIZE } from "../../../../constants/geometry";
import Tree from "../../components/tree";
import FloatPanel from "../../components/float-panel";
import TreeStore from "../../../../stores/tree";
import mapAPI from "../../../../apis/map";
import nodeAPI from "../../../../apis/node";
import {
  reArrangeTree,
  buildTreeFromNodeItems
} from "../../../../utils/graph";
import { randomBgColor } from "../../../../utils";
import style from "./style.module.css";
import SearchPanel from "../../components/search-panel";
import NodeMenu from "../../components/node-menu";

const initialPreMousePos = { x: 0, y: 0 };

const Canvas = observer(({ map }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const preMousePos = useRef(initialPreMousePos);
  const [loading, setLoading] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isMouseZoom, setIsMouseZoom] = useState(false);
 
  const items = [
    { label: "列表视图", key: "list-view", icon: map.showTaskList ? <CheckOutlined /> : false },
    { label: "下载为图片", key: "downloadImage"}
  ];

  useEffect(() => {
    async function fecthData() {
      if (map.exist && !map.tree) {
        const {offsetWidth, offsetHeight} = containerRef.current;
        setLoading(true);
        const nodes = (await mapAPI.getNodes(map.id)).data;
        const tree = buildTreeFromNodeItems(nodes, map.tags, offsetWidth / 2, offsetHeight / 2);
        map.setTree(tree);
        setLoading(false);
        await reArrangeTree(tree);
      }
    }
    fecthData();
  }, []);

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
    map.coordination.setViewBox({
      width: width * map.coordination.scale,
      height: height * map.coordination.scale
    });
  };

  // 当dom构建完毕后设置画布的尺寸
  useEffect(fitSvg, [containerRef, map.coordination.scale]);

  const onResize = () => {
    containerRef && fitSvg();
  };

  useEffect(() => {
    async function createTree() {
      if (!map.exist && canvasWidth && canvasHeight && !map.tree) {
        const tree = new TreeStore({
          x: canvasWidth / 2,
          y: canvasHeight / 2,
          r: ROOT_NODE_DEFAULT_SIZE
        }, {
          stroke: randomBgColor()
        });
        const result = (await nodeAPI.add({
          mapId: map.id,
          title: tree.root.title,
          finished: tree.root.finished,
          comment: tree.root.comment,
          priority: tree.root.priority
        })).data;
        tree.root.setId(result.id);
        map.setTree(tree);
      }
    }
    createTree();
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
      case "downloadImage":
        const s = new XMLSerializer().serializeToString(svgRef.current);
        const img = new Image();
        img.src = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(s)))}`;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const context = canvas.getContext('2d');
          context.drawImage(img, 0, 0);
          const a = document.createElement("a");
          a.href = canvas.toDataURL("image/png");
          a.download = "map.png";
          a.click();
        }
        break;
    }
  };

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
        map.coordination.setViewBox({
          left: map.coordination.viewBox.left - ((x / canvasWidth) * map.coordination.viewBox.width * (ratio - 1)),
          top: map.coordination.viewBox.top - ((y / canvasHeight) * map.coordination.viewBox.height * (ratio - 1)),
          width: map.coordination.viewBox.width * ratio,
          height: map.coordination.viewBox.height * ratio
        });
      } else if (e.deltaY < 0) { // 向外捏合
        map.coordination.setScale(map.coordination.scale / ratio);
        map.coordination.setViewBox({
          left: map.coordination.viewBox.left + ((x / canvasWidth) * map.coordination.viewBox.width * (1 - 1 / ratio)),
          top: map.coordination.viewBox.top + ((y / canvasHeight) * map.coordination.viewBox.height * (1 - 1 / ratio)),
          width: map.coordination.viewBox.width / ratio,
          height: map.coordination.viewBox.height / ratio
        });
      }
    } else {
      map.coordination.setViewBox({
        left: map.coordination.viewBox.left + 20 * Math.sign(e.deltaX) * map.coordination.scale,
        top: map.coordination.viewBox.top + 20 * Math.sign(e.deltaY) * map.coordination.scale
      });
    }
  }, 100, [
    map.coordination.scale,
    map.coordination.viewBox.left,
    map.coordination.viewBox.top,
    map.coordination.viewBox.width,
    map.coordination.viewBox.height
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
      map.coordination.setViewBox({
        left: map.coordination.viewBox.left - map.coordination.scale * (x - preMousePos.current.x),
        top: map.coordination.viewBox.top - map.coordination.scale * (y - preMousePos.current.y)
      });
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
      <div className={style.floatLine}>
        <SearchPanel
          map={map}
        />
        <FloatPanel
          map={map}
          isMouseZoom={isMouseZoom}
          setIsMouseZoom={setIsMouseZoom}
        />
      </div>
      <Spin spinning={loading}>
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
            viewBox={[
              map.coordination.viewBox.left,
              map.coordination.viewBox.top,
              map.coordination.viewBox.width,
              map.coordination.viewBox.height
            ].join(" ")}
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
      </Spin>
      {
        map.tree && <NodeMenu
          map={map}
          tree={map.tree}
          svgRef={svgRef}
        />
      }
    </div>
  )
});

export default Canvas;