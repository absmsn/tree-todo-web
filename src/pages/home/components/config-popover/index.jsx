import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import {
  Input,
  Button,
  Form,
  Popover,
  DatePicker,
  Space,
  Select,
  Tooltip
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import nodeAPI from "../../../../apis/node";
import style from "./index.module.css";

const labelCol = { span: 4 };
const wrapperCol = { span: 18 };
const popTitleStyle = { margin: "8px 0 16px 12px" };
const priorityOptions = [
  { value: 3, label: "高优先级" },
  { value: 2, label: "中优先级" },
  { value: 1, label: "低优先级" },
  { value: 0, label: "无优先级" }
];

const repeatMonthOptions = [], repeatDayOptions = [], repeatHourOptions = [], repeatMinuteOptions = [];
for (let i = 0; i <= 11; i++) {
  repeatMonthOptions.push({
    value: i,
    label: `${i}月`
  });
}
for (let i = 0; i <= 29; i++) {
  repeatDayOptions.push({
    value: i,
    label: `${i}天`
  });
}
for (let i = 0; i <= 23; i++) {
  repeatHourOptions.push({
    value: i,
    label: `${i}小时`
  });
}
for (let i = 0; i <= 59; i++) {
  repeatMinuteOptions.push({
    value: i,
    label: `${i}分钟`
  });
}
const optionStyle = {
  width: 140
};

const RepeatTime = observer(({ node, startTime, endTime }) => {
  const [repeatMonth, setRepeatMonth] = useState(node.repeatMonth);
  const [repeatDay, setRepeatDay] = useState(node.repeatDay);
  const [repeatHour, setRepeatHour] = useState(node.repeatHour);
  const [repeatMinute, setRepeatMinute] = useState(node.repeatMinute);
  const disabled = useMemo(() => !startTime || !endTime, [startTime, endTime]);

  return (
    <Form.Item label={
      <>
        {
          disabled && <Tooltip
            title="需要先设置时间区间"
            placement="left"
            overlayClassName={"tooltip-style"}
          >
            <QuestionCircleOutlined className={style.repeatQuestionMark} />
          </Tooltip>
        }
        重复
      </>
    }>
      <div className={style.repeatLine}>
        <Select
          value={repeatMonth}
          options={repeatMonthOptions}
          onChange={value => setRepeatMonth(value)}
          disabled={disabled}
          style={optionStyle}
          placeholder="月"
        />
        <Select
          value={repeatDay}
          options={repeatDayOptions}
          onChange={value => setRepeatDay(value)}
          disabled={disabled}
          style={optionStyle}
          placeholder="天"
        />
      </div>
      <div className={style.repeatLine}>
        <Select
          value={repeatHour}
          options={repeatHourOptions}
          onChange={value => setRepeatHour(value)}
          disabled={disabled}
          style={optionStyle}
          placeholder="小时"
        />
        <Select
          value={repeatMinute}
          options={repeatMinuteOptions}
          onChange={value => setRepeatMinute(value)}
          disabled={disabled}
          style={optionStyle}
          placeholder="分钟"
        />
      </div>
    </Form.Item>
  )
});

export default observer(({ x, y, node, show, setShow }) => {
  const [title, setTitle] = useState(node.title);
  const [timeRange, setTimeRange] = useState([
    node.startTime ? dayjs(node.startTime) : null,
    node.endTime ? dayjs(node.endTime) : null
  ]);
  const [priority, setPriority] = useState(node.priority);

  const onSubmit = () => {
    const [start, end] = timeRange, mutation = {};
    if (title !== node.title) {
      node.setTitle(title);
      mutation.title = title;
    }
    if (start && (!node.startTime || (node.startTime.getTime() !== start.toDate().getTime()))) {
      node.setStartTime(start.toDate());
      mutation.startTime = start.toDate();
    }
    if (end && (!node.endTime || (node.endTime.getTime() !== end.toDate().getTime()))) {
      node.setEndTime(end.toDate());
      mutation.endTime = end.toDate();
    }
    if (priority !== node.priority) {
      node.setPriority(priority);
      mutation.priority = priority;
    }
    nodeAPI.edit(node.id, mutation);
    setShow(false);
  }

  const onDateRangeChange = ([start, end]) => {
    setTimeRange([start, end]);
  }

  return (
    <Popover
      title={<div style={popTitleStyle}>设置节点信息</div>}
      content={
        <Form
          name="config"
          labelCol={labelCol}
          wrapperCol={wrapperCol}
          colon={false}
        >
          <Form.Item label="标题">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="时间区间">
            <DatePicker.RangePicker
              showTime={true}
              defaultValue={timeRange}
              format="YYYY-MM-DD HH:mm"
              onChange={onDateRangeChange}
            />
          </Form.Item>
          <Form.Item label="优先级">
            <Select
              value={priority}
              options={priorityOptions}
              onChange={value => setPriority(value)}
            />
          </Form.Item>
          <RepeatTime
            node={node}
            startTime={timeRange[0]}
            endTime={timeRange[1]}
          />
          <Form.Item label=" ">
            <Space>
              <Button type="primary" onClick={onSubmit}>确定</Button>
              <Button onClick={() => setShow(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      }
      open={show}
      destroyTooltipOnHide={true}
    >
      <div style={{
        left: x,
        top: y,
        position: "absolute",
        width: 0,
        height: 0
      }}>
      </div>
    </Popover>
  )
});