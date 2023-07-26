const app = require('./server')

// 啟動伺服器監聽指定的端口，並在啟動後印出 'Server is running' 訊息
app.listen(3000, () => {
	console.log('Server is running');
});