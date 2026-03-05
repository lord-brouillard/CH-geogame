// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCj8F4ABo02jZDbE0VmOr62RgmRhYTi1XE",
  authDomain: "ch-geogame.firebaseapp.com",
  projectId: "ch-geogame",
  storageBucket: "ch-geogame.firebasestorage.app",
  messagingSenderId: "173593614352",
  appId: "1:173593614352:web:7e4109bab775d6d7f31295",
  measurementId: "G-5H85P1P18F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);