const multer = require('multer'); // 引入 multer 套件，用於處理上傳檔案

// 設定 multer 的存儲方式和目的地
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now()
    cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg')
  }
});
const upload = multer({ storage: storage });

module.exports = {
  upload
}