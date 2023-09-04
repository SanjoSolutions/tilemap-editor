import { getAuth, onAuthStateChanged } from "firebase/auth"
import { initializeFirebaseApp } from "../firebaseApp.js"

const $logInButton = document.querySelector("#logInButton") as HTMLButtonElement
const $logOutButton = document.querySelector(
  "#logOutButton",
) as HTMLButtonElement
const $registerButton = document.querySelector(
  "#registerButton",
) as HTMLButtonElement

initializeFirebaseApp()
const auth = getAuth()
onAuthStateChanged(auth, (user) => {
  if (user) {
    $logInButton.classList.add("d-none")
    $registerButton.classList.add("d-none")
    $logOutButton.classList.remove("d-none")
  } else {
    $logOutButton.classList.add("d-none")
    $logInButton.classList.remove("d-none")
    $registerButton.classList.remove("d-none")
  }
})
