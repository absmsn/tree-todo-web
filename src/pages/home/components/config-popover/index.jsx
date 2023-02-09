import { useMemo, useState, useEffect } from "react";
import { observer } from "mobx-react";
import {
  Input,
  Button,
  Form,
  Popover,
  DatePicker,
  Space,
  Select,
  Tooltip,
  Checkbox,
  InputNumber
} from "antd";
import dayjs from "dayjs";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { getRepeatPattern } from "../../../../utils/node";
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

const initialRepeatPattern = {
  month: null,
  day: null,
  hour: null,
  minute: null
};

const RepeatTime = observer(({ node, startTime, endTime, onRepeatChange }) => {
  // repeat的格式: xxMxxDxxHxxm
  const repeatComponents = useMemo(() => {
    if (node.repeat) {
      return getRepeatPattern(node.repeat)
    } else {
      return initialRepeatPattern;
    }
  }, [node.repeat]);
  const [repeatMonth, setRepeatMonth] = useState(repeatComponents.month);
  const [repeatDay, setRepeatDay] = useState(repeatComponents.day);
  const [repeatHour, setRepeatHour] = useState(repeatComponents.hour);
  const [repeatMinute, setRepeatMinute] = useState(repeatComponents.minute);
  const disabled = useMemo(() => !startTime || !endTime, [startTime, endTime]);

  useEffect(() => {
    let repeat;
    if (!repeatMonth || !repeatDay || !repeatHour || !repeatMinute) {
      repeat = "";
    } else {
      repeat = `${repeatMonth}M${repeatDay}D${repeatHour}H${repeatMinute}m`;
    }
    if (onRepeatChange) {
      onRepeatChange(repeat);
    }
  }, [repeatMonth, repeatDay, repeatHour, repeatMinute]);

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
        <InputNumber
          min={0}
          max={12}
          step={1}
          value={repeatMonth}
          disabled={disabled}
          placeholder="重复月份"
          onChange={value => setRepeatMonth(value)}
          className={style.inputNumber}
        />
        <label>月</label>
        <InputNumber
          min={0}
          max={31}
          step={1}
          value={repeatDay}
          disabled={disabled}
          placeholder="重复天数"
          onChange={value => setRepeatDay(value)}
          className={style.inputNumber}
        />
        <label>天</label>
      </div>
      <div className={style.repeatLine}>
        <InputNumber
          min={0}
          max={60}
          step={1}
          value={repeatHour}
          disabled={disabled}
          placeholder="重复小时数"
          onChange={value => setRepeatHour(value)}
          className={style.inputNumber}
        />
        <label>时</label>
        <InputNumber
          min={1}
          max={60}
          step={1}
          value={repeatMinute}
          disabled={disabled}
          placeholder="重复分钟数"
          onChange={value => setRepeatMinute(value)}
          className={style.inputNumber}
        />
        <label>分</label>
      </div>
    </Form.Item>
  )
});

export default observer(({ x, y, node, show, setShow }) => {
  const [repeat, setRepeat] = useState(node.repeat);
  const [title, setTitle] = useState(node.title);
  const [timeRange, setTimeRange] = useState([
    node.startTime ? dayjs(node.startTime) : null,
    node.endTime ? dayjs(node.endTime) : null
  ]);
  const [priority, setPriority] = useState(node.priority);
  const [deadlineAutoFinish, setDeadlineAutoFinish] = useState(node.autoFinish);

  const onSubmit = () => {
    const [start, end] = timeRange, mutation = {}, storeMutation = {};
    if (title !== node.title) {
      storeMutation.title = title;
      mutation.title = title;
    }
    if (start && (!node.startTime || (node.startTime.getTime() !== start.toDate().getTime()))) {
      storeMutation.startTime = start.toDate();
      mutation.startTime = start.toDate();
    }
    if (end && (!node.endTime || (node.endTime.getTime() !== end.toDate().getTime()))) {
      storeMutation.endTime = end.toDate();
      mutation.endTime = end.toDate();
    }
    if (priority !== node.priority) {
      storeMutation.priority = priority;
      mutation.priority = priority;
    }
    if (repeat !== node.repeat) {
      node.repeat = repeat;
      mutation.repeat = repeat;
    }
    if (deadlineAutoFinish !== node.autoFinish) {
      node.autoFinish = deadlineAutoFinish;
      mutation.autoFinish = deadlineAutoFinish;
    }
    node.fromPartial(storeMutation);
    nodeAPI.edit(node.id, mutation);
    setShow(false);
  }

  const onDateRangeChange = ([start, end]) => {
    setTimeRange([start, end]);
  }

  useEffect(() => {
    setTimeRange([
      dayjs(node.startTime),
      dayjs(node.endTime)
    ]);
  }, [node.startTime, node.endTime]);

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
          <Form.Item label=" " className={style.autoFinishFormItem}>
            <Checkbox
              checked={deadlineAutoFinish}
              onChange={e => setDeadlineAutoFinish(e.target.checked)}
            >
              到期时自动设置为完成
            </Checkbox>
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
            onRepeatChange={(value) => setRepeat(value)}
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