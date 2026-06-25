import { useState } from "react";
import { DEFAULT_SITE_CONFIG, normalizeSiteConfig } from "../utils/siteConfigUtils";

export default function LoginModal({ isOpen, onClose, onLogin, siteConfig = DEFAULT_SITE_CONFIG }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const config = normalizeSiteConfig(siteConfig);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      return setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();

      if (data.success) {
        onLogin(data.user);
        // Reset form states
        setUsername("");
        setPassword("");
        setError("");
        onClose();
      } else {
        setError(data.error || "Đăng nhập thất bại.");
      }
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass animate-scale-up" style={{ maxWidth: "400px" }}>
        <div className="modal-header">
          <h3>🔑 Đăng nhập hệ thống</h3>
          <button className="sidebar-close" onClick={onClose}>
            ❌
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center" }}>
              {config.loginDescription}
            </p>

            {/* Error Message */}
            {error && (
              <div 
                style={{ 
                  background: "rgba(220, 53, 69, 0.15)", 
                  border: "1px solid rgba(220, 53, 69, 0.3)", 
                  color: "#dc3545", 
                  padding: "10px", 
                  borderRadius: "8px", 
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textAlign: "center"
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label>Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                placeholder="Nhập tên đăng nhập..."
                required
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Nhập mật khẩu bảo mật..."
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "10px", width: "100%" }}>
              🔑 Đăng nhập
            </button>

            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
              Tài khoản quản trị được cấp riêng khi bàn giao hệ thống.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
