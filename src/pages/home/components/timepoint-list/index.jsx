import {Timeline} from "antd";
import { observer } from "mobx-react";
import style from "./index.module.css";

const TimePointList = observer(({map}) => {
  return (
    <div className={style.mainContainer}>
      <Timeline>
        {
          map.tree && map.tree.nodes.map(node => {
            return <Timeline.Item key={node.id}>
              {node.title}
            </Timeline.Item>
          })
        }
      </Timeline>
    </div>
  )
});

export default TimePointList;