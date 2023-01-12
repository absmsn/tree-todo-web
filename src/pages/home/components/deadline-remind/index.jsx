import { Popover } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExclamationCircleOutlined } from "@ant-design/icons";

export default function DeadlineRemind({ node, setNearDeadline }) {
  const iconRef = useRef(null);
  const [tipWidth, setTipWidth] = useState(1);
  const [tipHeight, setTipHeight] = useState(1);
  const timeStr = useMemo(() => {
    const hours = node.endTime.getHours(), minutes = node.endTime.getMinutes();
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  } ,[node.endTime]);

  useEffect(() => {
    setTipWidth(iconRef.current.offsetWidth);
    setTipHeight(iconRef.current.offsetHeight);
  }, []);

  return (
    <Popover
      content={
        <div className="overflow-hidden">
          <div>任务将于{timeStr}结束</div>
          <a
            className="mt-1 float-right"
            onClick={() => setNearDeadline(false)}
          >
            了解，关闭闪烁
          </a>
        </div>
      }
      trigger={"click"}
      overlayClassName={"text-sm"}
    >
      <foreignObject
        x={node.x + node.r}
        y={node.y - node.r}
        width={tipWidth}
        height={tipHeight}
      >
        <ExclamationCircleOutlined
          ref={iconRef}
          style={{
            position: "absolute",
            fontSize: 12,
            color: "var(--dimmed-color)"
          }}
        />
      </foreignObject>
    </Popover>
  )
}