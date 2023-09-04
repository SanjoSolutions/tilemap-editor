import { getAuth, signOut } from "firebase/auth"
import { initializeFirebaseApp } from "../firebaseApp.js"

const $logOutButton = document.querySelector(
  "#logOutButton",
) as HTMLButtonElement

$logOutButton.addEventListener("click", async () => {
  initializeFirebaseApp()
  await signOut(getAuth())
})
