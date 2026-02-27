import { GoogleGenerativeAI } from '@google/generative-ai';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { onAuthStateChange   } from 'firebase/auth';
import { addDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase-config';

// --- THE MASTER ECO-DEX DATABASE (50 ANIMALS) ---
const MASTER_ECO_DEX = [
  // MAMMALS
  { id: 1, name: 'Dog', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/dog.png' },
  { id: 2, name: 'Cat', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/cat.png' },
  { id: 3, name: 'Squirrel', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/squirrel.png' },
  { id: 4, name: 'Monkey', category: 'Mammal', imageUri: 'https://img.icons8.com/?size=100&id=uxjqXCXF5TlO&format=png&color=000000' },
  { id: 5, name: 'Rat', category: 'Mammal', imageUri: 'https://img.icons8.com/?size=100&id=vzz0xyvO-UyC&format=png&color=000000' },
  { id: 6, name: 'Bat', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/bat.png' },
  { id: 7, name: 'Cow', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/cow.png' },
  { id: 8, name: 'Horse', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/horse.png' },
  { id: 9, name: 'Pig', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/pig.png' },
  { id: 10, name: 'Goat', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/goat.png' },
  { id: 11, name: 'Sheep', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/sheep.png' },
  { id: 12, name: 'Deer', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/deer.png' },
  { id: 13, name: 'Bear', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/bear.png' },
  { id: 14, name: 'Elephant', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/elephant.png' },
  { id: 15, name: 'Tiger', category: 'Mammal', imageUri: 'https://img.icons8.com/?size=100&id=I5OML1bajbP2&format=png&color=000000' },
  { id: 16, name: 'Lion', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/lion.png' },
  { id: 17, name: 'Rabbit', category: 'Mammal', imageUri: 'https://img.icons8.com/color/96/rabbit.png' },
  // AVIANS
  { id: 18, name: 'Bird', category: 'Avian', imageUri: 'https://img.icons8.com/color/96/bird.png' },
  { id: 19, name: 'Chicken', category: 'Avian', imageUri: 'https://img.icons8.com/color/96/chicken.png' },
  { id: 20, name: 'Duck', category: 'Avian', imageUri: 'https://img.icons8.com/color/96/duck.png' },
  { id: 21, name: 'Owl', category: 'Avian', imageUri: 'https://img.icons8.com/color/96/owl.png' },
  { id: 22, name: 'Eagle', category: 'Avian', imageUri: 'https://img.icons8.com/?size=100&id=yb7r2rdbifEu&format=png&color=000000' },
  { id: 23, name: 'Parrot', category: 'Avian', imageUri: 'https://img.icons8.com/color/96/parrot.png' },
  { id: 24, name: 'Penguin', category: 'Avian', imageUri: 'https://img.icons8.com/?size=100&id=GLNXrevIGCZO&format=png&color=000000' },
  { id: 25, name: 'Ostrich', category: 'Avian', imageUri: 'https://img.icons8.com/color/96/ostrich.png' },
  // REPTILES
  { id: 26, name: 'Lizard', category: 'Reptile', imageUri: 'https://img.icons8.com/color/96/lizard.png' },
  { id: 27, name: 'Snake', category: 'Reptile', imageUri: 'https://img.icons8.com/color/96/snake.png' },
  { id: 28, name: 'Turtle', category: 'Reptile', imageUri: 'https://img.icons8.com/color/96/turtle.png' },
  { id: 29, name: 'Crocodile', category: 'Reptile', imageUri: 'https://img.icons8.com/?size=100&id=Rs7WtznR24Af&format=png&color=000000' },
  // AMPHIBIANS
  { id: 30, name: 'Frog', category: 'Amphibian', imageUri: 'https://img.icons8.com/color/96/frog.png' },
  { id: 31, name: 'Salamander', category: 'Amphibian', imageUri: 'https://img.icons8.com/?size=100&id=95597&format=png&color=000000' },
  // INSECTS
  { id: 32, name: 'Butterfly', category: 'Insect', imageUri: 'https://img.icons8.com/color/96/butterfly.png' },
  { id: 33, name: 'Spider', category: 'Insect', imageUri: 'https://img.icons8.com/color/96/spider.png' },
  { id: 34, name: 'Ant', category: 'Insect', imageUri: 'https://img.icons8.com/color/96/ant.png' },
  { id: 35, name: 'Bee', category: 'Insect', imageUri: 'https://img.icons8.com/color/96/bee.png' },
  { id: 36, name: 'Beetle', category: 'Insect', imageUri: 'https://img.icons8.com/?size=100&id=dUffInH7HEmp&format=png&color=000000' },
  { id: 37, name: 'Fly', category: 'Insect', imageUri: 'https://img.icons8.com/color/96/fly.png' },
  { id: 38, name: 'Mosquito', category: 'Insect', imageUri: 'https://img.icons8.com/color/96/mosquito.png' },
  { id: 39, name: 'Grasshopper', category: 'Insect', imageUri: 'https://img.icons8.com/color/96/grasshopper.png' },
  { id: 40, name: 'Worm', category: 'Insect', imageUri: 'https://img.icons8.com/?size=100&id=H1hwHFVrRITm&format=png&color=000000' },
  { id: 41, name: 'Snail', category: 'Insect', imageUri: 'https://img.icons8.com/color/96/snail.png' },
  { id: 42, name: 'Centipede', category: 'Insect', imageUri: 'https://img.icons8.com/?size=100&id=GLhKyCsuhb2E&format=png&color=000000' },
  // AQUATIC
  { id: 43, name: 'Fish', category: 'Aquatic', imageUri: 'https://img.icons8.com/color/96/fish.png' },
  { id: 44, name: 'Shark', category: 'Aquatic', imageUri: 'https://img.icons8.com/color/96/shark.png' },
  { id: 45, name: 'Dolphin', category: 'Aquatic', imageUri: 'https://img.icons8.com/color/96/dolphin.png' },
  { id: 46, name: 'Whale', category: 'Aquatic', imageUri: 'https://img.icons8.com/color/96/whale.png' },
  { id: 47, name: 'Crab', category: 'Aquatic', imageUri: 'https://img.icons8.com/color/96/crab.png' },
  { id: 48, name: 'Shrimp', category: 'Aquatic', imageUri: 'https://img.icons8.com/?size=100&id=rm2ULHn0Cvt9&format=png&color=000000' },
  { id: 49, name: 'Octopus', category: 'Aquatic', imageUri: 'https://img.icons8.com/color/96/octopus.png' },
  { id: 50, name: 'Jellyfish', category: 'Aquatic', imageUri: 'https://img.icons8.com/color/96/jellyfish.png' }
];

export default function App() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'ecodex'
  
  const [database, setDatabase] = useState(MASTER_ECO_DEX); 
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef(null);

  // NEW STATE: Tracks which animal is currently open in the Modal
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  // 1. Authenticate the User
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace('/login');
      } else {
        setUser(currentUser); 
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch ALL Captured Animals (Community Tally + Personal Unlocks)
  useEffect(() => {
    if (!user) return; 

    const q = query(collection(db, "capturedAnimals"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => doc.data());
      
      // A. Filter out just YOUR captures to know what to unlock
      const myCaptures = allDocs.filter(doc => doc.userId === user.uid);
      const myCapturedNames = myCaptures.map(doc => doc.name.toLowerCase());

      // B. Calculate Global Stats (Count UNIQUE users for each animal)
      const communityStats = {};
      allDocs.forEach(doc => {
        const animalName = doc.name ? doc.name.toLowerCase() : null;
        if (!animalName) return; 

        if (!communityStats[animalName]) communityStats[animalName] = new Set();
        communityStats[animalName].add(doc.userId || Math.random().toString());
      });

      // C. Unlock the base 50 animals & attach the community count & fun fact
      const updatedDex = MASTER_ECO_DEX.map(animal => {
        const isUnlocked = myCapturedNames.includes(animal.name.toLowerCase());
        const myCaptureDoc = myCaptures.find(doc => doc.name.toLowerCase() === animal.name.toLowerCase());

        return {
          ...animal,
          isUnlocked: isUnlocked,
          discoveredByCount: communityStats[animal.name.toLowerCase()] ? communityStats[animal.name.toLowerCase()].size : 0,
          funFact: myCaptureDoc ? myCaptureDoc.funFact : "This creature is still hiding in the wild. Keep exploring to reveal its secrets!"
        }
      });

      // D. Find your dynamic discoveries & attach the community count
      const masterNames = MASTER_ECO_DEX.map(a => a.name.toLowerCase());
      const dynamicDiscoveries = myCaptures
        .filter(doc => !masterNames.includes(doc.name.toLowerCase()))
        .filter((value, index, self) => index === self.findIndex((t) => t.name.toLowerCase() === value.name.toLowerCase()))
        .map((doc, index) => ({
          id: `new-${index}`,
          name: doc.name,
          category: doc.category,
          isUnlocked: true,
          discoveredByCount: communityStats[doc.name.toLowerCase()] ? communityStats[doc.name.toLowerCase()].size : 0,
          imageUri: 'https://img.icons8.com/color/96/sparkling.png',
          funFact: doc.funFact 
        }));

      setDatabase([...updatedDex, ...dynamicDiscoveries]);
    });

    return () => unsubscribe(); 
  }, [user]);

  // --- GEMINI AI INTEGRATION ---
  const analyzeImageWithGemini = async (base64Image) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        alert("API Key is missing! Check your .env file.");
        return null;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are an elite biodiversity app scanner.
      Identify the primary animal in this photo. 
      
      If it closely matches one of these common animals, use this exact name:
      Dog, Cat, Squirrel, Monkey, Rat, Bat, Cow, Horse, Pig, Goat, Sheep, Deer, Bear, Elephant, Tiger, Lion, Rabbit, Bird, Chicken, Duck, Owl, Eagle, Parrot, Penguin, Ostrich, Lizard, Snake, Turtle, Crocodile, Frog, Salamander, Butterfly, Spider, Ant, Bee, Beetle, Fly, Mosquito, Grasshopper, Worm, Snail, Centipede, Fish, Shark, Dolphin, Whale, Crab, Shrimp, Octopus, Jellyfish.
      
      If it is a different animal NOT on this list, provide its specific common name (e.g., "Pangolin", "Hornbill", "Tapir").
      If there is no animal in the photo, output "None".

      Return the result STRICTLY as a JSON object with three keys: 
      'name' (string: the generic name from the list OR the new specific name), 
      'category' (string: Mammal, Reptile, Avian, Insect, Amphibian, Aquatic, or Unknown), 
      'fun_fact' (string: a short 1-sentence fun fact about the animal). 
      Output ONLY valid JSON. No markdown tags.`;

      const imagePart = {
        inlineData: { data: base64Image, mimeType: "image/jpeg" }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString);

    } catch (error) {
      console.error("Gemini Error:", error);
      return null;
    }
  };

  // --- CORE MECHANIC: CAPTURE & SCAN ---
  const takePictureAndScan = async () => {
    if (cameraRef.current) {
      setIsScanning(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
        const aiResult = await analyzeImageWithGemini(photo.base64);
        
        if (aiResult && aiResult.name && aiResult.name !== 'None') {
          const genericName = aiResult.name.trim();

          // Check if already caught
          const alreadyCaught = database.some(a => a.name.toLowerCase() === genericName.toLowerCase() && a.isUnlocked);

          if (alreadyCaught) {
            alert(`You already unlocked ${genericName}!\n\n💡 Fun Fact: ${aiResult.fun_fact}`);
          } else {
            const isBaseAnimal = MASTER_ECO_DEX.some(a => a.name.toLowerCase() === genericName.toLowerCase());
            const pointsToAward = isBaseAnimal ? 10 : 20;

            alert(`🎉 New Eco-Dex Entry Unlocked: ${genericName}!\n⭐ +${pointsToAward} Points!\n\n💡 Fun Fact: ${aiResult.fun_fact}`);
            try {
              await addDoc(collection(db, "capturedAnimals"), {
                name: genericName,
                category: aiResult.category,
                funFact: aiResult.fun_fact || "No fact available.",
                points: pointsToAward, 
                timestamp: new Date(),
                userId: user.uid
              });
            } catch (e) {
              console.error("Save Error: ", e);
            }
          }
        } else {
          alert("No animal detected. Try getting closer!");
        }
      } catch (error) {
        alert("Scan failed. Check your internet connection.");
      } finally {
        setIsScanning(false);
      }
    }
  };

  // --- UI RENDERER ---
  const renderAnimalCard = ({ item }) => {
    const isDynamic = String(item.id).startsWith('new');
    const formattedId = isDynamic ? 'NEW!' : `#${String(item.id).padStart(3, '0')}`;

    return (
      <TouchableOpacity style={styles.card} onPress={() => setSelectedAnimal(item)}>
        <Text style={[styles.idNumber, isDynamic && { color: '#f1c40f' }]}>{formattedId}</Text>        
        <View style={styles.imageContainer}>
          {item.isUnlocked ? (
            <Image source={{ uri: item.imageUri }} style={styles.animalImage} />
          ) : (
            <View style={styles.silhouetteContainer}>
               <Image source={{ uri: item.imageUri }} style={[styles.animalImage, styles.silhouette]} />
               <Text style={styles.questionMark}>?</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.animalName}>{item.name}</Text>
        <Text style={styles.animalCategory}>{item.category}</Text>

        {item.discoveredByCount > 0 ? (
          <View style={styles.communityBadge}>
            <Text style={styles.communityText}>
              🌍 Found by {item.discoveredByCount} player{item.discoveredByCount === 1 ? '' : 's'}
            </Text>
          </View>
        ) : (
          <Text style={[styles.communityText, { color: '#7f8c8d', marginTop: 8 }]}>
            🌍 Undiscovered
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Permissions Check
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalScore = database.filter(animal => animal.isUnlocked).reduce((sum, animal) => {
    const isDynamic = String(animal.id).startsWith('new');
    return sum + (isDynamic ? 20 : 10);
  }, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eco-Dex</Text>
        <Text style={styles.scoreText}>⭐ Score: {totalScore}</Text>
      </View>
      
      {activeTab === 'camera' ? (
        <View style={styles.cameraContainer}>
          <CameraView style={StyleSheet.absoluteFillObject} facing="back" ref={cameraRef} />
          <View style={styles.cameraUI}>
            {isScanning ? (
              <View style={styles.scanningOverlay}>
                 <ActivityIndicator size="large" color="#00ff00" />
                 <Text style={styles.scanningText}>Google AI analyzing...</Text>
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
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.pokedexList}
        />
      )}

      {/* NEW: THE ANIMAL DETAIL MODAL */}
      <Modal visible={!!selectedAnimal} transparent={true} animationType="slide">
        {selectedAnimal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedAnimal(null)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.modalImageContainer}>
                {selectedAnimal.isUnlocked ? (
                  <Image source={{ uri: selectedAnimal.imageUri }} style={styles.modalImage} />
                ) : (
                   <Image source={{ uri: selectedAnimal.imageUri }} style={[styles.modalImage, styles.silhouette]} />
                )}
              </View>

              <Text style={styles.modalName}>{selectedAnimal.name}</Text>
              <Text style={styles.modalCategory}>{selectedAnimal.category}</Text>
              
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {selectedAnimal.isUnlocked ? "✅ UNLOCKED" : "🔒 LOCKED"}
                </Text>
              </View>

              <ScrollView style={styles.factContainer}>
                <Text style={styles.factTitle}>Eco-Fact:</Text>
                <Text style={[styles.factText, !selectedAnimal.isUnlocked && { fontStyle: 'italic', color: '#95a5a6' }]}>
                  {selectedAnimal.funFact}
                </Text>
              </ScrollView>

            </View>
          </View>
        )}
      </Modal>

      <View style={styles.navBar}>
        <TouchableOpacity style={[styles.navItem, activeTab === 'camera' && styles.navItemActive]} onPress={() => setActiveTab('camera')}>
          <Text style={styles.navText}>Scanner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'ecodex' && styles.navItemActive]} onPress={() => setActiveTab('ecodex')}>
          <Text style={styles.navText}>Eco-Dex ({database.filter(a => a.isUnlocked).length}/{database.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { paddingTop: 60, paddingBottom: 20, backgroundColor: '#2c3e50', alignItems: 'center' },
  headerTitle: { color: '#27ae60', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  scoreText: { color: '#f1c40f', fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  permissionText: { color: 'white', textAlign: 'center', marginTop: 150, fontSize: 18, paddingHorizontal: 20 },
  button: { backgroundColor: '#27ae60', padding: 15, margin: 20, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  
  cameraContainer: { flex: 1, position: 'relative' },
  cameraUI: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40, zIndex: 10 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#27ae60' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
  scanningOverlay: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 15, alignItems: 'center' },
  scanningText: { color: '#00ff00', marginTop: 10, fontWeight: 'bold', letterSpacing: 1 },

  pokedexList: { padding: 10 },
  card: { flex: 1, backgroundColor: '#2c3e50', margin: 5, borderRadius: 12, padding: 10, alignItems: 'center', elevation: 5 },
  idNumber: { color: '#95a5a6', fontSize: 12, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 5 },
  imageContainer: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', backgroundColor: '#ecf0f1', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  animalImage: { width: 50, height: 50 },
  silhouetteContainer: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center', backgroundColor: '#7f8c8d' },
  silhouette: { tintColor: '#111', opacity: 0.9 },
  questionMark: { position: 'absolute', color: 'rgba(255,255,255,0.4)', fontSize: 35, fontWeight: 'bold' },
  animalName: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  animalCategory: { color: '#bdc3c7', fontSize: 11, marginTop: 2, textTransform: 'uppercase' },
  communityText: { color: '#3498db', fontSize: 11, fontWeight: 'bold' },
  communityBadge: { backgroundColor: 'rgba(52, 152, 219, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginTop: 8 },

  navBar: { flexDirection: 'row', backgroundColor: '#2c3e50', paddingBottom: 30, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#34495e' },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  navItemActive: { borderBottomWidth: 3, borderBottomColor: '#27ae60' },
  navText: { color: 'white', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#2c3e50', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 10, position: 'relative' },
  closeButton: { position: 'absolute', top: 15, right: 15, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.1)', width: 35, height: 35, borderRadius: 17.5, justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modalImageContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ecf0f1', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 4, borderColor: '#27ae60' },
  modalImage: { width: 80, height: 80 },
  modalName: { color: 'white', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  modalCategory: { color: '#bdc3c7', fontSize: 14, textTransform: 'uppercase', marginBottom: 15, letterSpacing: 2 },
  statusBadge: { backgroundColor: 'rgba(39, 174, 96, 0.2)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginBottom: 20 },
  statusText: { color: '#2ecc71', fontWeight: 'bold', fontSize: 12 },
  factContainer: { width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 10, maxHeight: 150 },
  factTitle: { color: '#3498db', fontWeight: 'bold', marginBottom: 5 },
  factText: { color: 'white', fontSize: 15, lineHeight: 22 },
});