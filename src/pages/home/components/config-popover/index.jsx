import {
  Input,
  Button,
  Form,
  Popover,
  DatePicker,
  Space
} from "antd";
import dayjs from "dayjs";
import { observer } from "mobx-react";
import { useState } from "react";

const labelCol = { span: 4 };
const wrapperCol = { span: 18 };
const popTitleStyle = { margin: "8px 0 16px 12px" };

export default observer(function ConfigPopover({ node, show, setShow }) {
  const [title, setTitle] = useState(node.title);
  const [timeRange, setTimeRange] = useState([
    dayjs(node.startTime ?? new Date()), 
    dayjs(node.endTime ?? new Date())
  ]);

  const onSubmit = () => {
    const [start, end] = timeRange;
    node.setTitle(title);
    node.setStartTime(start.toDate());
    node.setEndTime(end.toDate());
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
      <circle
        cx={node.x}
        cy={node.y}
        r={1}
        fill="transparent"
      />
    </Popover>
  )
});