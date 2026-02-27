import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const router = useRouter();

  const handleAuth = async () => {
    console.log("Attempting to authenticate...");
    console.log("Mode:", isLoginMode ? "Login" : "Sign Up");
    console.log("Email typed:", email);
    
    try {
      if (isLoginMode) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Success! Logged in as:", userCredential.user.email);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Success! Account created for:", userCredential.user.email);
      }
      // Send them to the main camera page
      router.replace('/'); 
    } catch (error) {
      // This will print the exact reason to your VS Code terminal!
      console.error("FIREBASE ERROR:", error.code, error.message);
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>WildLens</Text>
      
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

      <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)}>
        <Text style={styles.switchText}>
          {isLoginMode ? "Need an account? Sign up" : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', padding: 20 },
  headerTitle: { color: 'white', fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#2c3e50', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#27ae60', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  switchText: { color: '#27ae60', textAlign: 'center', marginTop: 20, fontSize: 14 }
});