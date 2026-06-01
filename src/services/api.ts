import axios from "axios";
import { toast } from "react-toastify";

// 1. Khởi tạo Axios Instance với cấu hình chuẩn dự án
const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Quản lý trạng thái làm mới Token ngầm (Race Condition)
let isRefreshing = false;
let failedQueue: any[] = [];

// Hàm xử lý và giải phóng hàng đợi request đang chờ token mới
const processQueue = (token: string | null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(new Error("Session expired"));
    }
  });
  failedQueue = [];
};

// =================================================================
// [REQUEST INTERCEPTOR]: Tự động đính kèm Access Token vào Header
// =================================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =================================================================
// [RESPONSE INTERCEPTOR]: Xử lý lỗi 401 & Kiểm soát cơ chế Auto-Refresh
// =================================================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // TRƯỜNG HỢP 1: Xử lý mất kết nối mạng hoặc Server sập hoàn toàn
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

    // TRƯỜNG HỢP 2: Đánh chặn lỗi 401 tại chính các API Auth cơ bản (Login / Register)
    // Phải trả lỗi trực tiếp về Form Component để hiển thị, tuyệt đối không cho Auto-Refresh
    if (
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/register")
    ) {
      const message = error.response?.data?.message || "Authentication failed";
      toast.error(Array.isArray(message) ? message[0] : message);
      return Promise.reject(error);
    }

    // TRƯỜNG HỢP 3: Chính request làm mới token (/auth/refresh) cũng bị trả về 401
    // Nghĩa là cả Access Token và Refresh Token đều đã chết -> Đăng xuất ngay lập tức
    if (originalRequest.url.includes("/auth/refresh")) {
      processQueue(null); // Từ chối toàn bộ các request đang xếp nốt trong hàng đợi
      localStorage.removeItem("accessToken");

      // CHẶN LOOP: Chỉ ép trình duyệt chuyển hướng nếu hiện tại không ở sẵn trang /login
      if (window.location.pathname !== "/login") {
        const errorMessage = error.response?.data?.message || "Session expired, please login again.";
        // Xử lý nếu Backend trả về mảng lỗi (ví dụ của class-validator trả về array)
        const finalMessage = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;
        // Lưu thẳng vào sessionStorage làm tin nhắn chờ
        sessionStorage.setItem("TOAST_MESSAGE", finalMessage);
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // TRƯỜNG HỢP 4: Bỏ qua và bắn thông báo lỗi thông thường nếu không phải mã lỗi 401 Unauthorized
    if (error.response?.status !== 401) {
      const data = error.response?.data;
      let message = data?.message || "Something went wrong";
      if (Array.isArray(message)) {
        message = message[0];
      }
      toast.error(message);
      return Promise.reject(error);
    }

    // TRƯỜNG HỢP 5: Lỗi 401 từ các API chức năng thông thường -> Bắt đầu luồng Refresh Token
    // Nếu request này đã từng thử lại một lần rồi (đã refresh rồi vẫn bốc lỗi 401 tiếp) -> Hủy bỏ để tránh lặp vô hạn
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // Kịch bản phụ: Nếu đang có một request khác đi xin token mới, đẩy request này vào hàng đợi (Queue)
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest); // Thực thi lại chính request gốc với token mới tinh
        })
        .catch((err) => Promise.reject(err));
    }

    // Kịch bản chính: Kích hoạt quá trình đi xin Access Token mới (Chỉ chạy duy nhất 1 instance)
    isRefreshing = true;

    return new Promise(async (resolve, reject) => {
      try {
        // LƯU Ý: Phải gọi qua thư viện `axios` gốc, không gọi qua instance `api` để tránh đè trùng lặp cấu hình
        const res = await axios.post(
          "http://localhost:3000/auth/refresh",
          {},
          { withCredentials: true }
        );

        // Phòng vệ cấu hình dữ liệu trả về từ NestJS (Hỗ trợ cả bọc data lẫn không bọc data)
        const newToken = res.data?.data?.accessToken || res.data?.accessToken;

        if (!newToken) {
          throw new Error("No token returned from server");
        }

        // Cập nhật token mới vào Storage và cấu hình mặc định cho các request tiếp theo
        localStorage.setItem("accessToken", newToken);
        api.defaults.headers.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Kích hoạt giải phóng, phân phối token mới cho toàn bộ các request đang nằm chờ trong hàng đợi
        processQueue(newToken);

        // Giải quyết request gốc ban đầu thành công mượt mà
        resolve(api(originalRequest));
      } catch (err) {
        processQueue(null);
        localStorage.removeItem("accessToken");

        // CHẶN LOOP: Kiểm tra xem có phải các API ẩn chạy ngầm làm lỗi khi đang đứng ở trang login hay không
        if (window.location.pathname !== "/login") {
          toast.error("Login expired, please login again");
          window.location.href = "/login";
        } else {
          console.warn("Background API authentication failed while on login page.");
        }

        reject(err);
      } finally {
        isRefreshing = false; // Trả lại trạng thái ban đầu cho interceptor
      }
    });
  }
);

export default api;