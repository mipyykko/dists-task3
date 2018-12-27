var express = require('express')
var fcm = require('firebase-admin')
var cors = require('cors')
var bodyParser = require('body-parser')
var serviceAccount = require('./serviceaccount.json')

var app = express()

app.use(cors())
app.use(bodyParser.json())

fcm.initializeApp({
  credential: fcm.credential.cert(serviceAccount),
  databaseURL: 'https://dists-task3.firebaseio.com'
})

var sendingMessages = true
var messageIdx = 0
const registeredClients = []

const sendMessage = () => {
  if (registeredClients.length > 0) {
    const messageContent = `Message #${++messageIdx}` 

    registeredClients.forEach(token => {
      var message = {
        'notification': {
          'title': `Message #${messageIdx}`,
          'body': `${messageContent} sent to ${token}` // at date...
        },
        'token': token
      }

      fcm
        .messaging()
        .send(message)
        .then(res => {
          // console.log(`Success sending: ${res}`)
        })
        .catch(err => {
          console.log(`Error sending: ${err}`)
        })
    })

    console.log(messageContent)
  }

  if (sendingMessages) {
    setTimeout(sendMessage, 1000 + Math.random() * 500)
  }
}

app.get("/", (req, res) => {
  res.send("hello")
})

app.post("/register", (req, res) => {
  const { token } = req.body

  if (token) {
    if (!registeredClients.includes(token)) {
      registeredClients.push(token)
      console.log("registered: ", token)
      
      res.sendStatus(200)
    }     
  } else {
    res.sendStatus(500)
  } 
})

var server = app.listen(8082, () => {
  var host = server.address().address
  var port = server.address().port
  console.log(`Listening at port ${port}`)

  setTimeout(sendMessage, 1000 + Math.random() * 500)
})



