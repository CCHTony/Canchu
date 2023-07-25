async function TryErr(asyFunc){
  try{
    await asyFunc
  }
  catch (err) {
		// 若有任何錯誤，回傳伺服器錯誤並顯示錯誤訊息在後端
		res.status(500).json({ error: "Server Error." });
		console.log(err);
	}
}


module.exports = {
  TryErr
};