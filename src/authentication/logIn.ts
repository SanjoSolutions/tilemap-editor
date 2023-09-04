import * as bootstrap from "bootstrap"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { initializeFirebaseApp } from "../firebaseApp.js"

const $logInModal = document.querySelector("#logInModal") as HTMLDivElement
const logInModal = bootstrap.Modal.getOrCreateInstance($logInModal)

$logInModal.addEventListener("shown.bs.modal", () => {
  ;($logInModal.querySelector("#logInEmail") as HTMLInputElement).focus()
})

const $logInForm = $logInModal.querySelector("#logInForm") as HTMLFormElement
$logInForm.addEventListener("submit", async (event) => {
  event.preventDefault()

  const formData = new FormData($logInForm)

  initializeFirebaseApp()
  const auth = getAuth()
  await signInWithEmailAndPassword(
    auth,
    formData.get("email") as string,
    formData.get("password") as string,
  )
  logInModal.hide()
})
