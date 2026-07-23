;(function () {
  firebase.initializeApp({
    apiKey: "AIzaSyB32T2cjUOQXd0TMExHiIxAOWtSrmSI7g0",
    authDomain: "auth.anirole.com",
    projectId: "charismatic-amp-400411",
  })

  var provider = new firebase.auth.GoogleAuthProvider()
  provider.setCustomParameters({ prompt: "select_account" })

  var btn = document.getElementById("login-btn")
  var statusEl = document.getElementById("status")
  var resultArea = document.getElementById("result-area")
  var tokenInput = document.getElementById("token")
  var copyBtn = document.getElementById("copy-btn")

  function setStatus(msg, type) {
    statusEl.textContent = msg
    statusEl.className = type || ""
  }

  btn.addEventListener("click", function () {
    btn.disabled = true
    btn.innerHTML = '<span class="spinner"></span><span>ログイン中…</span>'
    setStatus("")
    resultArea.classList.add("hidden")
    tokenInput.value = ""

    firebase
      .auth()
      .signInWithPopup(provider)
      .then(function (result) {
        var refreshToken = result.user.refreshToken
        return result.user.getIdToken().then(function () {
          return refreshToken
        })
      })
      .then(function (refreshToken) {
        if (!refreshToken) {
          setStatus("Refresh Token が取得できませんでした", "error")
          resetBtn()
          return
        }
        tokenInput.value = refreshToken
        resultArea.classList.remove("hidden")
        setStatus("ログイン成功", "success")
        resetBtn()
      })
      .catch(function (err) {
        if (
          err.code === "auth/popup-closed-by-user" ||
          err.code === "auth/cancelled-popup-request"
        ) {
          setStatus("")
          resetBtn()
          return
        }
        setStatus("エラー: " + (err.message || err.code), "error")
        resetBtn()
      })
  })

  copyBtn.addEventListener("click", function () {
    if (!tokenInput.value) return
    navigator.clipboard.writeText(tokenInput.value).then(
      function () {
        copyBtn.textContent = "コピーしました"
        copyBtn.classList.add("copied")
        setTimeout(function () {
          copyBtn.textContent = "コピー"
          copyBtn.classList.remove("copied")
        }, 2000)
      },
      function () {
        tokenInput.select()
        document.execCommand("copy")
        copyBtn.textContent = "コピーしました"
        setTimeout(function () { copyBtn.textContent = "コピー" }, 2000)
      }
    )
  })

  function resetBtn() {
    btn.disabled = false
    btn.innerHTML =
      '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>' +
      '<span>Google でログイン</span>'
  }
})()
