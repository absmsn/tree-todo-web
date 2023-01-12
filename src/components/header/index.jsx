import { useContext, useState } from "react";
import {
  PlusOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
  SettingOutlined
} from "@ant-design/icons";
import { Select, Modal, Form, Input, message, Switch } from "antd";
import {observer} from "mobx-react";
import { DarkModeContext } from "../../App";
import style from "./style.module.css";

const maskModalStyle = {
  backdropFilter: "blur(2px)",
  backgroundColor: "rgba(0, 0, 0, 0.2)"
};

const getMapSelect = maps => maps.map(map => ({
  value: map.id,
  label: map.name
}));

const Header = observer(({ mapsStore }) => {
  const maps = mapsStore.maps;
  const {on: dark, set: setDarkMode} = useContext(DarkModeContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  const onChangeMap = id => {
    const map = maps.find(map => map.id === id);
    if (map) {
      mapsStore.setSelectedMap(map);
    }
  }

  const addMap = () => {
    if (newMapName) {
      const map = mapsStore.add(newMapName);
      mapsStore.setSelectedMap(map);
      setShowAddModal(false);
    }
  }

  const deleteMap = () => {
    if (mapsStore.selectedMap && maps.length > 1) {
      const id = mapsStore.selectedMap.id;
      const name = mapsStore.selectedMap.name;
      const other = maps.find(m => m.id !== id);// 随便一张其它的图
      mapsStore.setSelectedMap(other);
      mapsStore.remove(id);
      messageApi.success(`删除图${name}成功`);
    }
  }

  return (
    <header>
      {contextHolder}
      <div className={style.container}>
        <div className={style.mapSelect}>
          <Select
            size="middle"
            className={style.select}
            options={getMapSelect(maps)}
            defaultValue={maps.length ? maps[0].id : ""}
            value={mapsStore.selectedMap ? mapsStore.selectedMap.id : ""}
            onChange={onChangeMap}
          />
        </div>
        <div className={style.colorSchema}>
          <Switch
            checked={dark}
            checkedChildren="黑"
            unCheckedChildren="白"
            onChange={checked => setDarkMode(checked)}
            className={style.switch}
          />
          <div className={style.text}>颜色模式</div>
        </div>
        <div className={style.iconArea}>
          <div className={`${style.iconWrapper} ${maps.length > 1 ? "danger" : "disabled"}`}>
            <DeleteOutlined onClick={deleteMap} />
          </div>
          <div className={`icon-color ${style.iconWrapper}`}>
            <PlusOutlined onClick={() => setShowAddModal(true)}/>
          </div>
          <div className={`icon-color ${style.iconWrapper}`}><ImportOutlined /></div>
          <div className={`icon-color ${style.iconWrapper}`}><ExportOutlined /></div>
          <div className={`icon-color ${style.iconWrapper}`}><SettingOutlined /></div>
        </div>
      </div>
      <Modal
        title="创建一张新图"
        centered={true}
        style={{maxWidth: 400}}
        maskStyle={maskModalStyle}
        cancelText="取消"
        okText="创建"
        destroyOnClose={true}
        open={showAddModal}
        onOk={addMap}
        onCancel={() => setShowAddModal(false)}
      >
        <Form
          name="basic"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: true }}
          autoComplete="off"
          colon={false}
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