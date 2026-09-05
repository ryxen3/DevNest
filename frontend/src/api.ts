import axios from "axios";
const api = axios.create({ baseURL: "http://localhost:3000/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("devnest_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const request = async <T>(
  method: string,
  url: string,
  data?: unknown,
) => {
  const response = await api.request({ method, url, data });
  return response.data.data as T;
};
