const {app} = require('../server'); // 引入你的 Express 應用程式


server = app.listen(3000, () => {
  console.log(`Server is running`);
});

module.exports = server;