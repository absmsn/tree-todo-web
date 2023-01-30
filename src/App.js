import React, { useEffect, useRef, useState } from 'react';
import Header from './components/header';
import { Outlet } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import { MILLSECONDS_PER_DAY } from './constants/number';
import { DEFAULT_MAP_NAME } from './constants';
import { getFirstMsOfDay } from './utils/time';
import relativeTime from "dayjs/plugin/relativeTime";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import userAPI from './apis/user';
import mapAPI from './apis/map';
import MapStore from './stores/map';
import TagStore from './stores/tag';
import "dayjs/locale/zh-cn";
import dayjs from 'dayjs';
import "./App.css";

dayjs.extend(relativeTime);
dayjs.extend(LocalizedFormat);
dayjs.locale('zh-cn');

const date = new Date();
const ms = getFirstMsOfDay(date);
date.setTime(ms);

const TodayContext = React.createContext(date);
const DarkModeContext = React.createContext({
  on: false,
  set: () => {}
});

function App({ appStore, mapsStore }) {
  const todayTimer = useRef(null);
  const [today, setToday] = useState(date);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    async function fecthData() {
      const userId = localStorage.getItem("userId");
      const maps = (await userAPI.getMaps(userId, ["tags"])).data;
      if (maps.length !== 0) {
        maps.forEach(map => map.exist = true);
        const mapStores = maps.map(map => {
          const mapStore = new MapStore();
          mapStore.fromPartial(map);
          if (map.tags.length > 0) {
            const tagStores = map.tags.map(tag => {
              const tagStore = new TagStore(tag.name);
              tagStore.setId(tag.id);
              return tagStore;
            });
            mapStore.setTags(tagStores);
          }
          return mapStore;
        });
        mapsStore.setMaps(mapStores);
        mapsStore.setSelectedMap(mapStores[0]);
      } else if (mapsStore.maps.length === 0) {
        const map = mapsStore.add(DEFAULT_MAP_NAME);
        const result = (await mapAPI.add(userId, DEFAULT_MAP_NAME)).data;
        map.setId(result.id);
        mapsStore.setSelectedMap(map);
      }
    }
    fecthData();
  }, []);

  useEffect(() => {
    const tick = () => {
      todayTimer.current = setTimeout(() => {
        const tempDate = new Date();
        const ms = getFirstMsOfDay(tempDate);
        tempDate.setTime(ms);
        setToday(date);
        tick();
      }, MILLSECONDS_PER_DAY);
    }
    tick();
    return (() => {
      clearTimeout(todayTimer.current);
    });
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const setDark = e => setDarkMode(e.matches);
    mql.addEventListener("change", setDark);
    setDarkMode(mql.matches);
    return (() => {
      mql.removeEventListener("change", setDark);
    });
  }, []);

  return (
    <TodayContext.Provider value={today}>
      <DarkModeContext.Provider value={{on: darkMode, set: setDarkMode}}>
        <ConfigProvider 
          theme={{algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm}}
          getPopupContainer={() => document.querySelector(".app")}
        >
          <div className={`app ${darkMode ? "dark" : ""}`}>
            <div className='header'>
              <Header
                appStore={appStore}
                mapsStore={mapsStore}
              />
            </div>
            <main className='main'><Outlet /></main>
          </div>
        </ConfigProvider>
      </DarkModeContext.Provider>
    </TodayContext.Provider>
  );
}

export default App;

export {
  TodayContext,
  DarkModeContext
};