import { getAuth, onAuthStateChanged } from "firebase/auth"
import { initializeFirebaseApp } from "../firebaseApp.js"

const $collaborateButton = document.querySelector(
  "#collaborateButton",
) as HTMLButtonElement
const $logInButton = document.querySelector("#logInButton") as HTMLButtonElement
const $logOutButton = document.querySelector(
  "#logOutButton",
) as HTMLButtonElement
const $registerButton = document.querySelector(
  "#registerButton",
) as HTMLButtonElement

const elementsToShowWhenLoggedIn = new Set([$collaborateButton, $logOutButton])

const elementsToShowWhenLoggedOut = new Set([$logInButton, $registerButton])

initializeFirebaseApp()
const auth = getAuth()
onAuthStateChanged(auth, (user) => {
  if (user) {
    for (const element of elementsToShowWhenLoggedIn) {
      element.classList.remove("d-none")
    }
    for (const element of elementsToShowWhenLoggedOut) {
      element.classList.add("d-none")
    }
  } else {
    for (const element of elementsToShowWhenLoggedIn) {
      element.classList.add("d-none")
    }
    for (const element of elementsToShowWhenLoggedOut) {
      element.classList.remove("d-none")
    }
  }
})
