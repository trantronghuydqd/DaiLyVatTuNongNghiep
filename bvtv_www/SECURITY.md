# Security Configuration - Đại lý BVTV Sáu Hiệp

## 📋 Tổng quan phân quyền

### 1. **GUEST (Khách chưa đăng nhập)**

✅ **Có thể:**

-   Xem danh sách sản phẩm (`GET /api/product-units/**`)
-   Xem danh mục (`GET /api/categories/**`)
-   Xem phương thức thanh toán (`GET /api/payment-methods`)
-   Xem thông tin cửa hàng (`GET /api/store-settings`)
-   Xem khu vực/ấp (`GET /api/areas`)
-   Kiểm tra mã giảm giá (`GET /api/coupons/validate/**`)
-   **Tạo đơn hàng** (`POST /api/orders`) - Không cần đăng nhập
-   Đăng ký tài khoản (`POST /api/auth/register`)

❌ **Không thể:**

-   Xem đơn hàng đã đặt
-   Quản lý profile
-   Truy cập trang quản trị

---

### 2. **CUSTOMER (Khách hàng)**

✅ **Có thể (bổ sung thêm GUEST):**

-   Xem đơn hàng của mình (`GET /api/orders/my-orders`)
-   Xem và chỉnh sửa profile của mình (`GET/PUT /api/profiles/me`)
-   Tất cả quyền của GUEST

❌ **Không thể:**

-   Xem đơn hàng của người khác
-   Truy cập trang quản trị
-   Quản lý sản phẩm, khách hàng

---

### 3. **STAFF (Nhân viên)**

✅ **Có thể (bổ sung thêm CUSTOMER):**

**Quản lý Đơn hàng:**

-   Xem tất cả đơn hàng (`GET /api/orders/**`)
-   Tạo, sửa, hủy đơn hàng (`POST/PUT /api/orders/**`)

**Quản lý Sản phẩm:**

-   Thêm sản phẩm mới (`POST /api/products/**`)
-   Sửa thông tin sản phẩm (`PUT /api/products/**`)

**Quản lý Danh mục:**

-   Thêm danh mục mới (`POST /api/categories`)
-   Sửa danh mục (`PUT /api/categories/**`)

**Quản lý Khách hàng:**

-   Xem danh sách khách hàng (`GET /api/profiles`)
-   Thêm khách hàng mới (`POST /api/profiles`)
-   Sửa thông tin khách hàng (`PUT /api/profiles/**`)

**Quản lý Kho:**

-   Xem danh sách kho (`GET /api/warehouses/**`)
-   Xem tồn kho (`GET /api/inventory-movements/**`)
-   Nhập xuất kho (`POST/PUT /api/inventory-movements/**`)

**Quản lý Mã giảm giá:**

-   Xem, thêm, sửa coupon (`GET/POST/PUT /api/coupons/**`)

**Quản lý Khu vực:**

-   Thêm, sửa khu vực/ấp (`POST/PUT /api/areas/**`)

❌ **Không thể:**

-   **Xóa** sản phẩm, danh mục, khách hàng (chỉ ADMIN)
-   Xóa mã giảm giá, khu vực
-   Quản lý phương thức thanh toán
-   Quản lý kho hàng (tạo/xóa kho)
-   Truy cập cấu hình cửa hàng
-   Quản lý user/phân quyền

---

### 4. **ADMIN (Quản trị viên)**

✅ **Toàn quyền:**

-   Tất cả quyền của STAFF
-   **Xóa** sản phẩm, danh mục, khách hàng
-   Xóa mã giảm giá, khu vực
-   Quản lý phương thức thanh toán (`POST/PUT/DELETE /api/payment-methods/**`)
-   Quản lý kho hàng (`POST/PUT/DELETE /api/warehouses/**`)
-   Cấu hình cửa hàng (`ALL /api/store-settings/**`)
-   Quản lý user và phân quyền (`ALL /api/admin/**`)

---

## 🔐 Endpoints Authentication

### Public (Guest)

```
GET    /api/products/**
GET    /api/categories/**
GET    /api/payment-methods
GET    /api/coupons/validate/**
GET    /api/areas
GET    /api/store-settings
POST   /api/orders
POST   /api/auth/register
POST   /api/auth/login
```

### Authenticated (Customer+)

```
GET    /api/orders/my-orders
GET    /api/profiles/me
PUT    /api/profiles/me
GET    /api/auth/me
```

### Staff Only

```
GET    /api/orders/**
POST   /api/orders/**
PUT    /api/orders/**

POST   /api/products/**
PUT    /api/products/**

POST   /api/categories
PUT    /api/categories/**

GET    /api/profiles
POST   /api/profiles
PUT    /api/profiles/**

ALL    /api/inventory-movements/**
GET    /api/warehouses/**

GET    /api/coupons
POST   /api/coupons
PUT    /api/coupons/**

POST   /api/areas
PUT    /api/areas/**
```

### Admin Only

```
DELETE /api/products/**
DELETE /api/categories/**
DELETE /api/profiles/**
DELETE /api/coupons/**
DELETE /api/areas/**

ALL    /api/payment-methods/**
ALL    /api/warehouses/**
ALL    /api/store-settings/**
ALL    /api/admin/**
```

---

## 🔑 Tài khoản Demo

### Admin

-   **Email:** `admin@sauhiep.vn`
-   **Password:** `123`
-   **Quyền:** Toàn quyền

### Staff

-   **Email:** `nhanvien@sauhiep.vn`
-   **Password:** `123`
-   **Quyền:** Nhân viên (không xóa, không quản lý hệ thống)

### Customer

-   Đăng ký tại `/api/auth/register`
-   Tự động có role `CUSTOMER`

---

## 🚀 Testing với Postman/curl

### 1. Login (Form-based)

```bash
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=admin@sauhiep.vn&password=123
```

### 2. Login (HTTP Basic)

```bash
curl -u admin@sauhiep.vn:123 http://localhost:8080/api/auth/me
```

### 3. Kiểm tra auth status

```bash
GET /api/auth/status
```

### 4. Lấy thông tin user hiện tại

```bash
GET /api/auth/me
```

### 5. Đăng ký tài khoản mới

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "123",
  "name": "Nguyễn Văn A",
  "phone": "0901234567",
  "address": "Ấp Bổn Thanh, xã Ngũ Lạc"
}
```

---

## 📝 Notes

1. **Session-based Authentication**: Hệ thống dùng session cookie, sau khi login thành công cookie sẽ được lưu tự động
2. **CSRF disabled**: Đã tắt CSRF cho REST API (cần bật lại nếu có form HTML)
3. **HTTP Basic**: Hỗ trợ HTTP Basic cho testing, frontend nên dùng form login
4. **Password Encoding**: BCrypt với strength 10
5. **Role Prefix**: Spring Security tự thêm prefix `ROLE_` (database lưu `admin`, Spring Security dùng `ROLE_ADMIN`)

---

## ⚠️ Security Recommendations for Production

1. **Bật HTTPS**: Luôn dùng HTTPS trong production
2. **Session timeout**: Cấu hình timeout phù hợp
3. **Rate limiting**: Thêm rate limit cho login endpoint
4. **Password policy**: Yêu cầu password mạnh hơn
5. **Audit logging**: Log các hành động quan trọng
6. **CORS**: Cấu hình CORS chặt chẽ
7. **JWT (optional)**: Có thể chuyển sang JWT cho mobile app
