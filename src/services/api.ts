import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

// xử lý queue request chờ token mới
const processQueue = (token: string | null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject();
    }
  });
  failedQueue = [];
};

// REQUEST: gắn token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// RESPONSE: handle 401 + refresh 1 lần duy nhất
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      let networkMessage = "An unexpected network error occurred.";

      if (error.code === 'ECONNABORTED') {
        networkMessage = "Connection timeout. Please try again.";
      } else if (error.message === 'Network Error') {
        networkMessage = "Server is unreachable. It might be down or restarting.";
      }

      toast.error(networkMessage, { toastId: "network-error" });
      return Promise.reject(error);
    }
    if (error.response?.status !== 401) {
      const data = error.response?.data;
      let message = data?.message || "Something went wrong";
      if (Array.isArray(message)) {
        message = message[0];
      }
      toast.error(message);
      return Promise.reject(error);
    }


    // nếu request refresh chính nó → logout luôn
    if (originalRequest.url.includes("/auth/refresh")) {
      localStorage.removeItem("accessToken");
      toast.error("Session expired");
      return Promise.reject(error);
    }

    // nếu đã retry rồi → không retry nữa
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // nếu đang refresh → đưa request vào queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    isRefreshing = true;

    return new Promise(async (resolve, reject) => {
      try {
        const res = await axios.post(
          "http://localhost:3000/auth/refresh",
          {},
          { withCredentials: true }
        );

        const newToken = res.data.data.accessToken;

        localStorage.setItem("accessToken", newToken);

        api.defaults.headers.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(newToken);

        resolve(api(originalRequest));
      } catch (err) {
        processQueue(null);

        localStorage.removeItem("accessToken");
        toast.error("Login expired, please login again");
        window.location.href = "/login";

        reject(err);
      } finally {
        isRefreshing = false;
      }
    });
  }
);

export default api;