import { initializeApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyD2W1GHiner13wuQseT94X1o1GS9F73Xx4",
  authDomain: "promotor-fotos.firebaseapp.com",
  projectId: "promotor-fotos",
  storageBucket: "promotor-fotos.firebasestorage.app",
  messagingSenderId: "820701754599",
  appId: "1:820701754599:web:ef4c08e991d45c1b19de42",
};

export const firebaseApp = initializeApp(firebaseConfig);

export default firebaseApp;
