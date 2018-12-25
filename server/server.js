var express = require('express')
var fcm = require('firebase-admin')
var serviceAccount = require('./serviceaccount.json')
var app = express()

fcm.initializeApp({
  credential: fcm.credential.cert(serviceAccount),
  databaseURL: 'https://dists-task3.firebaseio.com'
})

var sendingMessages = true
var messageIdx = 0
const registeredClients = ['1234']

const sendMessage = () => {
  const messageContent = `Message #${++messageIdx}` 

  registeredClients.forEach(token => {
    var message = {
      data: {
        message: `${messageContent} sent to ${token}` // at date...
      },
      token: token
    }

    fcm.messaging().send(message)
      .then(res => {
        console.log(`Success sending: ${res}`)
      })
      .catch(err => {
        console.log(`Error sending: ${err}`)
      })
  })

  console.log(messageContent)

  if (sendingMessages) {
    setTimeout(sendMessage, Math.random() * 500)
  }
}

app.get("/", (req, res) => {
  res.send("hello")
})

app.post("/register", (req, res) => {
  console.log("hell-o")
})

var server = app.listen(8082, () => {
  var host = server.address().address
  var port = server.address().port
  console.log(`Listening at port ${port}`)

  setTimeout(sendMessage, Math.random() * 500)
})



