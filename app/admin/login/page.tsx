import { adminLogin } from "@/app/admin/auth-actions";

export default function AdminLoginPage() {
  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Admin Login</div>
        <h1 className="page-title">관리자 로그인</h1>
        <p className="page-desc">
          관리자만 등록/수정 페이지에 접근할 수 있습니다.
        </p>
      </header>

      <form action={adminLogin} className="form-panel" style={{ maxWidth: 520 }}>
        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <label className="form-field">
            <span>password</span>
            <input name="password" type="password" required />
          </label>
        </div>

        <button type="submit" className="primary-button">
          로그인
        </button>
      </form>
    </main>
  );
}
