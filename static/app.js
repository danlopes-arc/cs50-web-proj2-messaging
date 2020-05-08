document.addEventListener("DOMContentLoaded", () => {
  setSocket()
  const username = localStorage.getItem("username")
  if (username !== null) {
    const request = new XMLHttpRequest()
    request.open("GET", `/users/${username}`)
    request.onload = () => {
      const resp = JSON.parse(request.response)
      if (resp.success) {
        openMainPage()
        return
      }
      localStorage.clear()
      openLoginPage()
    }
    request.send()
    return
  }
  openLoginPage()
})

function scrollToBottom() {
  const msgArea = document.getElementById("message-area");
  if (msgArea !== null) {
    msgArea.scrollTop = msgArea.scrollHeight;
  }
}

function setInputChecking(input, button) {
  function check() {
    if (input.value === "") {
      button.setAttribute("disabled", "disabled")
    }
    else {
      button.removeAttribute("disabled")
    }
  }
  input.oninput = () => check()
  check()
}

function openNewChannelPage() {
  const app = document.getElementById("content")
  const appContent = app.innerHTML
  
  const newChannelBtn = document.getElementById("new-channel")
  const newChannelBtnText = document.getElementById("new-channel-text")
  const newChannelBtnTextInner = newChannelBtnText.innerHTML

  newChannelBtnText.innerHTML = "Cancel"
  const newChannelBtnOnclick = newChannelBtn.onclick

  function reset() {
    app.innerHTML = appContent
    newChannelBtnText.innerHTML = newChannelBtnTextInner
    newChannelBtn.onclick = newChannelBtnOnclick
    openMainPage()
  }

  newChannelBtn.onclick = reset

  const channelT = Handlebars.compile(document.querySelector("#h-new-channel").innerHTML)
  const channelC = channelT()
  app.innerHTML = channelC

  submitBtn = document.querySelector("#form-new-channel [type=submit]")
  channelInput = document.getElementById("input-channel-name")

  setInputChecking(channelInput, submitBtn)

  document.getElementById("form-new-channel").onsubmit = () => {
    document.getElementById("error-channel-name").setAttribute("hidden", "hidden")
    const channelName = channelInput.value.trim()

    const request = new XMLHttpRequest()
    request.open("POST", "/channels")
    request.onload = () => {
      const resp =  JSON.parse(request.response)
      if (!resp.success) {
        document.getElementById("error-channel-name").removeAttribute("hidden")
        return
      }
      localStorage.setItem("channel", channelName)
      reset()
    }
    const data = new FormData()
    data.set("channel-name", channelName)
    request.send(data)
    return false
  }
}

function openLoginPage() {
  const app = document.getElementById("content")
  const appContent = app.innerHTML
  const headerToolbar = document.getElementById("header-toolbar")
  const headerToolbarInner = document.getElementById("header-toolbar").innerHTML
  headerToolbar.innerHTML = ""
  const loginT = Handlebars.compile(document.querySelector("#h-login").innerHTML)
  const loginC = loginT()
  app.innerHTML = loginC

  submitBtn = document.querySelector("#form-login [type=submit]")
  usernameInput = document.getElementById("input-username")

  setInputChecking(usernameInput, submitBtn)

  document.getElementById("form-login").onsubmit = () => {
    document.getElementById("error-username").setAttribute("hidden", "hidden")
    const username = usernameInput.value.trim()

    const request = new XMLHttpRequest()
    request.open("POST", `/users`)
    request.onload = () => {
      const resp =  JSON.parse(request.response)
      if (!resp.success) {
        document.getElementById("error-username").removeAttribute("hidden")
        return
      }
      app.innerHTML = appContent
      headerToolbar.innerHTML = headerToolbarInner

      localStorage.setItem("username", username)
      openMainPage()

    }

    const data = new FormData()
    data.set("username", username)
    request.send(data)
    return false
  }
}

function openMainPage() {
  document.getElementById("username").innerHTML = localStorage.getItem("username")
  document.getElementById("new-channel").onclick = openNewChannelPage

  const channels = []

  const request = new XMLHttpRequest()
  request.open("GET", "/channels")
  request.onload = () => {
    const resp =  JSON.parse(request.response)
    if (!resp.success) {
      return
    }
    channels.push(...resp.channels)

    const channelsElm = document.getElementById("channels")
    channelsElm.innerHTML = ""

    channels.forEach(channel => {
      appendChannel(channel.name)
      document.getElementById("search-channels").oninput = searchChannels
    });
    if (localStorage.getItem("channel") !== null) {
      openChannel(localStorage.getItem("channel"))
    }
    else {
      document.getElementById("message-input").setAttribute("disabled", "disabled")
    }
  }
  request.send()
}

function openChannel(channelName) {
  requestCannel(channelName, channel => {
    if (channel !== null) {
      const chTitle = document.getElementById("channel-title")
      chTitle.innerHTML = channelName

      const msgArea = document.getElementById("message-area")
      msgArea.innerHTML = ""

      channel.messages.forEach(msg => {
        appendMessage(msg)
      });
      const msgInput = document.getElementById("message-input")
      msgInput.onkeydown = (e) => {
        const text = e.target.value
        if (text === "") {
          return
        }
        if (e.keyCode === 13) {
          // sendMessage(text)
          emitMessage(text)
          e.target.value = ""
        }
      }
      document.getElementById("message-input").removeAttribute("disabled")
      localStorage.setItem("channel", channelName)
      scrollToBottom()
    }
    else {
      localStorage.removeItem("channel")
      openMainPage()
    }
  })

}

function parseElement(innerHTML) {
  const elm = document.createElement("div")
  elm.innerHTML = innerHTML
  return elm.firstElementChild
}

function requestCannels(callback) {
  const request = new XMLHttpRequest()
  request.open("GET", "/channels")
  request.onload = () => {
    const resp =  JSON.parse(request.response)
    if (!resp.success) {
      callback(null)
    }
    callback(resp.channels)
  }
  request.send()
}

function requestCannel(channelName, callback) {
  const request = new XMLHttpRequest()
  request.open("GET", `/channel/${channelName}`)
  request.onload = () => {
    const resp =  JSON.parse(request.response)
    if (!resp.success) {
      callback(null)
    }
    callback(resp.channel)
  }
  request.send()
}

function sendMessage(text) {
  const request = new XMLHttpRequest()
    request.open("POST", "/send")
    request.onload = () => {
      const resp = JSON.parse(request.response)
      if (!resp.success) {
        return
      }
      openChannel(localStorage.getItem("channel"))
    }

    const data = new FormData()
    data.set("username", localStorage.getItem("username"))
    data.set("text", text)
    data.set("channel-name", localStorage.getItem("channel"))
    request.send(data)
}

function emitMessage(text) {
  const socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port)
  socket.emit("messageSent", {
    username: localStorage.getItem("username"),
    channelName: localStorage.getItem("channel"),
    text: text
  })
}

function setSocket() {
  const socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port)
  socket.on("newMessage", data => {
    if (data.channel === localStorage.getItem("channel")) {
      appendMessage(data.message)
    }
  })

  socket.on("newChannel", data => {
    appendChannel(data.channel)
  })
}

function appendMessage(msg) {
  const msgArea = document.getElementById("message-area")

  const messageMineText = msg.user === localStorage.getItem("username") ? "message-mine" : ""

  const msgBoxInner = Handlebars.compile(document.getElementById("h-message-box").innerHTML)({
    username: msg.user === localStorage.getItem("username") ? null : msg.user,
    text: msg.text,
    time: `${msg.datetime.hour}:${msg.datetime.minute}`,
    messageMine: messageMineText
  })
  const msgBox = parseElement(msgBoxInner)

  const wasOnBottom = msgArea.offsetHeight + msgArea.scrollTop === msgArea.scrollHeight

  msgArea.append(msgBox)

  if (wasOnBottom) {
    scrollToBottom()
  }
}

function appendChannel(channelName) {
  const channelsElm = document.getElementById("channels")
  const chInner = Handlebars.compile(document.getElementById("h-channel").innerHTML)({channelName: channelName})

  const chElm = parseElement(chInner)
  chElm.onclick = () => openChannel(channelName)
  channelsElm.append(chElm)
}

function searchChannels(e) {
  console.log(e)
  const text = e.target.value
  const channels = document.querySelectorAll("#channels .channel")
  channels.forEach(channel => {
    
    console.log(channel.querySelector(".channel-name"))
    const name = channel.querySelector(".channel-name").innerText
    if (text !== "" && !name.includes(text)) {
      channel.setAttribute("hidden", "hidden")
    }
    else {
      channel.removeAttribute("hidden")
    }
  });
}