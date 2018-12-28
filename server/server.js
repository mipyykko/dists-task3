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
var registeredClients = []

const payloadModes = {
  MIN: 'MIN',
  MAX: 'MAX',
  AVG: 'AVG',
  RANDOM: 'RANDOM'
}

const payloads = {
  MIN: 'Lorem ipsum dolor sit amet.',
  AVG: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu consectetur dui, a condimentum nisl. Morbi volutpat tempor erat eu finibus. Morbi aliquam massa eu tellus iaculis, nec mollis est posuere. Integer feugiat velit sed metus cursus euismod. Ut nec magna ipsum. Nulla sem dolor, varius vitae congue sed, rhoncus.',
  MAX: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In id mi non lorem tempor eleifend. Fusce vel lobortis eros. Nunc et ex mauris. Quisque pharetra nunc ut faucibus elementum. Sed vel lorem non odio euismod pulvinar. Ut sodales augue tortor, ut hendrerit erat ultrices sed. Morbi quis blandit lectus. Praesent aliquet augue vitae ligula ultricies laoreet ac sit amet dolor. Maecenas in dignissim neque. Quisque tincidunt dui vitae ipsum ullamcorper ultrices fermentum a tellus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam fermentum massa in risus lobortis egestas. Donec nec dictum purus. Pellentesque arcu mi, imperdiet vel urna at, faucibus viverra ipsum. Sed aliquam risus tellus, quis aliquet enim rhoncus id. Donec sodales aliquam urna. Nullam tempor gravida sapien non auctor. Curabitur sed lacus ultrices, sodales ex nec, venenatis massa. Proin et laoreet orci, ut finibus erat. Nam ante leo, vehicula ac felis sed, venenatis blandit metus. Praesent at risus sed ex aliquet feugiat. Suspendisse vitae est quis lacus fermentum hendrerit non quis risus. Cras imperdiet eros in mattis efficitur. Maecenas luctus magna ut dictum finibus. Maecenas aliquet ante eget erat faucibus, sit amet pharetra dolor consequat. In quis sapien sed justo venenatis rutrum. Fusce lorem nunc, rhoncus ut massa sed, accumsan consectetur lectus. In ullamcorper tristique justo in cursus. Nam sed purus orci. Nullam vitae imperdiet ipsum. Suspendisse vulputate nibh et ligula consequat, non ullamcorper mi accumsan. Vivamus nec molestie justo, quis scelerisque justo. Duis eu facilisis nunc. Vivamus molestie purus eu metus bibendum molestie. Integer tempor mi ac ligula viverra, ut aliquet urna tempor. Vestibulum porttitor diam turpis, vitae auctor leo tincidunt id. Suspendisse a lacus lorem. Aliquam nec tellus id eros maximus tincidunt. Nam vitae odio fermentum, feugiat velit ut, facilisis tellus. Sed tincidunt malesuada metus vitae cursus. Donec viverra porta justo, id eleifend enim laoreet ut. Nulla vitae sapien elit. Aliquam ex magna, fermentum vitae eleifend a, ultricies sed elit. Nulla interdum quam id libero vulputate ornare vitae tempus risus. Nunc ut ultricies dolor. Quisque commodo ex a bibendum sagittis. Vestibulum eget lacinia tortor, porta bibendum mi. Donec in dui consequat lectus consequat varius vel et nibh. Proin varius nec elit eu tincidunt. Integer quam odio, porta sit amet pharetra vitae, viverra placerat nibh. Nullam ac mi tempus, elementum nulla sit amet, efficitur risus. Nam eleifend a leo eget bibendum. Vestibulum maximus justo ac dolor sagittis egestas. Donec quis semper magna. Nulla suscipit enim sodales nunc tempus, tincidunt congue urna euismod. Ut lacinia gravida lorem at varius. Maecenas et lacus posuere, sollicitudin erat eget, scelerisque dolor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras finibus fermentum molestie. Suspendisse rutrum, leo eu gravida venenatis, mi mauris varius erat, eu varius enim justo eget nisl. Vestibulum imperdiet mollis pellentesque. Vivamus et porta dolor. Sed massa metus, faucibus a consequat vel, efficitur nec tortor. Etiam et lectus consequat, rhoncus massa vel, fermentum nisl. Curabitur laoreet pulvinar vulputate. Phasellus non est sapien. Nulla egestas dui eget sapien ullamcorper sagittis. Nam vitae nunc tristique.' 
}

var payloadMode = payloadModes.RANDOM

const getPayload = () => {
  switch (payloadMode) {
    case payloadModes.MIN:
    case payloadModes.MAX:
    case payloadModes.AVG:
      return payloads[payloadMode]
    case payloadModes.RANDOM:
      return payloads[Object.keys(payloads)[Math.floor(Math.random() * Object.keys(payloads).length)]]
    default:
      return 'unknown payload mode'
  }
}

const sendMessage = () => {
  if (registeredClients.length > 0) {
    const messageTitle = `Message #${++messageIdx}` 
    const messageBody = getPayload()

    registeredClients.forEach(token => {
      var message = {
        'notification': {
          'title': messageTitle,
          'body': `${messageBody} sent to ${token}`,
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
  }

  if (sendingMessages) {
    setTimeout(sendMessage, 1000 + Math.random() * 500)
  }
}

app.get("/", (req, res) => {
  res.send("hello")
})

app.post("/payload", (req, res) => {
  const { mode } = req.body

  if (mode && payloadModes[mode]) {
    payloadMode = payloadModes[mode]
    console.log('Payload mode changed to', mode)
    
    res.sendStatus(200)
  } else {
    res.sendStatus(500)
  }
})

app.post("/register", (req, res) => {
  const { token } = req.body

  if (token) {
    if (!registeredClients.includes(token)) {
      registeredClients.push(token)
      console.log("Registered new client: ", token)
      
      res.sendStatus(200)
    }     
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

  setTimeout(sendMessage, 1000 + Math.random() * 500)
})



