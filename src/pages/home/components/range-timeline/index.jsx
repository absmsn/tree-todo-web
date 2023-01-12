import { observer } from "mobx-react";
import { Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { DAY_UNIT_HEIGHT } from "../../constant";
import { pointDistance } from "../../../../utils/math";
import { MILLSECONDS_PER_DAY } from "../../../../constants/number";
import style from "./index.module.css";

const EPSILON = 6;

export default observer(({ left, height, startDate, endTime, descend }) => {
  const containerRef = useRef(null);
  const [showTimeAnchor, setShowTimeAnchor] = useState(false);
  const [timeAnchorOffset, setTimeAnchorOffset] = useState(0);
  const [timeAnchorText, setTimeAnchorText] = useState("");

  const utilDate = new Date();

  const onMouseMove = e => {
    const {clientX, clientY} = e;
    const {left, top} = containerRef.current.getBoundingClientRect();
    const units = Math.round((clientY - top) / DAY_UNIT_HEIGHT);
    if (pointDistance(clientX - left, clientY - top, 0, units * DAY_UNIT_HEIGHT) <= EPSILON) {
      setShowTimeAnchor(true);
      setTimeAnchorOffset(units * DAY_UNIT_HEIGHT);
      if (descend) {
        utilDate.setTime(endTime.getTime() - units * MILLSECONDS_PER_DAY);
      } else {
        utilDate.setTime(startDate.getTime() + units * MILLSECONDS_PER_DAY);
      }
      setTimeAnchorText(utilDate.toLocaleDateString());
    } else {
      setShowTimeAnchor(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className={style.mainContainer}
      style={{
        left: left,
        height: height
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setShowTimeAnchor(false)}
    >
      <Tooltip
        open={true}
        title={timeAnchorText}
        placement="right"
        overlayStyle={{
          fontSize: "0.85rem",
          display: showTimeAnchor ? "" : "none"
        }}
      >
        <div
          className={style.timeAnchor}
          style={{
            top: timeAnchorOffset,
            display: showTimeAnchor ? "" : "none"
          }}
        >
        </div>
      </Tooltip>
    </div>
  )
})