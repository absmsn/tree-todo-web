import { useState, useRef } from "react";
import { Popover } from "antd";
import { CloseOutlined, CheckOutlined } from "@ant-design/icons";
import nodeAPI from "../../../../apis/node";
import style from "./style.module.css";

export default function NodeComment({
  x,
  y,
  node,
  show,
  setIsCommentShow
}) {
  const textRef = useRef(null);
  const [comment, setComment] = useState(node.comment);

  const saveComment = () => {
    node.setComment(textRef.current.value);
    setIsCommentShow(false);
    nodeAPI.edit(node.id, { comment });
  }

  return (
    <Popover
      content={
        <div className={style.innerContainer}>
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
            value={comment}
            className={style.textArea}
            onChange={e => setComment(e.target.value)}
          />
        </div>
      }
      open={show}
      destroyTooltipOnHide={true}
    >
      <div
        style={{
          left: x,
          top: y
        }}
        className={style.innerContent}>
      </div>
    </Popover>
  )
}