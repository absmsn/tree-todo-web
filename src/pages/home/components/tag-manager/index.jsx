import { useState } from "react";
import { observer } from "mobx-react";
import { Popover, Empty, Tag, Input } from "antd";
import {
  PlusCircleOutlined
} from "@ant-design/icons";
import style from "./index.module.css";

export default observer(function FloatPanel({map, show, children}) {
  const [newTagName, setNewTagName] = useState("");
  const [editTagIndex, setEditTagIndex] = useState(-1);
  const [editTagValue, setEditTagValue] = useState("");

  const newTag = () => {
    if (newTagName) {
      setNewTagName("");
      if (!map.tags.some(t => t.name === newTagName)) {
        map.addTag(newTagName);
      }
    }
  }

  const handleEditTagConfirm = () => {
    map.tags[editTagIndex].setName(editTagValue);
    setEditTagIndex(-1);
  };

  const handleEditInputChange = (e) => {
    setEditTagValue(e.target.value);
  }

  let tagsView;
  if (map.tags.length > 0) {
    tagsView = map.tags.map((tag, i) => {
      if (i === editTagIndex) {
        return <Input
          key={tag.id}
          size="small"
          value={editTagValue}
          onChange={handleEditInputChange}
          onBlur={handleEditTagConfirm}
          onPressEnter={handleEditTagConfirm}
          className={style.tagInput}
        />
      } else {
        return <Tag
          color={tag.color}
          closable={true}
          onClose={() => map.removeTag(tag.name)}
          className={style.tag}
          key={tag.id}
        >
          <span onDoubleClick={e => {
            setEditTagIndex(i);
            setEditTagValue(tag.name);
            e.preventDefault();
          }}>
            {tag.name}
          </span>
        </Tag>
      }
    });
  } else {
    tagsView = <Empty description="无标签" />
  }

  return (
    <Popover
      title="管理标签"
      open={show}
      content={
        <>
          <div className={style.tagArea}>{tagsView}</div>
          <Input
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            suffix={<PlusCircleOutlined onClick={newTag} />}
            onPressEnter={newTag}
          />
        </>
      }
    >
      {children}
    </Popover>
  )
});