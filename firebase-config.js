// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBM2ElQfZYO5aV4Iyki3f0MbMa-N9hlGCw",
  authDomain: "ecohunter-hackathon.firebaseapp.com",
  projectId: "ecohunter-hackathon",
  storageBucket: "ecohunter-hackathon.firebasestorage.app",
  messagingSenderId: "362823447728",
  appId: "1:362823447728:web:bbfa91edacc46943807775",
  measurementId: "G-WCHR918YBB"
};

// 3. Initialize the app
const app = initializeApp(firebaseConfig);

// 4. Initialize Firestore and EXPORT it so index.jsx can see it
export const db = getFirestore(app);