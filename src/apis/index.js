import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3005/api",
  validateStatus(status) {
    return status < 400;
  }
});

instance.interceptors.request.use((req) => {
  const jwtToken = localStorage.getItem("jwtToken");
  if (jwtToken) {
    req.headers.set("Authorization", `Bearer ${jwtToken}`);
  }
  return req;
});

export default instance;