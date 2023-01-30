import { useState } from "react";
import { computed } from "mobx";
import { PlusCircleOutlined } from "@ant-design/icons";
import { Popover, Select, Form, Tag, Input, Button, Space } from "antd";
import { getTagsMutations } from "../../../../utils";
import nodeAPI from "../../../../apis/node";
import style from "./index.module.css";

const labelCol = { span: 8 };
const wrapperCol = { span: 20 };

export default function({ x, y, map, node, show, setShow }) {
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  const availableTags = computed(() => {
    const tags = [], addedSet = new Set();
    for (let i = 0; i < node.tags.length; i++) {
      addedSet.add(node.tags[i].name);
    }
    // 找出还没有添加到当前节点的标签
    for (let i = 0; i < map.tags.length; i++) {
      const name = map.tags[i].name, id = map.tags[i].id;
      if (!addedSet.has(map.tags[i].name)) {
        tags.push({
          label: name,
          value: id
        });
      }
    }
    return tags;
  }).get();

  const newTag = () => {
    setNewTagName("");
    if (newTagName) {
      if (!map.tags.some(t => t.name === newTagName)) {
        map.addTag(newTagName);
      }
    }
  }

  const removeTag = (i) => {
    tags.splice(i, 1);
    setTags([...tags]);
  }

  const onConfirm = async () => {
    if (tags.length > 0) {
      const newTags = node.tags.concat(tags);
      const {add, remove} = getTagsMutations(node.tags, newTags);
      const promises = [];
      if (add.length > 0) {
        promises.push(nodeAPI.addTags(node.id, add.map(item => item.id)));
      }
      if (remove.length > 0) {
        promises.push(nodeAPI.removeTags(node.id, remove.map(item => item.id)));
      }
      await Promise.all(promises);
      node.setTags(node.tags.concat(tags));
    }
    setShow(false);
  }

  const onSelectTag = tag => {
    const i = map.tags.findIndex(t => t.id === tag);
    if (i !== -1) {
      tags.push(map.tags[i]);
    }
    setTags([...tags]);
  }

  const onDeselectTag = tag => {
    const items = [];
    for (let i = 0; i < tags.length; i++) {
      if (tags[i].id !== tag) {
        items.push(tags[i])
      }
    }
    setTags(items);
  }

  const popoverContent = <>
    <Form
      labelCol={labelCol}
      wrapperCol={wrapperCol}
      colon={false}
      labelAlign={"left"}
      className={style.form}
    >
      <Form.Item
        label="创建新标签"
        rules={[{
          validator(rule, value) {
            if (availableTags.some(t => t.id === value)) {
              return Promise.reject(new Error("标签已存在"));
            }
            return Promise.resolve();
          }
        }]}
        className={style.formItem}
      >
        <Input
          value={newTagName}
          onChange={e => setNewTagName(e.target.value)}
          suffix={<PlusCircleOutlined onClick={newTag} />}
          onPressEnter={newTag}
        />
      </Form.Item>
      <Form.Item label="选择已有标签" className={style.formItem}>
        <Select
          mode="multiple"
          allowClear={true}
          options={availableTags}
          onSelect={onSelectTag}
          onDeselect={onDeselectTag}
        />
      </Form.Item>
      <Form.Item label=" " className={style.formItem}>
        <Space>
          <Button onClick={() => setShow(false)}>取消</Button>
          <Button onClick={onConfirm} type="primary">确定</Button>
        </Space>
      </Form.Item>
    </Form>
    <Space wrap={true} size={2}>
      {
        tags.map((tag, i) => <Tag
          color={tag.color}
          closable={true}
          onClose={() => removeTag(i)}
          className={style.tag}
          key={tag.id}
        >
          {tag.name}
        </Tag>)
      }
    </Space>
  </>

  return (
    <Popover
      title="添加标签"
      open={show}
      content={popoverContent}
      destroyTooltipOnHide={true}
      overlayClassName={style.mainContainer}
    >
      <div
        style={{
          left: x,
          top: y
        }}
        className={style.inner}>
      </div>
    </Popover>
  )
}