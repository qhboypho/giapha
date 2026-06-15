import { useState } from "react";

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const canShowDemoAccounts = import.meta.env.DEV;

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
              Hệ thống yêu cầu mật khẩu để xem thông tin chi tiết gia phả dòng họ.
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

            {canShowDemoAccounts && (
              <>
                <hr style={{ border: "none", borderTop: "1px solid var(--border-card)", margin: "4px 0" }} />

                {/* Expandable Demo Accounts Drawer, local development only. */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                    style={{ fontSize: "0.75rem", padding: "6px 12px", borderRadius: "15px" }}
                  >
                    {showDemoAccounts ? "🙈 Ẩn gợi ý tài khoản thử nghiệm" : "💡 Hiện gợi ý tài khoản thử nghiệm"}
                  </button>

                  {showDemoAccounts && (
                    <div 
                      className="animate-fade"
                      style={{ 
                        background: "rgba(191, 161, 95, 0.05)", 
                        border: "1px solid var(--border-card)", 
                        borderRadius: "8px", 
                        padding: "10px",
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px"
                      }}
                    >
                      <div>
                        <strong>1. Admin (Quản lý toàn bộ):</strong>
                        <div style={{ fontFamily: "monospace", paddingLeft: "8px" }}>Tài khoản: admin / Mật khẩu: admin123</div>
                      </div>
                      <div>
                        <strong>2. Editor (Thêm/Sửa):</strong>
                        <div style={{ fontFamily: "monospace", paddingLeft: "8px" }}>Tài khoản: editor / Mật khẩu: editor123</div>
                      </div>
                      <div>
                        <strong>3. Member (Chỉ xem phả hệ):</strong>
                        <div style={{ fontFamily: "monospace", paddingLeft: "8px" }}>Tài khoản: member / Mật khẩu: member123</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
