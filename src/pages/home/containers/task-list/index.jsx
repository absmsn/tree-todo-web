import { useContext, useState } from "react";
import { observer } from "mobx-react";
import { computed } from "mobx";
import { Select } from "antd";
import RangeList from "../../components/range-list";
import TimePointList from "../../components/timepoint-list";
import { DarkModeContext } from "../../../main";
import style from "./index.module.css";

const sortTypeOptions = [
  { value: "createTime", label: "创建时间" },
  { value: "finishTime", label: "完成时间" },
  { value: "timeRange", label: "时间区间" }
];

const finishedOptions = [
  { value: "all", label: "所有" },
  { value: "finished", label: "已完成" },
  { value: "unfinished", label: "未完成" }
];

const timeOrderOptions = [
  { value: "descend", label: "降序" },
  { value: "ascend", label: "升序" }
];

export default observer(({ map, tree }) => {
  const {on: dark} = useContext(DarkModeContext);
  const [sortType, setSortType] = useState("timeRange");
  const [finishedType, setFinishedType] = useState("all");
  const [timeOrder, setTimeOrder] = useState("ascend");
  const [selectedTagsID, setSelectedTagsID] = useState([]);

  const tagOptions = computed(() => {
    return map.tags.map(tag => ({
      value: tag.id,
      label: tag.name
    }));
  }).get();

  return (
    <div className={`${style.mainContainer} ${dark ? style.dark : ""}`}>
      <div className={style.controlPanel}>
        <div className={style.rows}>
          <div className={style.row}>
            <Select
              className={style.select}
              defaultValue="timeRange"
              options={sortTypeOptions}
              onChange={setSortType}
            />
            <Select
              className={style.select}
              style={{ width: 115 }}
              defaultValue="all"
              options={finishedOptions}
              onChange={setFinishedType}
            />
            <Select
              className={style.select}
              value={timeOrder}
              options={timeOrderOptions}
              onChange={setTimeOrder}
            />
          </div>
          <div className={style.row}>
            <Select
              mode="multiple"
              placeholder="选择标签"
              allowClear={true}
              className={`${style.select} w-full`}
              options={tagOptions}
              onChange={setSelectedTagsID}
            />
          </div>
        </div>
      </div>
      <div className={style.list}>
        {
          sortType === "timeRange" && tree
            ? <div className="h-full son-h-full">
                <RangeList
                  map={map}
                  tasks={tree.nodes}
                  descend={timeOrder === "descend"}
                  selectedTags={selectedTagsID}
                  filterFinished={finishedType}
                />
              </div>
            : <TimePointList 
                map={map}
                type={sortType}
                descend={timeOrder === "descend"}
                filterFinished={finishedType}
              />
        }
      </div>
    </div>
  )
});