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
        await userAPI.login(email, password);
        messageAPI.error("登录成功!");
        navigate("/");
      } catch(e) {
        let text = "登录失败!";
        const message = e.response.data.message;
        if (message === "Invalid password") {
          text = "密码错误!";
        } else if (message === "Email not found") {
          text = "账户不存在!";
        }
        messageAPI.error(text);
      }
    }
  }

  return (
    <div className={style.mainContainer}>
      {messageContext}
      <div className={style.formArea}>
        <div className={style.title}>登录</div>
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
          <Form.Item label="密码">
            <Input.Password
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="输入密码"
            />
          </Form.Item>
          <Form.Item label=" ">
            <span className={style.existText}>没有账户?</span>
            <Link to="/signup">注册</Link>
          </Form.Item>
          <Form.Item label=" ">
            <Button type="primary" onClick={onSubmit}>登录</Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
});