import { useState } from "react";
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  SettingOutlined
} from "@ant-design/icons";
import { Select, Modal, Form, Input } from "antd";
import {observer} from "mobx-react";
import style from "./style.module.css";

const getMapSelect = maps => maps.map(map => ({
  value: map.id,
  label: map.name
}));

const Header = observer(({ mapsStore }) => {
  const maps = mapsStore.maps;
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMapName, setNewMapName] = useState("");

  const onChangeMap = id => {
    mapsStore.selectedMap = maps.find(map => map.id === id);
  }

  const addMap = () => {
    mapsStore.add(newMapName);
    setShowAddModal(false);
  }

  return (
    <header>
      <div className={style.container}>
        <div className={style.mapSelect}>
          <Select
            size="middle"
            style={{width: 200}}
            options={getMapSelect(maps)}
            defaultValue={maps.length ? maps[0].id : ""}
            value={mapsStore.selectedMap.id}
            onChange={onChangeMap}
          />
        </div>
        <div className={style.iconArea}>
          <div className={style.iconWrapper}>
            <PlusOutlined onClick={() => setShowAddModal(true)}/>
          </div>
          <div className={style.iconWrapper}><ImportOutlined /></div>
          <div className={style.iconWrapper}><ExportOutlined /></div>
          <div className={style.iconWrapper}><SettingOutlined /></div>
        </div>
      </div>
      <Modal
        title="创建一张新图"
        style={{ top: 20 }}
        destroyOnClose={true}
        open={showAddModal}
        onOk={addMap}
        onCancel={() => setShowAddModal(false)}
      >
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: true }}
          autoComplete="off"
        >
          <Form.Item
            label="图名称"
            name="name"
            labelAlign="left"
            rules={[{ required: true, message: '请输入图的名称' }]}
          >
            <Input value={newMapName} onInput={e => setNewMapName(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>
    </header>
  )
});

export default Header;