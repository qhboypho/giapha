import { useState } from "react";
import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { getEditableScopeIds } from "../utils/editorScope";

const memberVal = (val) => val === undefined || val === null ? "" : val;

const createEmptyFormData = () => ({
  name: "",
  gender: "nam",
  generation: 1,
  isDeceased: false,
  birthDate: "",
  deathDate: "",
  birthPlace: "",
  restingPlace: "",
  occupation: "",
  bio: "",
  phone: "",
  address: "",
  fatherId: "",
  motherId: "",
  spouseIds: [],
  isFeatured: false,
  avatar: ""
});

const createInitialFormData = (editPerson, addRelativeOf) => {
  if (editPerson) {
    return {
      ...editPerson,
      birthDate: editPerson.birthDate || "",
      deathDate: editPerson.deathDate || "",
      birthPlace: editPerson.birthPlace || "",
      restingPlace: editPerson.restingPlace || "",
      occupation: memberVal(editPerson.occupation),
      bio: memberVal(editPerson.bio),
      phone: memberVal(editPerson.phone),
      address: memberVal(editPerson.address),
      fatherId: editPerson.fatherId || "",
      motherId: editPerson.motherId || "",
      spouseIds: editPerson.spouseIds || [],
      isFeatured: Boolean(editPerson.isFeatured),
      avatar: editPerson.avatar || ""
    };
  }

  if (addRelativeOf) {
    const target = addRelativeOf;

    return {
      ...createEmptyFormData(),
      generation: Math.max(1, target.generation + 1),
      fatherId: target.gender === "nam" ? target.id : "",
      motherId: target.gender === "nu" ? target.id : ""
    };
  }

  return createEmptyFormData();
};

export default function MemberModal({
  isOpen,
  onClose,
  onSubmit,
  editPerson,
  addRelativeOf,
  members,
  currentUser
}) {
  const [formData, setFormData] = useState(() => createInitialFormData(editPerson, addRelativeOf));

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatar: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return alert("Vui lòng điền họ tên thành viên");
    
    // Process input data
    const finalData = {
      ...formData,
      generation: parseInt(formData.generation),
      // Clean dates
      birthDate: formData.birthDate || null,
      deathDate: formData.isDeceased ? (formData.deathDate || null) : null,
      restingPlace: formData.isDeceased ? formData.restingPlace : "",
      // Clean parents
      fatherId: formData.fatherId || null,
      motherId: formData.motherId || null
    };

    onSubmit(finalData);
  };

  const editableScopeIds = getEditableScopeIds(currentUser, members);
  const isAllowedRelationOption = (member) => {
    if (!editableScopeIds) return true;
    return editableScopeIds.has(member.id)
      || member.id === formData.fatherId
      || member.id === formData.motherId
      || formData.spouseIds?.includes(member.id);
  };

  // Get potential fathers (men in family)
  const potentialFathers = members.filter(
    (m) => m.gender === "nam" && m.id !== editPerson?.id && isAllowedRelationOption(m)
  );

  // Get potential mothers (women in family)
  const potentialMothers = members.filter(
    (m) => m.gender === "nu" && m.id !== editPerson?.id && isAllowedRelationOption(m)
  );

  // Get potential spouses
  const potentialSpouses = members.filter(
    (m) => m.id !== editPerson?.id && m.gender !== formData.gender && isAllowedRelationOption(m)
  );

  const title = editPerson ? "Chỉnh sửa thành viên" : "Thêm thành viên mới";

  return (
    <div className="modal-overlay">
      <div className="modal-content glass animate-scale-up">
        <div className="modal-header">
          {addRelativeOf && !editPerson ? (
            <h3 className="member-modal-title">
              <span>📋 Thêm nhân thân cho</span>
              <strong>{addRelativeOf.name}</strong>
            </h3>
          ) : (
            <h3 className="member-modal-title">📋 {title}</h3>
          )}
          <button className="sidebar-close" onClick={onClose}>
            ❌
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Avatar Uploader */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div
                className={`profile-avatar ${formData.isDeceased ? "deceased" : ""} ${formData.avatar ? "" : "generated-avatar"}`}
                style={{
                  width: "80px",
                  height: "80px",
                  fontSize: "1.35rem",
                  ...(formData.avatar ? {} : getAvatarStyle(formData))
                }}
              >
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Preview" className="profile-avatar" style={{ width: "80px", height: "80px", border: "none" }} />
                ) : (
                  getAvatarInitials(formData.name)
                )}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <label className="btn btn-secondary" style={{ flex: "none", fontSize: "0.8rem", cursor: "pointer", borderRadius: "15px" }}>
                  📁 Tải ảnh
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
                {formData.avatar && (
                  <button type="button" className="btn btn-secondary" onClick={handleRemoveAvatar} style={{ flex: "none", fontSize: "0.8rem", borderRadius: "15px", color: "var(--color-brand-accent)" }}>
                    🗑️ Xóa ảnh
                  </button>
                )}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Họ và tên *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Nhập họ và tên..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Giới tính</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                </select>
              </div>

              <div className="form-group">
                <label>Đời thứ mấy (Thế hệ)</label>
                <input
                  type="number"
                  name="generation"
                  min="1"
                  max="12"
                  value={formData.generation}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    name="isDeceased"
                    checked={formData.isDeceased}
                    onChange={handleChange}
                  />
                  Đã qua đời (Đã mất)
                </label>
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                  />
                  Người tiêu biểu
                </label>
              </div>

              <div className="form-group">
                <label>Ngày sinh</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {formData.isDeceased && (
                <div className="form-group">
                  <label>Ngày mất</label>
                  <input
                    type="date"
                    name="deathDate"
                    value={formData.deathDate}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Nơi sinh / Nguyên quán</label>
                <input
                  type="text"
                  name="birthPlace"
                  value={formData.birthPlace}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ví dụ: Nam Định..."
                />
              </div>

              {formData.isDeceased ? (
                <div className="form-group">
                  <label>Nơi an nghỉ (Mộ phần)</label>
                  <input
                    type="text"
                    name="restingPlace"
                    value={formData.restingPlace}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Địa chỉ nghĩa trang..."
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Số liên hệ..."
                  />
                </div>
              )}

              {!formData.isDeceased && (
                <div className="form-group form-group-wide">
                  <label>Địa chỉ hiện tại</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Địa chỉ thường trú..."
                  />
                </div>
              )}

              <div className="form-group">
                <label>Nghề nghiệp</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Công việc..."
                />
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border-card)", margin: "20px 0" }} />

            {/* Relationships configuration */}
            <div className="form-grid">
              <div className="form-group">
                <label>Cha ruột</label>
                <select
                  name="fatherId"
                  value={formData.fatherId}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Không có thông tin / Cụ tổ</option>
                  {potentialFathers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Đời {f.generation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Mẹ ruột</label>
                <select
                  name="motherId"
                  value={formData.motherId}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Không có thông tin / Cụ tổ</option>
                  {potentialMothers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Đời {m.generation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group form-group-wide">
                <label>Bạn đời (Vợ / Chồng)</label>
                <select
                  name="spouseIds"
                  value={formData.spouseIds?.[0] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      spouseIds: val ? [val] : []
                    }));
                  }}
                  className="form-select"
                >
                  <option value="">Chưa kết hôn / Không rõ</option>
                  {potentialSpouses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Đời {s.generation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid full-width" style={{ marginTop: "16px" }}>
              <div className="form-group">
                <label>Tiểu sử / Tóm tắt cuộc đời</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  className="form-textarea"
                  placeholder="Nhập vài thông tin tiểu sử, hoạt động nổi bật..."
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn btn-primary">
              💾 Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
