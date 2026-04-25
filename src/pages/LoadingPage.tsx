import "../styles/loading.css";

const LoadingPage = () => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="spinner"></div>

        <h2 className="loading-text">Đang tải dữ liệu...</h2>
        <div className="loading-bar-container">
          <div className="loading-bar-progress"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
