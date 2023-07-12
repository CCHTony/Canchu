*My website URL：http://52.64.240.159/* \
**start web server:** \
step1: 啟動instance \
step2: 創建資料夾並使用npm初始化資料夾 \
step3: 創建index.js檔案，並完成程式檔案編輯 \
step4: 輸入 sudo nohup node index.js(使用管理員權限，因port 80被限制)(nohup使檔案可以在背景運作) \

*How to run instance in background* \
When you exit an ssh session, the Operational Systems sends an SIGHUP signal to all the process opened during the ssh session. \
So the “nohup” command prevent the process be closed by the SIGHUP signal.

