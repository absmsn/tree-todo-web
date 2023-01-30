import axios from "axios";

const localBaseURL = "http://localhost:3005/api";
const baseURL = process.env.NODE_ENV === "production" 
  ? (process.env.REACT_APP_API_PREFIX ?? localBaseURL)
  : localBaseURL

const instance = axios.create({
  baseURL: baseURL,
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