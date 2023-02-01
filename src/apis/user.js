import instance from "./index";

export default {
  async login(email, password) {
    const res = await instance.post("/user/login", {
      email,
      password
    });
    if (res.data) {
      localStorage.setItem("jwtToken", res.data.token);
      localStorage.setItem("userId", res.data.id);
      localStorage.setItem("email", res.data.email);
    }
    return res;
  },
  async signup(email, password) {
    const res = await instance.post("/user", {
      email,
      password
    });
    if (res.data) {
      localStorage.setItem("jwtToken", res.data.token);
      localStorage.setItem("userId", res.data.id);
      localStorage.setItem("email", res.data.email);
    }
    return res;
  },
  getMaps(userId, subRelations) {
    let url = `/user/${userId}/maps`;
    if (subRelations?.length > 0) {
      url += `?subRelations=${subRelations.join(",")}`; 
    }
    return instance.get(url);
  },
  async delete(userId) {
    return await instance.delete(`/user/${userId}`);
  },
};