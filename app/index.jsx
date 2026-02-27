import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react'; // Added useEffect
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebase-config';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';import { GoogleGenerativeAI } from '@google/generative-ai';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase-config';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY);

// It is safe to keep constants outside the component
const REGION_ANIMALS = [
  { id: '1', name: 'Plantain Squirrel', category: 'Mammal', imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Plantain_Squirrel_%28Callosciurus_notatus%29.jpg/640px-Plantain_Squirrel_%28Callosciurus_notatus%29.jpg' },
  { id: '2', name: 'Macaque', category: 'Mammal', imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Macaca_fascicularis_-_01.jpg/640px-Macaca_fascicularis_-_01.jpg' },
  { id: '3', name: 'Monitor Lizard', category: 'Reptile', imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Varanus_salvator_-_01.jpg/640px-Varanus_salvator_-_01.jpg' },
  { id: '4', name: 'Kingfisher', category: 'Bird', imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/White-throated_Kingfisher.jpg/640px-White-throated_Kingfisher.jpg' },
];


export default function App() {
  const router = useRouter(); // 1. Initialize the router
  const [user, setUser] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState('camera');
  
  // Fixed: Now references REGION_ANIMALS
  const [database, setDatabase] = useState(REGION_ANIMALS); 
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef(null);
  
  
  // 2. The Bouncer: Checks if the user is logged in
  // This hook constantly listens to Firebase for YOUR new captures!
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // Not logged in? Kick them out
        router.replace('/login');
      } else {
        // Logged in? Save their data so addDoc and Pokédex can use it!
        setUser(currentUser); 
      }
    });
    return () => unsubscribe();
  }, []);

  // Fixed: Moved the listener INSIDE the component
  useEffect(() => {
    if (!user) return; 

    const q = query(collection(db, "capturedAnimals"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 1. Get ALL documents this user has captured
      const capturedDocs = snapshot.docs.map(doc => doc.data());
      const capturedNames = capturedDocs.map(doc => doc.name.toLowerCase());
      
      // 2. Unlock the default hardcoded animals if they found them
      const updatedDefaults = REGION_ANIMALS.map(animal => ({
        ...animal,
        isUnlocked: capturedNames.includes(animal.name.toLowerCase())
      }));

      // 3. Find brand NEW animals that aren't in the default list
      const defaultNames = REGION_ANIMALS.map(a => a.name.toLowerCase());
      const newDiscoveries = capturedDocs
        // Filter out animals that are already in the default list
        .filter(doc => !defaultNames.includes(doc.name.toLowerCase()))
        // Filter out duplicates (if they scanned the same new bird twice)
        .filter((value, index, self) => index === self.findIndex((t) => t.name.toLowerCase() === value.name.toLowerCase()))
        // Format them to look exactly like our standard Pokedex cards
        .map((doc, index) => ({
          id: `dynamic-${index}`,
          name: doc.name,
          category: doc.category,
          isUnlocked: true,
          // Using a neat generic icon for dynamically discovered animals
          imageUri: 'https://cdn-icons-png.flaticon.com/512/2094/2094458.png' 
        }));

      // 4. Combine the default animals and the new discoveries into one massive Dex!
      setDatabase([...updatedDefaults, ...newDiscoveries]);
    });

    return () => unsubscribe(); 
  }, [user]);


  // --- GEMINI AI INTEGRATION ---
  const analyzeImageWithGemini = async (base64Image) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are an elite wildlife biologist in Malaysia. 
      Carefully analyze this smartphone photo. The image might be slightly blurry, shadowed, or taken from a distance.
      Identify the primary animal in the frame. 
      
      CRITICAL RULE: If the animal even closely resembles one of these target species (Plantain Squirrel, Macaque, Monitor Lizard, Kingfisher), you MUST use that exact name.
      If it is a completely different animal, identify it specifically (e.g., "Stray Cat", "Pigeon").
      If there is absolutely no animal in the photo, set the name to "None".

      Return the result STRICTLY as a JSON object with three keys: 
      'name' (string), 
      'category' (string: Mammal, Reptile, Bird, Insect, or Unknown), 
      'fun_fact' (string: a short, fascinating 1-sentence ecological fact about this animal). 
      Output ONLY valid JSON. Do not include markdown formatting like \`\`\`json.`;

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
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
        
        // 2. Send to Gemini
        const aiResult = await analyzeImageWithGemini(photo.base64);
        
        // 3. Handle the Result & Save to Firebase
        if (aiResult && aiResult.name && aiResult.name !== 'None' && aiResult.name.toLowerCase() !== 'unknown') {
          
          const animalName = aiResult.name;
          
          // Check if they already caught it by looking at our local 'database' state
          const alreadyCaught = database.some(a => a.name.toLowerCase() === animalName.toLowerCase() && a.isUnlocked);

          if (alreadyCaught) {
            // REPEATED ANIMAL: Just show the fact, no points, no database save
            alert(`You already caught the ${animalName}!\n\n💡 Fun Fact: ${aiResult.fun_fact}`);
          
          } else {
            // NEW ANIMAL: Calculate points
            // Is it in our default hardcoded list? If yes = 5 pts. If no (dynamic) = 10 pts.
            const isDefaultAnimal = REGION_ANIMALS.some(a => a.name.toLowerCase() === animalName.toLowerCase());
            const pointsToAward = isDefaultAnimal ? 5 : 10;

            alert(`🎉 New Discovery: ${animalName}!\n⭐ +${pointsToAward} Points!\n\n💡 Fun Fact: ${aiResult.fun_fact}`);
            
            try {
              // Save to Firebase WITH the new points field
              await addDoc(collection(db, "capturedAnimals"), {
                name: animalName,
                category: aiResult.category,
                funFact: aiResult.fun_fact || "No fact available.",
                points: pointsToAward, // Save the score!
                timestamp: new Date(),
                userId: user.uid
              });
              console.log(`Saved ${animalName} for ${pointsToAward} points!`);
            } catch (e) {
              console.error("Error saving to Firebase: ", e);
              alert("Failed to save to database.");
            }
          }

        } else {
          alert("Could not clearly identify an animal. Try getting a better angle or lighting!");
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

  // Calculate total score (includes a fallback just in case old DB entries don't have the points field yet)
  const totalScore = database
    .filter(animal => animal.isUnlocked)
    .reduce((sum, animal) => {
      const fallbackPoints = REGION_ANIMALS.some(r => r.name.toLowerCase() === animal.name.toLowerCase()) ? 5 : 10;
      return sum + (animal.points || fallbackPoints);
    }, 0);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eco-Hunter Dex</Text>
        <Text style={styles.scoreText}>⭐ Total Score: {totalScore}</Text>
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
  scoreText: { color: '#f1c40f', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
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