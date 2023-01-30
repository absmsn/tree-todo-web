import { useContext, useState } from "react";
import {
  PlusOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
  SettingOutlined,
  PoweroffOutlined
} from "@ant-design/icons";
import { Select, Modal, Form, Input, message, Switch, Popconfirm, Dropdown } from "antd";
import {observer} from "mobx-react";
import { useNavigate } from "react-router-dom";
import { DarkModeContext } from "../../App";
import mapAPI from "../../apis/map";
import style from "./style.module.css";

const maskModalStyle = {
  backdropFilter: "blur(2px)",
  backgroundColor: "rgba(0, 0, 0, 0.2)"
};

const getMapSelect = maps => maps.map(map => ({
  value: map.id,
  label: map.name
}));

const menuItems = [
  {key: "setting", label: "设置", itemIcon: <SettingOutlined className={style.accountMenuIcon} />},
  {key: "signout", label: "注销", itemIcon: <PoweroffOutlined className={style.accountMenuIcon} />}
];

const AddMapModal = observer(({showAddModal, setShowAddModal, mapsStore}) => {
  const [newMapName, setNewMapName] = useState("");

  const addMap = async () => {
    if (newMapName) {
      const userId = localStorage.getItem("userId");
      const result = (await mapAPI.add(userId, newMapName)).data;
      const map = mapsStore.add(newMapName);
      map.setId(result.id);
      mapsStore.setSelectedMap(map);
      setShowAddModal(false);
    }
  }

  return (
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
          <Input 
            value={newMapName} 
            onInput={e => setNewMapName(e.target.value)}
            onPressEnter={addMap}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
});

const Header = observer(({ appStore, mapsStore }) => {
  const maps = mapsStore.maps;
  const {on: dark, set: setDarkMode} = useContext(DarkModeContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  const onChangeMap = id => {
    const map = maps.find(map => map.id === id);
    if (map) {
      mapsStore.setSelectedMap(map);
    }
  }

  const deleteMap = async () => {
    if (mapsStore.selectedMap && maps.length > 1) {
      const id = mapsStore.selectedMap.id;
      const name = mapsStore.selectedMap.name;
      const other = maps.find(m => m.id !== id);// 随便一张其它的图
      mapsStore.setSelectedMap(other);
      mapsStore.remove(id);
      await mapAPI.remove(id);
      messageApi.success(<span>删除图<strong>{name}</strong>成功</span>);
    }
  }

  const onMenuClick = ({key}) => {
    switch(key) {
      case "setting":
        break;
      case "signout":
        localStorage.clear();
        navigate("/login");
        // 重置当前用户的数据
        appStore.exit();
        break;
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
            <Popconfirm
              title="删除图"
              description="确定要删除吗?"
              okText="确认"
              cancelText="取消"
              onConfirm={deleteMap}
            >
              <DeleteOutlined />
            </Popconfirm>
          </div>
          <div className={`icon-color ${style.iconWrapper}`}>
            <PlusOutlined onClick={() => setShowAddModal(true)}/>
          </div>
          <div className={`icon-color ${style.iconWrapper}`}><ImportOutlined /></div>
          <div className={`icon-color ${style.iconWrapper}`}><ExportOutlined /></div>
          <div className={`icon-color ${style.avatarArea}`}>
            <Dropdown trigger="click" menu={{
              items: menuItems,
              onClick: onMenuClick
            }}>
              {
                <div className={style.avatar}>{email ? email[0] : ""}</div>
              }
            </Dropdown>
          </div>
        </div>
      </div>
      <AddMapModal
        mapsStore={mapsStore}
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
      />
    </header>
  )
});

export default Header;