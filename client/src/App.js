import React, { Component } from 'react';
import firebase from './config/firebase'
import './App.css';
import 'react-input-range/lib/css/index.css'

import {
  CssBaseline,
  Button, 
  Card, CardContent, 
  Paper,
  Typography, 
  Grid,
  TextField, Checkbox,
  FormGroup, FormControlLabel
} from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import InputRange from 'react-input-range'

const messaging = firebase.messaging()
const API_URL = 'http://localhost:8082'

const states = {
  ERROR: 'ERROR',
  REGISTERING: 'REGISTERING',
  UNREGISTERING: 'UNREGISTERING',
  STARTING: 'STARTING',
  STOPPING: 'STOPPING',
  OK: 'OK'
}

const styles = theme => ({ 
  root: { 
    flexGrow: 1,
    padding: 10
  },
  grid: { 
    "margin-bottom": "4px"
  }
})

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      token: null,
      state: states.OK,
      receiving: false,
      payloadLength: 5,
      messageAmount: 50,
      delay: { min: 100, max: 150 },
      uniquePayloads: true,
      randomPayload: false,
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

  arrivalRate = () => {
    const len = this.state.messages.length

    if (len === 0) { return 0 }

    return (this.state.messages
      .reduce(
        (acc, curr, idx, src) => (
          idx > 0 ? acc + (new Date(src[idx].receivedTime) - new Date(src[idx - 1].receivedTime)) : 0
        ), 0
      ) / len).toFixed(2)
  }

  newMessage = (msg) => {
    const receivedTime = new Date()

    return {
      title: msg.notification.title,
      body: msg.notification.body,
      sentTime: msg.data.time,
      receivedTime: receivedTime.toISOString(),
      elapsedTime: (receivedTime - new Date(msg.data.time)).toFixed(2)
    }
  }

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
        this.setState({ ...this.state, ...okValues, state: okState })
      })
      .catch(err => {
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
          okValues: btn === 'register' ? { registered: true } : { registered: false, token: null },
          errorValues: { error: `Problem with ${btn}ing!` }
        }
        this.handlePost(options)

        break
      case 'start':
        options = {
          endpoint: 'start',
          data: { 
            amount: this.state.messageAmount, 
            length: this.state.payloadLength, 
            unique: this.state.uniquePayloads,
            random: this.state.randomPayload,
            delay: this.state.delay
          },
          enterState: states.STARTING, 
          okValues: { receiving: true, messages: [] },
          errorValues: { receiving: false }
        }
        this.handlePost(options)

        break
      case 'stop':
        options = { 
          endpoint: 'stop',
          okValues: { receiving: false },
          errorValues: { receiving: false }
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
    <FormGroup row>
      <Grid container spacing={24}>
        <Grid item xs={3}>
          <TextField
            id="length"
            label="Payload length"
            value={this.state.payloadLength}
            disabled={this.state.randomPayload}
            type="number"
            onChange={this.handleChange('payloadLength')}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            id="count"
            label="Message amount"
            value={this.state.messageAmount}
            type="number"
            onChange={this.handleChange('messageAmount')}
          />
        </Grid>
        <Grid item xs={3}>
          <FormControlLabel
            control={
              <Checkbox
                id="random"
                checked={this.state.randomPayload}
                onChange={this.handleCheckbox('randomPayload')}
              />
            }
            label="Random payload size"
          />
          <FormControlLabel
            control={
              <Checkbox
                id="unique"
                checked={this.state.uniquePayloads}
                onChange={this.handleCheckbox('uniquePayloads')}
              />
            }
            label="Unique payloads"
          />
        </Grid>
        <Grid item xs={3}>
          {this.state.registered ? 
            !this.state.receiving ?
              <Button variant="contained" disabled={this.state.state === states.STARTING} onClick={this.handleClick('start')}>Start</Button> : 
              <Button variant="contained" disabled={this.state.state === states.STARTING} onClick={this.handleClick('stop')}>Stop</Button> : 
                null}
        </Grid>
      </Grid>  
      <Grid container spacing={24}>
        <Grid item xs={6}>
          <InputRange
            maxValue={1000}
            minValue={0}
            step={5}
            value={this.state.delay}
            onChange={delay => this.setState({ delay })}
          />
        </Grid>            
      </Grid>
    </FormGroup>
  )

  renderMessage = (msg) => (
    <Card key={`${msg.sentTime}${msg.receivedTime}`}>
      <CardContent>
        <Typography variant="h5" component="h2">{msg.title}</Typography>
        <Typography color="textSecondary">Sent: {msg.sentTime}, received: {msg.receivedTime}, elapsed: {msg.elapsedTime}</Typography>
        <Typography component="p">{msg.body}</Typography>
      </CardContent>
    </Card>
  )

  render() {
    const { classes } = this.props
    return (
      <div style={{ margin: 10 }}>
        <CssBaseline />
        <h2>Push notification demo</h2>
            {this.state.token ? 
              <Grid container spacing={24}>
                <Grid item xs>
                  <Typography variant="h5" component="h5">Token</Typography>
                  <Typography color="textSecondary">{this.state.token}</Typography>
                </Grid>
              </Grid>
            : <Grid container spacing={24}>
                <Grid item xs={9}>
                  Click on the button to get a token. Remember to allow notifications!
                </Grid>
                <Grid item xs={3}>
                  <Button variant="contained" onClick={this.handleClick('token')}>Get token</Button>
                </Grid>
              </Grid>
            }
        {this.state.token && !this.state.registered ?
          <Grid container spacing={24}>
            <Grid item xs={9}>
              Click to register your client at the server.
            </Grid>
            <Grid item xs={3}>
              <Button variant="contained" disabled={this.state.state === states.REGISTERING} onClick={this.handleClick('register')}>Register</Button>
            </Grid>
          </Grid>
        : this.state.registered 
          ? <Grid container className={classes.grid} spacing={24}>
              <Grid item xs={9}>
                Registered to server. Click to unregister.
              </Grid>
              <Grid item xs={3}>
                <Button variant="contained" disabled={this.state.state === states.UNREGISTERING} onClick={this.handleClick('unregister')}>Unregister</Button>
              </Grid>
            </Grid> 
          : null
        }
          {this.state.error ? 
            <Grid container spacing={24}>
              <Typography color="error">{this.state.error}</Typography>
            </Grid> : null}
          {this.state.registered && this.renderForm()}
          <p>{this.state.messages.length} message{this.state.messages.length === 1 ? '' : 's'} received, average time {this.averageTime()} ms, average arrival rate {this.arrivalRate()} ms</p>
          <Paper style={{maxHeight: 600, overflow: 'auto' }}>
            {this.state.messages.slice(-10).map(msg => this.renderMessage(msg))}
          </Paper>
      </div>
    )
  }
}

export default withStyles(styles)(App);
