import { useEffect, useRef, useState } from "react";
import { DEFAULT_SITE_CONFIG, normalizeSiteConfig } from "../utils/siteConfigUtils";

const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const loadTurnstileScript = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (window.__giaphaTurnstilePromise) return window.__giaphaTurnstilePromise;

  window.__giaphaTurnstilePromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.turnstile), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return window.__giaphaTurnstilePromise;
};

export default function LoginModal({ isOpen, onClose, onLogin, siteConfig = DEFAULT_SITE_CONFIG }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);
  const config = normalizeSiteConfig(siteConfig);
  const turnstileConfig = config.security || DEFAULT_SITE_CONFIG.security;
  const shouldUseTurnstile = Boolean(turnstileConfig.turnstileEnabled && turnstileConfig.turnstileSiteKey);

  useEffect(() => {
    if (!isOpen || !shouldUseTurnstile || !turnstileRef.current) return undefined;

    let disposed = false;
    setTurnstileReady(false);
    setTurnstileToken("");

    loadTurnstileScript()
      .then((turnstile) => {
        if (disposed || !turnstileRef.current || !turnstile?.render) return;
        if (turnstileWidgetIdRef.current) {
          turnstile.remove?.(turnstileWidgetIdRef.current);
          turnstileWidgetIdRef.current = null;
        }
        turnstileWidgetIdRef.current = turnstile.render(turnstileRef.current, {
          sitekey: turnstileConfig.turnstileSiteKey,
          theme: turnstileConfig.turnstileTheme || "auto",
          size: turnstileConfig.turnstileSize || "normal",
          callback: (token) => {
            setTurnstileToken(token);
            setTurnstileReady(true);
          },
          "expired-callback": () => {
            setTurnstileToken("");
            setTurnstileReady(false);
          },
          "error-callback": () => {
            setTurnstileToken("");
            setTurnstileReady(false);
            setError("Turnstile chưa xác minh được. Vui lòng thử lại.");
          }
        });
      })
      .catch(() => {
        if (!disposed) {
          setTurnstileReady(false);
          setError("Không tải được Turnstile. Vui lòng kiểm tra kết nối.");
        }
      });

    return () => {
      disposed = true;
      if (window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.remove?.(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [
    isOpen,
    shouldUseTurnstile,
    turnstileConfig.turnstileSiteKey,
    turnstileConfig.turnstileTheme,
    turnstileConfig.turnstileSize
  ]);

  const resetTurnstile = () => {
    if (window.turnstile && turnstileWidgetIdRef.current) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
    setTurnstileToken("");
    setTurnstileReady(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      return setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
    }
    if (shouldUseTurnstile && !turnstileToken) {
      return setError("Vui lòng hoàn tất xác minh bảo mật.");
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, turnstileToken })
      });
      const data = await res.json();

      if (data.success) {
        onLogin(data.user);
        // Reset form states
        setUsername("");
        setPassword("");
        setError("");
        resetTurnstile();
        onClose();
      } else {
        setError(data.error || "Đăng nhập thất bại.");
        resetTurnstile();
      }
    } catch {
      setError("Không thể kết nối tới máy chủ.");
      resetTurnstile();
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

            {shouldUseTurnstile && (
              <div className="form-group turnstile-login-field">
                <label>Xác minh bảo mật</label>
                <div ref={turnstileRef} className="turnstile-widget" />
                {!turnstileReady && (
                  <small style={{ color: "var(--text-muted)" }}>
                    Turnstile sẽ tự xác minh trước khi đăng nhập.
                  </small>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={shouldUseTurnstile && !turnstileReady}
              style={{ marginTop: "10px", width: "100%" }}
            >
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
