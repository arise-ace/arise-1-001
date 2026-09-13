import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ---------------------------------------------------------------
// REPLACE THIS with YOUR OWN Firebase project config.
// Get it from: Firebase Console -> Project Settings -> General
// -> "Your apps" -> Web app -> SDK setup and configuration
// ---------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAtrf5dHePEBoavw11in5aXyH_nbkGJVGE",
  authDomain: "arise-1-9ec03.firebaseapp.com",
  projectId: "arise-1-9ec03",
  storageBucket: "arise-1-9ec03.firebasestorage.app",
  messagingSenderId: "180493165863",
  appId: "1:180493165863:web:865805815ac420df20b502",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
