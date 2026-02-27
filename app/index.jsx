import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- MOCK DATABASE ---
// This represents your Firebase data. 'isUnlocked' determines if they see the silhouette or the photo.
const INITIAL_DATABASE = [
  { id: '1', name: 'Plantain Squirrel', category: 'Mammal', isUnlocked: false, imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Plantain_Squirrel_%28Callosciurus_notatus%29.jpg/640px-Plantain_Squirrel_%28Callosciurus_notatus%29.jpg' },
  { id: '2', name: 'Macaque', category: 'Mammal', isUnlocked: false, imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Macaca_fascicularis_-_01.jpg/640px-Macaca_fascicularis_-_01.jpg' },
  { id: '3', name: 'Monitor Lizard', category: 'Reptile', isUnlocked: false, imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Varanus_salvator_-_01.jpg/640px-Varanus_salvator_-_01.jpg' },
  { id: '4', name: 'Kingfisher', category: 'Bird', isUnlocked: false, imageUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/White-throated_Kingfisher.jpg/640px-White-throated_Kingfisher.jpg' },
];

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'pokedex'
  const [database, setDatabase] = useState(INITIAL_DATABASE);
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- CORE MECHANIC: CAPTURE & SCAN ---
  const takePictureAndScan = async () => {
    if (cameraRef.current) {
      setIsScanning(true);
      // 1. Take the picture (Enforces in-app camera only)
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      
      // 2. THIS IS WHERE YOUR HACKATHON LOGIC GOES
      // TODO: Send 'photo.base64' to Google Cloud Vision API
      // TODO: If Vision API returns "Squirrel", update Firebase.
      
      // 3. Mock AI Simulation (Unlocks a random locked animal after 2 seconds)
      setTimeout(() => {
        const lockedAnimals = database.filter(animal => !animal.isUnlocked);
        if (lockedAnimals.length > 0) {
          const randomUnlock = lockedAnimals[Math.floor(Math.random() * lockedAnimals.length)];
          setDatabase(prev => prev.map(animal => 
            animal.id === randomUnlock.id ? { ...animal, isUnlocked: true } : animal
          ));
          alert(`Success! You identified a ${randomUnlock.name}!`);
        } else {
          alert('You have collected all the animals in this region!');
        }
        setIsScanning(false);
      }, 2000);
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
          <CameraView style={styles.camera} facing="back" ref={cameraRef}>
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
          </CameraView>
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
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraUI: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
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