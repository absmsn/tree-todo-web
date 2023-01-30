import instance from "./index";

export default {
  edit(sourceId, targetId, content) {
    return instance.put(`/condition/source/${sourceId}/target/${targetId}`, content);
  },
  remove(sourceId, targetId) {
    return instance.delete(`/condition/source/${sourceId}/target/${targetId}`);
  }
};