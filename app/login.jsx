import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'; // 1. Added updateProfile
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebase-config';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // 2. New Username State
  const [isLoginMode, setIsLoginMode] = useState(true);
  const router = useRouter();

  const handleAuth = async () => {
    try {
      if (isLoginMode) {
        // --- LOGIN MODE ---
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Success! Logged in.");
      } else {
        // --- SIGN UP MODE ---
        if (!username.trim()) {
          alert("Please enter a username for the Leaderboard!");
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 3. The Magic Step: Attach the username to their new Firebase Auth profile
        await updateProfile(userCredential.user, {
          displayName: username
        });
        
        console.log("Success! Account created for:", username);
      }
      
      // Send them to the main camera page
      router.replace('/'); 
    } catch (error) {
      console.error("FIREBASE ERROR:", error.code, error.message);
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>EcoHunter 🦖</Text>
      
      {/* 4. CONDITIONAL RENDER: Only show Username input if they are making a NEW account */}
      {!isLoginMode && (
        <TextInput 
          style={styles.input} 
          placeholder="Choose a Username" 
          placeholderTextColor="#bdc3c7"
          value={username} 
          onChangeText={setUsername} 
          autoCapitalize="words" 
        />
      )}

      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        placeholderTextColor="#bdc3c7"
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        placeholderTextColor="#bdc3c7"
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      
      <TouchableOpacity style={styles.button} onPress={handleAuth}>
        <Text style={styles.buttonText}>{isLoginMode ? "Login" : "Create Account"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => {
        setIsLoginMode(!isLoginMode);
        setUsername(''); // Clear the box if they switch modes
      }}>
        <Text style={styles.switchText}>
          {isLoginMode ? "Need an account? Sign up" : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', padding: 20 },
  headerTitle: { color: '#27ae60', fontSize: 40, fontWeight: '900', textAlign: 'center', marginBottom: 40, letterSpacing: 1 },
  input: { backgroundColor: '#2c3e50', color: 'white', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#34495e' },
  button: { backgroundColor: '#27ae60', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 3 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  switchText: { color: '#f1c40f', textAlign: 'center', marginTop: 25, fontSize: 15, fontWeight: 'bold' }
});