## Cloud messaging client

In order to get the client to work, get your web app config from Firebase console. We only need the `messagingSenderId`.

Create `src/config/firebase.js` with following content: 
```import * from 'firebase'

const config = {
  messagingSenderId: <YOUR OWN MESSAGINGSENDERID>
}

export default firebase.initializeApp(config)
```

and `public/firebase-messaging-sw.js` with following: 
```
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-messaging.js');

firebase.initializeApp({
    messagingSenderId: <YOUR OWN MESSAGINGSENDERID>
});

const messaging = firebase.messaging();
```
(Yes, I know this is lazy, but with `create-react-app` and service workers and whatnot...)

After this slight tampering, the client should work with `yarn` and `yarn start`. It'll launch itself to the nearest browser.

