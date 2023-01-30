import instance from "./index";

export default {
  add({
    mapId,
    title,
    finishedTime,
    finished,
    comment,
    priority,
    parentId
  }) {
    return instance.post("/node", {
      mapId,
      title,
      finishedTime,
      finished,
      comment,
      priority,
      parentId
    });
  },
  edit(id, content) {
    return instance.put(`/node/${id}`, content);
  },
  editBatch(ids, contents) {
    return instance.put("/nodes", {
      ids,
      contents
    });
  },
  removeBatch(nodeIds) {
    return instance.delete("/nodes", {
      data: {
        ids: nodeIds
      }
    });
  },
  addTag(nodeId, tagId) {
    return instance.post(`/node/${nodeId}/tag/${tagId}`);
  },
  addTags(nodeId, tagIds) {
    return instance.post(`/node/${nodeId}/tags`, {
      tagIds
    });
  },
  removeTag(nodeId, tagId) {
    return instance.delete(`/node/${nodeId}/tag/${tagId}`);
  },
  removeTags(nodeId, tagIds) {
    return instance.delete(`/node/${nodeId}/tags`, {
      data: {
        tagIds
      }
    });
  },
  addCondition(sourceId, targetId, text) {
    return instance.post(`/node/${sourceId}/condition/`, {
      targetId,
      text
    });
  },
  setBackground(nodeId, file) {
    const form = new FormData();
    form.set("file", file);
    return instance.post(`/node/${nodeId}/background`, form);
  },
  removeBackground(nodeId) {
    return instance.delete(`/node/${nodeId}/background`);
  }
}