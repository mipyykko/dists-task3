import React, { Component } from 'react';
import firebase from './config/firebase'
import './App.css';

import { 
  Button, 
  Card, CardContent, 
  Paper,
  Typography, 
  Grid,
  TextField, Checkbox
} from '@material-ui/core'

const messaging = firebase.messaging()
const API_URL = 'http://localhost:8082'

const states = {
  ERROR: 'ERROR',
  REGISTERING: 'REGISTERING',
  UNREGISTERING: 'UNREGISTERING',
  STARTING: 'STARTING',
  STOPPING: 'STOPPING'
}

class App extends Component {
  constructor() {
    super()

    this.state = {
      token: null,
      state: states.OK,
      receiving: false,
      payloadLength: 5,
      messageAmount: 50,
      uniquePayloads: true,
      error: null,
      messages: []
    }
  }

  averageTime = () => {
    if (this.state.messages.length === 0) { return 0 }

    return (this.state.messages
      .reduce(
        (acc, curr) => (acc + (new Date(curr.receivedTime) - new Date(curr.sentTime))), 0
      ) / this.state.messages.length).toFixed(2)
  }

  newMessage = (msg) => (
    {
      title: msg.notification.title,
      body: msg.notification.body,
      sentTime: msg.data.time,
      receivedTime: new Date().toISOString()
    }
  )

  handleMessage = (msg) => {
    const { signal } = msg.data

    if (signal) {
      switch (signal) {
        case 'STOP':
          this.setState({ ...this.state, receiving: false })
          break
        default:
      }

      return
    } 
    
    this.setState({
      ...this.state,
      messages: this.state.messages.concat(this.newMessage(msg)),
    })
  }

  handlePost = (options) => {
    const {
      endpoint,
      data,
      enterState,
      okValues = {},
      errorValues = {},
      okState = states.OK,
      errorState = states.ERROR
    } = options

    this.setState({ ...this.state, state: enterState, error: null })

    fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(res => {
        console.log(res)
        this.setState({ ...this.state, ...okValues, state: okState })
      })
      .catch(err => {
        console.log(err)
        this.setState({ ...this.state, ...errorValues, state: errorState })
      })
  }

  handleClick = (btn) => () => {
    var options = {}

    switch (btn) {
      case 'register':
      case 'unregister':
        options = {
          endpoint: btn,
          data: { token: this.state.token }, 
          enterState: btn === 'register' ? states.REGISTERING : states.UNREGISTERING,
          okValues: btn === 'register' ? { registered: true } : { registered: false, token: null }
        }
        this.handlePost(options)

        break
      case 'start':
        options = {
          endpoint: 'start',
          data: { 
            amount: this.state.messageAmount, 
            length: this.state.payloadLength, 
            unique: this.state.uniquePayloads
          },
          enterState: states.STARTING, 
          okValues: { receiving: true, messages: [] },
          errorValues: { receiving: false }
        }
        this.handlePost(options)

        break
      case 'token':
        messaging.onMessage(this.handleMessage)
        messaging
          .requestPermission()
          .then(() => messaging.getToken())
          .then(token => {
            if (token) {
              this.setState({ ...this.state, token })
            } else {
              console.log("error retrieving token")
            }
          })
          .catch(err => console.log(err))
        break
      default:
    }
  }

  handleReset = () => {
    this.setState({ ...this.state, messages: [] })
  }

  handleChange = (field) => (event) => {
    this.setState({ ...this.state, [field]: event.target.value })
  }

  handleCheckbox = (field) => (event) => {
    this.setState({ ...this.state, [field]: event.target.checked })
  }

  renderForm = () => (
    <div>
      <form noValidate autoComplete='off'>
        <TextField
          id="length"
          label="Payload length"
          value={this.state.payloadLength}
          type="number"
          onChange={this.handleChange('payloadLength')}
        />
        <TextField
          id="count"
          label="Message amount"
          value={this.state.messageAmount}
          type="number"
          onChange={this.handleChange('messageAmount')}
        />
        <Checkbox
          id="unique"
          label="Unique payloads"
          checked={this.state.uniquePayloads}
          onChange={this.handleCheckbox('uniquePayloads')}
        />
      </form>
    </div>  
  )

  renderMessage = (msg) => (
    <Card key={`${msg.sentTime}${msg.receivedTime}`}>
      <CardContent>
        <Typography variant="h5" component="h2">{msg.title}</Typography>
        <Typography color="textSecondary">Sent: {msg.sentTime}, received: {msg.receivedTime}</Typography>
        <Typography component="p">{msg.body}</Typography>
      </CardContent>
    </Card>
  )

  render() {
    return (
      <div>
        <h2>Push notification demo</h2>
        <Grid container>
          <Grid item xs={12}>
            {this.state.token ? 
              <p>Currently using token {this.state.token}</p>
            : <div>
                <p>Click on the button below to get a token. Remember to allow notifications!</p>
                <Button variant="raised" onClick={this.handleClick('token')}>Get token</Button>
              </div>
            }
          </Grid>
          {this.state.token && !this.state.registered ?
            <div>
              <p>Click to register your client at the server.</p>
              <Button variant="raised" disabled={this.state.state === states.REGISTERING} onClick={this.handleClick('register')}>Register</Button>
            </div>
          : this.state.registered 
            ? <div>
                <p>Registered to server. Click to unregister.</p>
                <Button variant="raised" disabled={this.state.state === states.UNREGISTERING} onClick={this.handleClick('unregister')}>Unregister</Button>
              </div> 
            : null
          }
          {this.state.error ? <Typography color="error">{this.state.error}</Typography> : null}
          {this.state.registered && this.renderForm()}
          {!this.state.receiving && this.state.registered ? <Button variant="raised" disabled={this.state.state === states.STARTING} onClick={this.handleClick('start')}>Start</Button> : null}
          <p>{this.state.messages.length} message{this.state.messages.length === 1 ? '' : 's'} received, average time {this.averageTime()} ms</p>
          <Paper style={{maxHeight: 600, overflow: 'auto' }}>
            {this.state.messages.slice(-10).map(msg => this.renderMessage(msg))}
          </Paper>
        </Grid>
      </div>
    )
  }
}

export default App;
