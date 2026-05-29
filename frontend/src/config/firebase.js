// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB-QibNeyXJvhp195ELaPDxuU1yCO-alT4",
  authDomain: "agrosmart-tech-mlops.firebaseapp.com",
  projectId: "agrosmart-tech-mlops",
  storageBucket: "agrosmart-tech-mlops.appspot.com",
  messagingSenderId: "940420015515",
  appId: "1:940420015515:web:69075db5497734ef32ed3e"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar la "llave" de autenticación para que React la use
export const auth = getAuth(app);