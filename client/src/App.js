import React, { Component } from 'react';
import firebase from './config/firebase'
import './App.css';

import { 
  Button, 
  Card, CardContent, 
  Paper,
  Radio, RadioGroup, 
  Typography, 
  Grid
} from '@material-ui/core'

const messaging = firebase.messaging()
const API_URL = 'http://localhost:8082'

const states = {
  OK: 'OK',
  ERROR: 'ERROR',
  REGISTERING: 'REGISTERING',
  UNREGISTERING: 'UNREGISTERING',
  CHANGING_MODE: 'CHANGING_MODE'
}

const modes = {
  MIN: 'MIN',
  AVG: 'AVG',
  MAX: 'MAX',
  RANDOM: 'RANDOM'
}

class App extends Component {
  constructor() {
    super()

    this.state = {
      token: null,
      state: states.OK,
      mode: modes.RANDOM,
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

  apiPost = (endpoint, data) => {
    return fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
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
    this.setState({
      ...this.state,
      messages: this.state.messages.concat(this.newMessage(msg))
    })
  }

  handleTokenClick = () => {
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
  }

  handleRegisterClick = () => {
    this.setState({ ...this.state, state: states.REGISTERING, error: null })

    this.apiPost('register', { token: this.state.token })
      .then(res => {
        console.log(res)
        this.setState({ ...this.state, registered: true, state: states.OK })
      })
      .catch(err => {
        this.setState({ ...this.state, state: states.ERROR, error: "There was a problem registering." })
        console.log(err)
      })
  }

  handleUnregisterClick = () => {
    this.setState({ ...this.state, state: states.UNREGISTERING, error: null })

    this.apiPost('unregister', { token: this.state.token })
      .then(res => {
        console.log(res)
        this.setState({ ...this.state, token: null, registered: false, state: states.OK })
      })
      .catch(err => {
        console.log(err)
        this.setState({ ...this.state, state: states.ERROR, error: "There was a problem unregistering." })
      })
  }

  handleModeChange = (event, value) => {
    this.setState({ ...this.state, state: states.CHANGING_MODE, error: null })

    this.apiPost('payload', { mode: value })
      .then(res => {
        console.log(res)
        this.setState({ ...this.state, mode: value, state: states.OK })
      })
      .catch(err => {
        console.log(err)
        this.setState({ ...this.state, error: "There was a problem changing the mode.", state: states.ERROR })
      })
  }

  handleReset = () => {
    this.setState({ ...this.state, messages: [] })
  }

  renderModes = () => (
    <div>
      <RadioGroup 
        name="mode" 
        defaultSelected={this.state.mode}
        onChange={this.handleModeChange}
        disabled={this.state === states.CHANGING_MODE}
      >
        {Object.keys(modes).map(mode => (
          <Radio
            value={mode}
            label={mode}
            key={mode}
          />
        ))}
      </RadioGroup>
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
                <Button variant="raised" onClick={this.handleTokenClick}>Get token</Button>
              </div>
            }
          </Grid>
          {this.state.token && !this.state.registered ?
            <div>
              <p>Click to register your client at the server.</p>
              <Button variant="raised" disabled={this.state.state === states.REGISTERING} onClick={this.handleRegisterClick}>Register</Button>
            </div>
          : this.state.registered 
            ? <div>
                <p>Registered to server. Click to unregister.</p>
                <Button variant="raised" disabled={this.state.state === states.UNREGISTERING} onClick={this.handleUnregisterClick}>Unregister</Button>
              </div> 
            : null
          }
          {this.state.error ? <Typography color="error">{this.state.error}</Typography> : null}
          {this.state.registered && this.renderModes()}
          <p>{this.state.messages.length} message{this.state.messages.length === 1 ? '' : 's'} received, average time {this.averageTime()} ms</p>
          <Paper style={{maxHeight: 600, overflow: 'auto' }}>
            {this.state.messages.map(msg => this.renderMessage(msg))}
          </Paper>
        </Grid>
      </div>
    )
  }
}

export default App;
