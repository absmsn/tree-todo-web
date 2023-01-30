import { observer } from "mobx-react";
import { Input } from "antd";
import style from "./index.module.css";
import { useState } from "react";

export default observer(({map}) => {
  const [searchText, setSearchText] = useState("");

  return (
    <Input.Search
      value={searchText}
      onChange={e => setSearchText(e.target.value)}
      className={style.mainContainer}
    />
  )
});