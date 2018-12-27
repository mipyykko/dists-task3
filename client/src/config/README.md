In this directory, add a file called `firebase.js` containing your Firebase web app config available from Firebase console, like this:

`
import * from 'firebase'

const config = {
  apiKey: 'asdf',
  authDomain: 'asdf',
  databaseURL: 'asdf.com',
  projectId: 'asdf',
  storageBucket: 'asdf',
  messagingSenderId: 'asdf'
}

export default firebase.initializeApp(config)`
