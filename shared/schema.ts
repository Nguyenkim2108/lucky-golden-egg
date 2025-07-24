// shared/schema.ts

// Định nghĩa kiểu cho một yêu cầu để cập nhật trứng
export interface UpdateEggRequest {
  id: number;        // ID của trứng
  status: "broken" | "unbroken"; // Trạng thái của trứng (ví dụ: "broken", "unbroken")
  reward?: number;   // Phần thưởng của trứng, có thể không có nếu chưa được quyết định
  allowed?: boolean; // Cho phép thay đổi trạng thái của trứng hay không (tùy chọn)
}

// Định nghĩa kiểu cho một yêu cầu để tạo một liên kết
export interface CreateLinkRequest {
  url: string;        // Địa chỉ URL
  description: string; // Mô tả về liên kết
  domain?: string;    // (Tùy chọn) Địa chỉ miền của liên kết
  subdomain?: string; // (Tùy chọn) Subdomain cho liên kết
  path?: string;      // (Tùy chọn) Đường dẫn cho liên kết
  protocol?: string;  // (Tùy chọn) Giao thức của liên kết (http, https)
}

// Định nghĩa kiểu cho một phản hồi về trứng
export interface EggResponse {
  id: number;        // ID của trứng
  broken: boolean;   // Trạng thái của trứng
  reward: number | string; // Phần thưởng của trứng, có thể là một con số hoặc chuỗi
}

// Định nghĩa kiểu cho phản hồi khi lấy thông tin của liên kết
export interface LinkResponse {
  id: number;       // ID của liên kết
  url: string;      // Địa chỉ URL
  description: string; // Mô tả về liên kết
  createdAt: string;  // Thời gian tạo liên kết
  subdomain?: string; // (Tùy chọn) Subdomain của liên kết
  domain: string;    // Miền của liên kết
  path?: string;     // (Tùy chọn) Đường dẫn của liên kết
  protocol?: string; // (Tùy chọn) Giao thức của liên kết
}

// Định nghĩa kiểu cho cấu hình tỉ lệ thắng toàn cầu
export interface GlobalWinRateConfig {
  minRate: number;  // Tỉ lệ thắng tối thiểu
  maxRate: number;  // Tỉ lệ thắng tối đa
  rewardMultiplier: number; // Hệ số phần thưởng
  useGroups?: boolean;  // (Tùy chọn) Sử dụng nhóm thắng (group A, B)
  groups?: {
    groupA?: { winRate: number, eggIds: number[] }; // (Tùy chọn) Nhóm A: Tỉ lệ thắng và danh sách trứng
    groupB?: { winRate: number, eggIds: number[] }; // (Tùy chọn) Nhóm B: Tỉ lệ thắng và danh sách trứng
  };
}

// Định nghĩa kiểu cho thông tin người dùng
export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

// Định nghĩa kiểu cho phản hồi khi lấy danh sách người dùng
export interface UserListResponse {
  users: User[];  // Danh sách người dùng
  totalCount: number; // Tổng số người dùng
}

// Định nghĩa kiểu cho yêu cầu đăng nhập
export interface LoginRequest {
  email: string;  // Địa chỉ email
  password: string; // Mật khẩu
}

// Định nghĩa kiểu cho phản hồi đăng nhập
export interface LoginResponse {
  token: string;   // Mã thông báo (JWT token) khi đăng nhập thành công
  user: User;      // Thông tin người dùng đã đăng nhập
}

// Định nghĩa kiểu cho yêu cầu cập nhật thông tin người dùng
export interface UpdateUserRequest {
  username?: string;  // Tên người dùng mới (tùy chọn)
  email?: string;     // Địa chỉ email mới (tùy chọn)
}

// Định nghĩa kiểu cho cấu hình liên kết
export interface LinkConfig {
  maxLinks: number;   // Số lượng liên kết tối đa
  expireTime: number; // Thời gian hết hạn của liên kết (tính bằng giây)
}
