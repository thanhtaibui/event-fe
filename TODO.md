# TODO

## Task: Nâng cấp viền nút header (Login / Get Started / Light-Dark mode)

- [ ] Phân tích style hiện tại của `EventixHeader` (đã xem `EventixHeader.tsx` + `eventixHeader.css`).
- [ ] Lập plan chỉnh CSS để viền nút đẹp hơn ở cả dark và light, xử lý hover/focus.
- [ ] Sửa `src/styles/user/eventixHeader.css`:
  - Tăng độ “glass” và độ mảnh viền cho `.user-eventixHeader__btn--ghost`, `.user-eventixHeader__btn--primary`, `.user-eventixHeader__themeToggle`.
  - Bổ sung pseudo-element/ring gradient cho hiệu ứng viền.
  - Đồng bộ trạng thái `:hover` và `:focus-visible`.
- [ ] Test nhanh bằng chạy dev server / reload để kiểm tra hiển thị.
