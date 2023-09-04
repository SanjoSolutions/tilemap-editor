import { initializeApp } from "firebase/app"
import { memoize } from "lodash-es"
export const retrieveFirebaseApp = memoize(function retrieveFirebaseApp() {
  const firebaseConfig = {
    apiKey: "AIzaSyBa97VwnafLoT8d2xlL5yFjrKaqFJoo4d8",
    authDomain: "tilemap-editor.firebaseapp.com",
    projectId: "tilemap-editor",
    storageBucket: "tilemap-editor.appspot.com",
    messagingSenderId: "978127662931",
    appId: "1:978127662931:web:91842eb00c49bf9c09fba6",
  }

  const firebaseApp = initializeApp(firebaseConfig)

  return firebaseApp
})

export function initializeFirebaseApp() {
  retrieveFirebaseApp()
}
