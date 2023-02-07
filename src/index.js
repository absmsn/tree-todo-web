import React from 'react';
import ReactDOM from 'react-dom/client';
import AppStore from "./stores/app";
import MapsStore from "./stores/maps";
import { createBrowserRouter, redirect, RouterProvider } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import Main from './pages/main';
import Signup from './pages/signup';
import Login from './pages/login';
import Home from './pages/home';
import { App as AntdAppConfig} from 'antd';
import './styles/global.css';

const appStore = new AppStore();
const mapsStore = new MapsStore();
appStore.setMapsStore(mapsStore);

const loggedInterceptor = async () => {
  if (localStorage.getItem("userId")) {
    throw redirect("/");
  }
  return null;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main
      appStore={appStore}
      mapsStore={mapsStore}
    />,
    children: [
      {
        path: "/",
        element: <Home
          app={appStore}
          maps={mapsStore}
        />
      }
    ],
    loader: async () => {
      if (!localStorage.getItem("userId")) {
        throw redirect("/login");
      }
      return null;
    }
  },
  {
    path: "/signup",
    element: <Signup />,
    loader: loggedInterceptor
  },
  {
    path: "/login",
    element: <Login />,
    loader: loggedInterceptor
  }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AntdAppConfig>
    <RouterProvider router={router}>
    </RouterProvider>
  </AntdAppConfig>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
