import { useState } from "react";
import { observer } from "mobx-react";
import { Popover, Empty, Tag, Input } from "antd";
import {
  PlusCircleOutlined
} from "@ant-design/icons";
import tagAPI from "../../../../apis/tag";
import { DRAG_TAG_END } from "../../../../constants/event";
import eventChannel from "../../../../utils/event";
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

  const onRemoveTag = tag => {
    map.removeTag(tag.id);
    for (let node of map.tree.nodes) {
      node.removeTag(tag.id);
    }
    tagAPI.remove(tag.id);
  }

  const onDragTagEnd = (tag, e) => {
    eventChannel.emit(DRAG_TAG_END, map.id, tag, e);
  }

  const handleEditTagConfirm = () => {
    const tag = map.tags[editTagIndex];
    setEditTagIndex(-1);
    if (editTagValue !== tag.name) {
      tag.setName(editTagValue);
      tagAPI.edit(tag.id, {
        name: editTagValue
      });
    }
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
          onClose={() => onRemoveTag(tag)}
          onDragEnd={e => onDragTagEnd(tag, e)}
          className={style.tag}
          draggable={true}
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