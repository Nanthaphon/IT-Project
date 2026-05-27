import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAyOWP7fsCUYh2cevBPBpehP85p7tuy-hM",
  authDomain: "it-asset-management-dc883.firebaseapp.com",
  projectId: "it-asset-management-dc883",
  storageBucket: "it-asset-management-dc883.firebasestorage.app",
  messagingSenderId: "897937967642",
  appId: "1:897937967642:web:9b0ccc5ca28a8c57f55fa3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
