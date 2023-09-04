import * as bootstrap from "bootstrap"
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth"
import { initializeFirebaseApp } from "../firebaseApp.js"

const $registerModal = document.querySelector(
  "#registerModal",
) as HTMLDivElement
const registerModal = bootstrap.Modal.getOrCreateInstance($registerModal)

$registerModal.addEventListener("shown.bs.modal", () => {
  ;($registerModal.querySelector("#registerEmail") as HTMLInputElement).focus()
})

const $registerForm = $registerModal.querySelector(
  "#registerForm",
) as HTMLFormElement
$registerForm.addEventListener("submit", async (event) => {
  event.preventDefault()

  const formData = new FormData($registerForm)

  initializeFirebaseApp()
  const auth = getAuth()
  await createUserWithEmailAndPassword(
    auth,
    formData.get("email") as string,
    formData.get("password") as string,
  )
  registerModal.hide()
})
