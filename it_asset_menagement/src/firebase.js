import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCK7RPnZE8V-W_gDbWvxK8W40oJKA-8W5I",
  authDomain: "it-asset-management-75aa8.firebaseapp.com",
  projectId: "it-asset-management-75aa8",
  storageBucket: "it-asset-management-75aa8.firebasestorage.app",
  messagingSenderId: "1067954410010",
  appId: "1:1067954410010:web:1ff6062e31844027f537a3"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
