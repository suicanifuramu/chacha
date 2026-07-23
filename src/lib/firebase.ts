import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyB32T2cjUOQXd0TMExHiIxAOWtSrmSI7g0",
  authDomain: "auth.anirole.com",
  projectId: "charismatic-amp-400411",
  storageBucket: "charismatic-amp-400411.appspot.com",
  messagingSenderId: "419919135595",
  appId: "1:419919135595:web:7de89091d0bcdc265b022e",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: "select_account" })
