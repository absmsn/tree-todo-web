import React, { useEffect, useRef, useState } from 'react';
import Header from './components/header';
import {
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";
import Home from "./pages/home";
import { ConfigProvider, theme } from "antd";
import { MILLSECONDS_PER_DAY } from './constants/number';
import "./App.css";

const date = new Date();
date.setTime(date.getTime() - (date.getTime() % MILLSECONDS_PER_DAY));

const TodayContext = React.createContext(date);
const DarkModeContext = React.createContext({
  on: false,
  set: () => {}
});

function App({ appStore, mapsStore }) {
  const todayTimer = useRef(null);
  const [today, setToday] = useState(date);
  const [darkMode, setDarkMode] = useState(false);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home
        app={appStore}
        maps={mapsStore}
      />
    }
  ]);

  useEffect(() => {
    const tick = () => {
      todayTimer.current = setTimeout(() => {
        const tempDate = new Date();
        setToday(new Date(`${tempDate.toDateString()} 00:00:00`));
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
              <Header mapsStore={mapsStore} />
            </div>
            <main className='main'>
              <RouterProvider router={router} />
            </main>
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