import { useContext, useMemo } from "react";
import { observer } from "mobx-react";
import { computed } from "mobx";
import { Dropdown } from "antd";
import { 
  CloudOutlined,
  CloudSyncOutlined
} from "@ant-design/icons";
import { toHourMinute } from "../../../../utils/time";
import { TodayContext } from "../../../../App";
import style from "./index.module.css";

let viewMenu = [
  { key: "tree-view", label: "树视图" },
  { key: "list-view", label: "列表视图" }
];

const TasksInfo = observer(({tree}) => {
  const today = useContext(TodayContext);
  const finishedNum = computed(() => {
    let count = 0, nodes = tree?.nodes;
    if (nodes) {
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].finished && count++;
      }
    }
    return count;
  }).get();
  const deadlinedTasks = computed(() => {
    const tasks = [], nodes = tree?.nodes || [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node.finished && node.endTime && node.endTime.toDateString() === today.toDateString()) {
        tasks.push(node);
      }
    }
    tasks.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
    return tasks;
  }).get();
  const deadlinedMenuItems = useMemo(() => {
    const now = Date.now();
    return deadlinedTasks.map((item) => {
      const delayed = now > item.endTime.getTime();
      return {
        key: item.id,
        label: <div
          className={style.deadlineMenuItem}
          onClick={() => tree.setSelectedNode(item)}
        >
          <div>{item.title}</div>
          <div className={`${style.time} ${delayed ? style.delayed : ""}`}>
            {toHourMinute(item.endTime)}
          </div>
          <div className={style.delayText}>{delayed && "已过期"}</div>
        </div>
      }
    });
  }, [deadlinedTasks]);

  return <>
    <div className={style.section}>
      <div className={style.title}>共有任务:</div>
      <div>{tree.nodes.length}项</div>
    </div>
    <div className={style.section}>
      <div className={style.title}>已完成任务:</div>
      <div>{finishedNum}项</div>
    </div>
    <div className={style.section}>
      <div className={style.title}>今日过期任务:</div>
      <Dropdown menu={{items: deadlinedMenuItems}} trigger={"click"} arrow>
        <div>{deadlinedTasks.length}项</div>
      </Dropdown>
    </div>
  </>
});

export default observer(function Footer({ app, map }) {
  let syncStatusView;
  
  if (app.syncStatus === "finished") {
    syncStatusView = <>
      <CloudOutlined className={style.icon} />
      <span>已同步</span>
    </>;
  } else if (app.syncStatus === "syncing") {
    syncStatusView = <>
      <CloudSyncOutlined className={style.icon} />
      <span>同步中</span>
    </>;
  }

  return (
    <div className={style.mainContainer}>
      <div className={`${style.syncStatus} flex-align-center`}>
        {syncStatusView}
      </div>
      <div className={style.mapInfo}>
        <div className={style.section}>
          <div className={style.title}>图:</div>
          <div>{map.name}</div>
        </div>
        <div className={style.section}>
          <div className={style.title}>选中节点:</div>
          <div>{(map.tree && map.tree.selectedNode) ? map.tree.selectedNode.title : "无"}</div>
        </div>
        {
          map.tree && <TasksInfo tree={map.tree} />
        }
        <div className={`${style.section} hover-bg ${style.selectable}`}>
          <Dropdown menu={{items: viewMenu}} trigger={"click"} arrow>
            <div>选择视图</div>
          </Dropdown>
        </div>
      </div>
    </div>
  )
})