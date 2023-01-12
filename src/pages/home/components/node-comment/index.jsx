import { useState, useRef } from "react";
import { Popover } from "antd";
import { CloseOutlined, CheckOutlined } from "@ant-design/icons";
import style from "./style.module.css";

export default function NodeComment({
  node,
  show,
  setIsCommentShow
}) {
  const textRef = useRef(null);
  const [comment, setComment] = useState(node.comment);

  const saveComment = () => {
    node.setComment(textRef.current.value);
    setIsCommentShow(false);
  }

  return (
    <Popover
      content={
        <div 
          className={style.innerContainer}
        >
          <div className={style.toolbar}>
            <CloseOutlined
              className={style.toolbarIcon}
              onClick={() => setIsCommentShow(false)}
            />
            <CheckOutlined
              className={style.toolbarIcon}
              onClick={saveComment}
            />
          </div>
          <textarea
            ref={textRef}
            className={style.textArea}
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>
      }
      open={show}
      destroyTooltipOnHide={true}
    >
      <circle
        cx={node.x}
        cy={node.y}
        r={1}
        fill="transparent"
      />
    </Popover>
  )
}