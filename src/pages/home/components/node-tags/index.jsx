import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Tag } from "antd";
import nodeAPI from "../../../../apis/node";
import style from "./index.module.css";

const minSize = 1;

export default observer(({node, tags}) => {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(minSize); // 设置为0会使容器无宽度和高度
  const [height, setHeight] = useState(minSize);

  const onRemoveTag = async (tag) => {
    await nodeAPI.removeTag(node.id, tag.id);
    node.removeTag(tag.id)
  }

  useEffect(() => {
    setWidth(containerRef.current.offsetWidth || minSize);
    setHeight(containerRef.current.offsetHeight || minSize);
  }, [tags]);

  return <foreignObject 
    x={node.x - width / 2}
    y={node.y + node.r + 4}
    width={width}
    height={height}
  >
    <div ref={containerRef} className={style.wrapper}>
      {
        tags.map(tag => <Tag
          color={tag.color}
          className={style.tag}
          closable={true}
          onClose={() => onRemoveTag(tag)}
          key={tag.id}
        >
          {tag.name}
        </Tag>)
      }  
    </div>
  </foreignObject>
});