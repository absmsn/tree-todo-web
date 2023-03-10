import instance from "./index";

export default {
  async add(mapId, name) {
    return await instance.post("/tag", {
      mapId,
      name
    });
  },
  async addBatch() {
  },
  async remove(tagId) {
    return instance.delete(`/tag/${tagId}`);
  },
  async edit(tagId, content) {
    return instance.put(`/tag/${tagId}`, content);
  },
};