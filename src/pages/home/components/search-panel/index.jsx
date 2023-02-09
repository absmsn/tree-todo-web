import { useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react";
import { Dropdown, Input, Select } from "antd";
import { useThrottle } from "../../../../hooks";
import Fuse from "fuse.js";
import style from "./index.module.css";

const searchTypeOptions = [
  { value: "name", label: "名称" },
  { value: "label", label: "标签" }
];

const fuseBuildOptions = {
  keys: ["title"],
  threshold: 0.25
};

const fuseSearchOptions = { limit: 10 };

const onDropItemClick = (key, map, setDropdownOpen) => {
  key = Number(key);
  const node = map.tree.nodes.find(n => n.id === key);
  map.coordination.setViewBox({
    left: node.x - map.coordination.viewBox.width / 2,
    top: node.y - map.coordination.viewBox.height / 2
  });
  map.tree.setSelectedNode(node);
  setDropdownOpen(false);
}

const initialSearchResults = [];

const NameSelector = observer(({ map }) => {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState(initialSearchResults);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const search = text => {
    const fuse = new Fuse(map.tree.nodes, fuseBuildOptions);
    const results = fuse.search(text, fuseSearchOptions);
    const options = results.map(result => ({
      key: result.item.id,
      label: result.item.title,
    }));
    setDropdownOpen(options.length > 0);
    setSearchResults(options);
  };

  const searchThrottle = useThrottle(search, 350);

  const onSearch = text => {
    setSearchText(text);
    searchThrottle(text);
  };

  const onInputFocus = () => {
    if (searchText.length > 0) {
      search(searchText);
    }
  }

  const onInputBlur = () => {
    if (searchResults.length > 0) {
      setSearchResults([]);
    }
    setDropdownOpen(false);
  }

  return (
    <Dropdown
      open={dropdownOpen}
      menu={{
        items: searchResults,
        onClick: ({ key }) => onDropItemClick(key, map, setDropdownOpen)
      }}
    >
      <Input
        value={searchText}
        onChange={e => onSearch(e.target.value)}
        onBlur={onInputBlur}
        onFocus={onInputFocus}
        allowClear={true}
        style={{ width: 150 }}
      />
    </Dropdown>
  )
});

const selectStyle = { width: 150 };

const TagSelector = observer(({ map }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // 因为需要在选中标签时手动关闭标签下拉框
  const [selectOptionsShow, setSelectOptionsShow] = useState(false);
  const tagOptions = computed(() => {
    return map.tags.map(tag => ({
      value: tag.id,
      label: tag.name
    }));
  }).get();

  const onSelectedTagsChange = (values) => {
    setSelectOptionsShow(false);
    // 清空之前的结果
    if (values.length === 0) {
      setSelectOptionsShow(true);
      if (searchResults.length > 0) {
        setSearchResults([]);
        setDropdownOpen(false);
      }
      return;
    }
    const tagSet = new Set(values);
    let admitted = map.tree.nodes
      .filter(node => {
        let count = 0;
        for (let i = 0; i < node.tags.length; i++) {
          if (tagSet.has(node.tags[i].id)) {
            count++;
          }
          if (count === tagSet.size) {
            return true;
          }
        }
        return false;
      })
    if (admitted.length === 0) {
      setDropdownOpen(false);
    } else {
      admitted = admitted.map(node => ({
        key: node.id,
        label: node.title
      }));
      setDropdownOpen(true);
    }
    setSearchResults(admitted);
  }

  const onSelectBlur = () => {
    setDropdownOpen(false);
    setSelectOptionsShow(false);
  }

  return (
    <Dropdown
      open={dropdownOpen}
      menu={{
        items: searchResults,
        onClick: ({ key }) => onDropItemClick(key, map, setDropdownOpen)
      }}
    >
      <Select
        mode="multiple"
        autoClearSearchValue={true}
        onChange={onSelectedTagsChange}
        onFocus={() => setSelectOptionsShow(true)}
        onBlur={onSelectBlur}
        style={selectStyle}
        options={tagOptions}
        open={selectOptionsShow}
      />
    </Dropdown>
  )
});

export default observer(({ map }) => {
  const [searchType, setSearchType] = useState("name");

  return (
    <Input.Group compact className={style.mainContainer}>
      <Select className={style.typeSelect}
        value={searchType}
        options={searchTypeOptions}
        onChange={setSearchType}
      />
      {
        searchType === "name"
          ? <NameSelector map={map} />
          : <TagSelector map={map} />
      }
    </Input.Group>
  )
});