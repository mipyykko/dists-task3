var express = require('express')
var fcm = require('firebase-admin')
var cors = require('cors')
var bodyParser = require('body-parser')
var serviceAccount = require('./serviceaccount.json')
var loremIpsum = require('lorem-ipsum')

var app = express()

app.use(cors())
app.use(bodyParser.json())

fcm.initializeApp({
  credential: fcm.credential.cert(serviceAccount),
  databaseURL: 'https://dists-task3.firebaseio.com'
})

var sendingMessages = false
var messageIdx = 0
var sentCount = 0
var toBeSentCount = 50
var registeredClients = []
var delayMin = 100
var delayMax = 150
var payloadLength = 5
var randomPayloadMin = 1
var randomPayloadMax = 50
var randomPayload = false
var uniquePayloads = true
let payload = ''

const getPayload = () => payload || loremIpsum({ 
  count: randomPayload ? randomPayloadMin + Math.random() * (randomPayloadMax - randomPayloadMin) : payloadLength, 
  units: 'sentences' 
})
const getDelay = () => delayMin + Math.random() * (delayMax - delayMin)

const scheduleSending = () => {
  setTimeout(sendMessage, getDelay())
}

const sendMessage = () => {
  if (registeredClients.length > 0) {
    const messageTitle = `Message #${++messageIdx}` 
    const messageBody = getPayload()

    registeredClients.forEach(token => {
      var message = {
        'notification': {
          'title': messageTitle,
          'body': `${messageBody}` // `sent to ${token}`,
        },
        'data': {
          'time': new Date().toISOString()// at date...
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

    if (sendingMessages && ++sentCount < toBeSentCount) {
      scheduleSending()
    } else {
      sendingMessages = false
      sendStop()
    }
  }
}

const sendStop = () => {
  console.log("sent stop signal")

  registeredClients.forEach(token => {
    const message = {
      'notification': { 'body': 'stopping' },
      'data': { 'signal': 'STOP' }, 
      'token': token
    }

    fcm
      .messaging()
      .send(message)
  })
}

app.get("/", (req, res) => {
  res.send("hello")
})

app.post("/start", async (req, res) => {
  const { length, amount, unique = true, random = false, delay: { min: _delayMin, max: _delayMax } } = req.body

  if (!sendingMessages && length && amount)  {
    console.log("starting sending")
    sentCount = 0
    toBeSentCount = amount
    payloadLength = length
    sendingMessages = true
    randomPayload = random
    delayMin = Math.max(_delayMin, 1)
    delayMax = _delayMax
    payload = (unique || random) ? '' : loremIpsum({ count: payloadLength, units: 'sentences' })

    scheduleSending()

    res.sendStatus(200)
  } else {
    res.sendStatus(500)
  }
})

app.post("/stop", async (req, res) => {
  if (!sendingMessages) res.sendStatus(500)

  sendingMessages = false

  res.sendStatus(200)
})

app.post("/register", (req, res) => {
  const { token } = req.body

  if (token) {
    if (!registeredClients.includes(token)) {
      registeredClients.push(token)
      console.log("Registered new client: ", token)
    }      
    
    res.sendStatus(200)
  } else {
    res.sendStatus(500)
  } 
})

app.post("/unregister", (req, res) => {
  const { token } = req.body

  if (token && registeredClients.includes(token)) {
    registeredClients = registeredClients.filter(t => t !== token)
    console.log("Unregistered client: ", token)

    res.sendStatus(200)
  } else {
    res.sendStatus(500)
  }
})

var server = app.listen(8082, () => {
  var host = server.address().address
  var port = server.address().port
  console.log(`Listening at port ${port}`)
})



