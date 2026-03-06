import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBf4SDW39FPb2bvPQKF9GBIZCSttN-DZ3E",
  authDomain: "campus-errand-ad661.firebaseapp.com",
  databaseURL: "https://campus-errand-ad661-default-rtdb.firebaseio.com",
  projectId: "campus-errand-ad661",
  storageBucket: "campus-errand-ad661.firebasestorage.app",
  messagingSenderId: "73823260511",
  appId: "1:73823260511:web:c6f1ccc1b65f6457f470ea",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
export default app;
