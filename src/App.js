import Header from './components/header';
import {
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";
import Home from "./pages/home";
import MapsStore from "./stores/maps";
import "./App.css";

const mapsStore = new MapsStore();
mapsStore.add();
mapsStore.selectedMap = mapsStore.maps[0];

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home map={mapsStore.selectedMap} />
    }
  ]);

  return (
    <div className="app">
      <div className='header'>
        <Header mapsStore={mapsStore} />
      </div>
      <main className='main'>
        <RouterProvider router={router} />
      </main>
    </div>
  );
}

export default App;
