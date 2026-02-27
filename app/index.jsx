import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react'; // Added useEffect
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebase-config';
import { collection, addDoc, onSnapshot } from 'firebase/firestore'; // Added Firebase imports
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY);

// It is safe to keep constants outside the component
const REGION_ANIMALS = [
  { id: '1', name: 'Plantain Squirrel', category: 'Mammal', imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Plantain_Squirrel_%28Callosciurus_notatus%29.jpg/640px-Plantain_Squirrel_%28Callosciurus_notatus%29.jpg' },
  { id: '2', name: 'Macaque', category: 'Mammal', imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Macaca_fascicularis_-_01.jpg/640px-Macaca_fascicularis_-_01.jpg' },
  { id: '3', name: 'Monitor Lizard', category: 'Reptile', imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Varanus_salvator_-_01.jpg/640px-Varanus_salvator_-_01.jpg' },
  { id: '4', name: 'Kingfisher', category: 'Bird', imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/White-throated_Kingfisher.jpg/640px-White-throated_Kingfisher.jpg' },
];


export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState('camera');
  
  // Fixed: Now references REGION_ANIMALS
  const [database, setDatabase] = useState(REGION_ANIMALS); 
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef(null);

  // Fixed: Moved the listener INSIDE the component
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "capturedAnimals"), (snapshot) => {
      const capturedNames = snapshot.docs.map(doc => doc.data().name.toLowerCase());
      
      setDatabase(REGION_ANIMALS.map(animal => ({
        ...animal,
        isUnlocked: capturedNames.includes(animal.name.toLowerCase())
      })));
    });

    return () => unsubscribe(); 
  }, []);


  // --- GEMINI AI INTEGRATION ---
  const analyzeImageWithGemini = async (base64Image) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are an expert Malaysian wildlife biologist. Analyze this image. 
      Identify the animal. If it matches one of these animals (Plantain Squirrel, Macaque, Monitor Lizard, Kingfisher), use that exact name. 
      Return the result STRICTLY as a JSON object with two keys: 'name' (string) and 'category' (string: Mammal, Reptile, Bird, or Unknown). Do not include markdown formatting.`;

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      };

      // Send the image and prompt to Google's servers
      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      
      // Clean up the text to ensure we only parse valid JSON
      const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString);

    } catch (error) {
      console.error("Gemini API Error:", error);
      return null;
    }
  };


  // --- CORE MECHANIC: CAPTURE & SCAN ---
  const takePictureAndScan = async () => {
    if (cameraRef.current) {
      setIsScanning(true);
      
      try {
        // 1. Take the picture
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
        
        // 2. Send to Gemini
        const aiResult = await analyzeImageWithGemini(photo.base64);
        
        // 3. Handle the Result & Save to Firebase
        if (aiResult && aiResult.name) {
          alert(`Google AI Identified: ${aiResult.name}!`);
          
          try {
            // Push the captured animal to the live database
            await addDoc(collection(db, "capturedAnimals"), {
              name: aiResult.name,
              category: aiResult.category,
              timestamp: new Date()
            });
            console.log("Successfully saved to Firebase!");
          } catch (e) {
            console.error("Error saving to Firebase: ", e);
            alert("Failed to save to database.");
          }

        } else {
          alert("Could not identify an animal in this photo. Try getting closer!");
        }
      } catch (error) {
        alert("Something went wrong with the scan.");
      } finally {
        setIsScanning(false);
      }
    }
  };

  // --- POKEDEX UI RENDERER ---
  const renderAnimalCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {item.isUnlocked ? (
          <Image source={{ uri: item.imageUri }} style={styles.animalImage} />
        ) : (
          // Silhouette Mode
          <View style={styles.silhouetteContainer}>
             <Image source={{ uri: item.imageUri }} style={[styles.animalImage, styles.silhouette]} />
             <Text style={styles.questionMark}>?</Text>
          </View>
        )}
      </View>
      <Text style={styles.animalName}>
        {item.isUnlocked ? item.name : 'Unknown Species'}
      </Text>
      <Text style={styles.animalCategory}>{item.category}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eco-Hunter Dex</Text>
      </View>

      {/* MAIN CONTENT AREA */}
      {activeTab === 'camera' ? (
        <View style={styles.cameraContainer}>
          {/* 1. CameraView is now self-closing and takes up the whole background */}
          <CameraView style={StyleSheet.absoluteFillObject} facing="back" ref={cameraRef} />
          
          {/* 2. UI is OUTSIDE the CameraView, layered on top using absolute positioning */}
          <View style={styles.cameraUI}>
            {isScanning ? (
              <View style={styles.scanningOverlay}>
                 <ActivityIndicator size="large" color="#00ff00" />
                 <Text style={styles.scanningText}>Google AI Scanning...</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.captureButton} onPress={takePictureAndScan}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={database}
          renderItem={renderAnimalCard}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.pokedexList}
        />
      )}

      {/* BOTTOM NAVIGATION */}
      <View style={styles.navBar}>
        <TouchableOpacity style={[styles.navItem, activeTab === 'camera' && styles.navItemActive]} onPress={() => setActiveTab('camera')}>
          <Text style={styles.navText}>Scanner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'pokedex' && styles.navItemActive]} onPress={() => setActiveTab('pokedex')}>
          <Text style={styles.navText}>Pokédex ({database.filter(a => a.isUnlocked).length}/{database.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { paddingTop: 60, paddingBottom: 20, backgroundColor: '#2c3e50', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  text: { color: 'white', textAlign: 'center', marginTop: 50 },
  button: { backgroundColor: '#27ae60', padding: 15, margin: 20, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  
  // Camera Styles
  cameraContainer: { flex: 1, position: 'relative' },
  cameraUI: { 
    ...StyleSheet.absoluteFillObject, // This is the magic line that layers it on top!
    backgroundColor: 'transparent', 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    paddingBottom: 40,
    zIndex: 10 // Ensures buttons are clickable over the camera
  },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
  scanningOverlay: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 20, borderRadius: 15, alignItems: 'center' },
  scanningText: { color: '#00ff00', marginTop: 10, fontWeight: 'bold' },

  // Pokedex Styles
  pokedexList: { padding: 10 },
  card: { flex: 1, backgroundColor: '#2c3e50', margin: 5, borderRadius: 10, padding: 10, alignItems: 'center' },
  imageContainer: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', backgroundColor: '#34495e', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  animalImage: { width: 100, height: 100 },
  silhouetteContainer: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#34495e' },
  silhouette: { tintColor: '#1a1a1a', opacity: 0.8 }, // This creates the black silhouette effect!
  questionMark: { position: 'absolute', color: 'rgba(255,255,255,0.3)', fontSize: 40, fontWeight: 'bold' },
  animalName: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  animalCategory: { color: '#bdc3c7', fontSize: 12, marginTop: 5 },

  // Navigation Styles
  navBar: { flexDirection: 'row', backgroundColor: '#2c3e50', paddingBottom: 30, paddingTop: 10 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  navItemActive: { borderBottomWidth: 3, borderBottomColor: '#27ae60' },
  navText: { color: 'white', fontWeight: 'bold' }
});