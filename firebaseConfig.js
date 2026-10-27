import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyC6e92iguyRak6RVOb9cz5WllNJX4oOMs8',
  authDomain: 'terrathon-finsync.firebaseapp.com',
  databaseURL: 'https://terrathon-finsync-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'terrathon-finsync',
  storageBucket: 'terrathon-finsync.firebasestorage.app',
  messagingSenderId: '181792930095',
  appId: '1:181792930095:web:8643def5a8eb92b49049da',
};

const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getDatabase(firebaseApp);
