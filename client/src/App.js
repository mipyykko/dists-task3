import React, { Component } from 'react';
import firebase from './config/firebase'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import './App.css';

import { RaisedButton, Card, CardHeader, CardText, Paper } from 'material-ui'

const messaging = firebase.messaging()
const API_URL = 'http://localhost:8082/register'

class App extends Component {
  constructor() {
    super()

    this.state = {
      token: null,
      registered: false,
      registering: false,
      messages: []
    }
  }

  newMessage = (msg) => (
    {
      title: msg.notification.title,
      body: msg.notification.body,
      time: new Date().toISOString()
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
    this.setState({ ...this.state, registering: true })

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: this.state.token })
    })
    .then(res => {
      console.log(res)
      this.setState({ ...this.state, registered: true, registering: false })
    })
    .catch(err => {
      this.setState({ ...this.state, registering: false })
      console.log(err)
    })
  }

  renderMessage = (msg) => {
    return (
      <Card key={msg.title}>
        <CardHeader
          title={msg.title}
          subtitle={msg.time}
        />
        <CardText>
          {msg.body}
        </CardText>
      </Card>
    )
  }

  render() {
    return (
      <MuiThemeProvider>
        <div>
          <h2>Push notification demo</h2>
          {this.state.token ? 
            <p>Currently using token {this.state.token}</p>
          : <p>Click on the button below to get a token. Remember to allow notifications!</p>
          }
          <RaisedButton label="Get token" onClick={this.handleTokenClick} />
          {this.state.token && !this.state.registered ?
            <RaisedButton label="Register to server" disabled={this.state.registering} onClick={this.handleRegisterClick} />
          : this.state.registered ? <p>Registered to server</p> : null}
          <Paper style={{maxHeight: 600, overflow: 'auto' }}>
            <p>{this.state.messages.length} message{this.state.messages.length === 1 ? '' : 's'} received</p>
            {this.state.messages.map(msg => this.renderMessage(msg))}
          </Paper>
        </div>
      </MuiThemeProvider>
    )
  }
}

export default App;
