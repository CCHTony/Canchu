async function TryErr(asyFunc, res){
  try{
    await asyFunc
  }
  catch (err) {
		// 若有任何錯誤，回傳伺服器錯誤並顯示錯誤訊息在後端
    console.log(err);
		return res.status(500).json({ error: "Server Error." });
	}
}

module.exports = {
  TryErr
};