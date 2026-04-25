import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h1
        style={{
          fontSize: "72px",
          color: "#6c63ff",
          marginBottom: "30px",
          marginTop: "0",
        }}
      >
        404
      </h1>
      <p style={{ fontSize: "20px", color: "#333" }}>
        Ối! Trang bạn tìm kiếm không tồn tại.
      </p>
      <button
        onClick={() => navigate("/login")}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#6c63ff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          width: "200px",
        }}
      >
        Quay lại trang chủ
      </button>
    </div>
  );
};

export default NotFoundPage;
