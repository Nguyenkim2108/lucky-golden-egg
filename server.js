const express = require("express");
const path = require("path");
const app = express();

// Đường dẫn tới thư mục chứa các file tĩnh (HTML, CSS, JS)
const staticFolder = path.join(__dirname);

// Cung cấp các file tĩnh từ thư mục gốc
app.use(express.static(staticFolder));

// Khi truy cập vào đường dẫn gốc '/', gửi về file index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(staticFolder, 'index.html'));
});

// Đặt port mà ứng dụng sẽ chạy (Render sẽ cung cấp PORT tự động)
const port = process.env.PORT || 3000;

// Khởi chạy server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
