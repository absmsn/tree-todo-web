import { observer } from "mobx-react";
import { Resizable } from "re-resizable";
import Canvas from "./containers/canvas";
import Footer from "./containers/footer";
import TaskList from "./containers/task-list";
import Notes from "./containers/notes";
import style from "./index.module.css";

const resizeEnable = { left: true };
const resizeDefaultSize = { height: "100%" };

const Home = observer(({ app, maps }) => {
  if (!maps.selectedMap) {
    return null;
  }

  return (
    <div className={`${style.mainContainer} h-full`}>
      <div className="h-full relative">
        {
          maps.maps.map(map => <div
            key={map.id}
            className="h-full w-full flex min-h-0 absolute bg-white"
            style={{ zIndex: map === maps.selectedMap ? 1 : 0 }}
          >
            <div className={`h-full ${map.showCanvas ? "" : "hidden"} ${style.canvasWrapper}`}>
              <Canvas map={map} />
            </div>
            {
              map.showTaskList && <Resizable
                minWidth="320px"
                enable={resizeEnable}
                defaultSize={resizeDefaultSize}
              >
                <div className={`${style.taskListWrapper} h-full son-h-full`}>
                  <TaskList map={map} tree={map.tree}/>
                </div>
              </Resizable>
            }
            {
              map.showNotes && <Notes />
            }
            </div>
          )
        }
      </div>
      {
        maps.selectedMap && <div className={style.footWrapper}>
          <Footer app={app} map={maps.selectedMap} />
        </div>
      }
    </div>
  )
});

export default Home;