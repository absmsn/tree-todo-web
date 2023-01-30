import instance from "./index";

export default {
  async add(userId, name) {
    const res = await instance.post("/map", {
      userId,
      name
    });
    return res;
  },
  remove(mapId) {
    return instance.delete(`/map/${mapId}`, {
      data: {
        mapId
      }
    });
  },
  edit(mapId, content) {
    return instance.put(`/map/${mapId}`, content);
  },
  getNodes(mapId) {
    return instance.get(`/map/${mapId}/nodes`);
  },
  getEdges(mapId) {
    return instance.get(`/map/${mapId}/edges`);
  }
};