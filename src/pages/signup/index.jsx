import { useState } from "react";
import { observer } from "mobx-react";
import { message } from "antd";
import { Form, Input, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import userAPI from "../../apis/user";
import style from "./index.module.css";

const labelCol = { span: 4 };
const wrapperCol = { span: 18 };

export default observer(function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messageAPI, messageContext] = message.useMessage();
  const navigate = useNavigate();

  const onSubmit = async () => {
    if (email && password) {
      try {
        await userAPI.signup(email, password);
        messageAPI.error("注册成功!");
        navigate("/");
      } catch(e) {
        let text = "注册失败!";
        const message = e.response.data.message;
        if (message === "User already exists") {
          text = "该邮箱已被注册!";
        }
        messageAPI.error(text);
      }
    }
  }

  return (
    <div className={style.mainContainer}>
      {messageContext}
      <div className={style.formArea}>
        <div className={style.title}>注册</div>
        <Form
          labelCol={labelCol}
          wrapperCol={wrapperCol}
          colon={false}
        >
          <Form.Item label="邮箱">
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="输入邮箱"
            />
          </Form.Item>
          <Form.Item label="邮箱">
            <Input.Password
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="输入密码"
            />
          </Form.Item>
          <Form.Item label=" ">
            <span className={style.existText}>已有账户?</span>
            <Link to="/login">登录</Link>
          </Form.Item>
          <Form.Item label=" ">
            <Button type="primary" onClick={onSubmit}>注册</Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
});