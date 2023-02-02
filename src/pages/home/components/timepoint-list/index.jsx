import {Timeline} from "antd";
import { observer } from "mobx-react";
import style from "./index.module.css";

const TimePointList = observer(({map, type="createTime", descend}) => {
  let sortedTasks = map.tree.nodes.slice();
  if (type === "finishTime") {
    sortedTasks = sortedTasks.filter(t => t.finished);
    sortedTasks.sort((a, b) => {
      if (descend) {
        return b.finishTime - a.finishTime;
      } else {
        return a.finishTime - b.finishTime;
      }
    });
  } else {
    sortedTasks.sort((a, b) => {
      if (descend) {
        return b.createTime - a.createTime;
      } else {
        return a.createTime - b.createTime;
      }
    });
  }

  return (
    <div className={style.mainContainer}>
      <Timeline>
        {
          sortedTasks.map(node => {
            let time = type === "createTime" 
              ? node.createTime.toLocaleString() 
              : node.finishTime.toLocaleString();
            return <Timeline.Item key={node.id}>
              {node.title} - {time}
            </Timeline.Item>
          })
        }
      </Timeline>
    </div>
  )
});

export default TimePointList;