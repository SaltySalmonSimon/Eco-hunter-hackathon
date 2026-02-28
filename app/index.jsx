import { GoogleGenerativeAI } from '@google/generative-ai';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
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
  { id: 25, name: 'Ostrich', category: 'Avian', imageUri: 'https://img.icons8.com/?size=100&id=UOOktdYeFkNo&format=png&color=000000' },
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

const COMMON_ANIMALS = [
  'Dog', 'Cat', 'Bird', 'Ant', 'Fly', 
  'Fish', 'Spider', 'Snail', 'Lizard', 
  'Frog', 'Squirrel', 'Butterfly', 'Beetle', 'Monkey'
];

export default function App() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState('camera'); 
  
  const [database, setDatabase] = useState(MASTER_ECO_DEX); 
  const [leaderboard, setLeaderboard] = useState([]); 
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef(null);

  const [selectedAnimal, setSelectedAnimal] = useState(null);
  
  const [dailyTargets, setDailyTargets] = useState([]);
  const [missionProgress, setMissionProgress] = useState([]); // Stores names of targets caught today
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [isMissionExpanded, setIsMissionExpanded] = useState(false);

  // 1. Authenticate User
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

  // 1.5 Generate Today's Random Mission Bounties (Easy Mode!)
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    
    // Pick from the easy-to-find list instead of the entire Eco-Dex!
    const target1 = COMMON_ANIMALS[dayOfYear % COMMON_ANIMALS.length];
    
    // Use an offset (like +5) to ensure target2 is always a different animal
    const target2 = COMMON_ANIMALS[(dayOfYear + 5) % COMMON_ANIMALS.length]; 
    
    setDailyTargets([target1, target2]);
  }, []);

  // 2. Data Compiler (The Brain that builds the Inventory AND Firebase Leaderboard)
  useEffect(() => {
    if (!user) return; 

    const q = query(collection(db, "capturedAnimals"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => doc.data());
      const myCaptures = allDocs.filter(doc => doc.userId === user.uid);

      // --- THE REAL FIREBASE LEADERBOARD ---
      const userScores = {};
      const userNames = {}; 

      // --- THE DAILY RESET & PROGRESS RESTORE ---
      // 1. Get ONLY the animals this user caught TODAY
      const todayString = new Date().toDateString();
      const todaysCaptures = myCaptures.filter(doc => {
        if (!doc.timestamp) return false;
        // Handle both Firebase Timestamp and native JS Date objects
        const dateObj = doc.timestamp.toDate ? doc.timestamp.toDate() : new Date(doc.timestamp);
        return dateObj.toDateString() === todayString;
      });

      // 2. Did they claim the bonus today?
      const hasClaimedToday = todaysCaptures.some(doc => doc.baseName === "Daily Mission Bonus");
      
      if (hasClaimedToday && !missionCompleted) {
        setMissionCompleted(true);
        setIsMissionExpanded(false); // Auto-hide the banner if they log in and it's already done!
      } else if (!hasClaimedToday) {
        setMissionCompleted(false);
      }

      // 3. Restore the 1/1 numbers based on what they caught today!
      setMissionProgress(todaysCaptures.map(doc => doc.baseName));

      // 1. Loop through every animal ever caught by anyone
      allDocs.forEach(doc => {
        const uid = doc.userId;
        if (!uid) return;
        
        // 2. Set up their profile in our temporary memory
        if (!userScores[uid]) {
          userScores[uid] = 0;
          userNames[uid] = doc.userName || `Hunter-${uid.substring(0, 4)}`;
        }
        
        // 3. Add the points of this catch to their total!
        userScores[uid] += (doc.points || 0); 
      });

      // 4. Convert our memory into a sorted array
      const realRankedPlayers = Object.keys(userScores).map(uid => ({
        id: uid,
        name: userNames[uid], 
        score: userScores[uid]
      })).sort((a, b) => b.score - a.score);

      setLeaderboard(realRankedPlayers);
      // ---------------------------------------------

      // Calculate Global Stats
      const communityStats = {};
      allDocs.forEach(doc => {
        const bName = doc.baseName ? doc.baseName.toLowerCase() : (doc.name ? doc.name.toLowerCase() : null);
        if (!bName || bName === 'daily mission bonus') return; 
        if (!communityStats[bName]) communityStats[bName] = new Set();
        communityStats[bName].add(doc.userId || Math.random().toString());
      });

      // Build the base 50 animals
      const updatedDex = MASTER_ECO_DEX.map(animal => {
        const catchesForThisAnimal = myCaptures.filter(doc => 
          (doc.baseName || doc.name || "").toLowerCase() === animal.name.toLowerCase()
        );
        
        const isUnlocked = catchesForThisAnimal.length > 0;
        const specificBreedsFound = [...new Set(catchesForThisAnimal.map(doc => doc.specificName || doc.name))].filter(Boolean);

        return {
          ...animal,
          isUnlocked: isUnlocked,
          catchCount: catchesForThisAnimal.length, 
          inventory: specificBreedsFound, 
          discoveredByCount: communityStats[animal.name.toLowerCase()] ? communityStats[animal.name.toLowerCase()].size : 0,
          funFact: isUnlocked ? catchesForThisAnimal[0].funFact : "This creature is still hiding in the wild. Keep exploring to reveal its secrets!"
        }
      });

      // Handle Dynamic Discoveries
      const masterNames = MASTER_ECO_DEX.map(a => a.name.toLowerCase());
      const dynamicDiscoveries = myCaptures
        .filter(doc => !masterNames.includes((doc.baseName || doc.name || "").toLowerCase()) && doc.baseName !== "Daily Mission Bonus")
        .filter((value, index, self) => index === self.findIndex((t) => (t.baseName || t.name).toLowerCase() === (value.baseName || value.name).toLowerCase()))
        .map((doc, index) => {
          const bName = doc.baseName || doc.name;
          const dynamicCatches = myCaptures.filter(d => (d.baseName || d.name) === bName);
          const dynamicInventory = [...new Set(dynamicCatches.map(d => d.specificName || d.name))].filter(Boolean);

          return {
            id: `new-${index}`,
            name: bName,
            category: doc.category,
            isUnlocked: true,
            catchCount: dynamicCatches.length,
            inventory: dynamicInventory,
            discoveredByCount: communityStats[bName.toLowerCase()] ? communityStats[bName.toLowerCase()].size : 0,
            imageUri: 'https://img.icons8.com/color/96/sparkling.png',
            funFact: doc.funFact 
          }
        });

      setDatabase([...updatedDex, ...dynamicDiscoveries]);
    });

    return () => unsubscribe(); 
  }, [user]);

  // --- GEMINI AI INTEGRATION ---
  const analyzeImageWithGemini = async (base64Image) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) return null;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are an elite biodiversity app scanner. Identify the primary animal in this photo. 
      
      If it closely matches one of these common animals, use this exact word for 'base_name': Dog, Cat, Squirrel, Monkey, Rat, Bat, Cow, Horse, Pig, Goat, Sheep, Deer, Bear, Elephant, Tiger, Lion, Rabbit, Bird, Chicken, Duck, Owl, Eagle, Parrot, Penguin, Ostrich, Lizard, Snake, Turtle, Crocodile, Frog, Salamander, Butterfly, Spider, Ant, Bee, Beetle, Fly, Mosquito, Grasshopper, Worm, Snail, Centipede, Fish, Shark, Dolphin, Whale, Crab, Shrimp, Octopus, Jellyfish.
      
      If it is NOT on this list, provide its general name for 'base_name' (e.g., 'Pangolin', 'Tapir').
      If there is no animal, output "None" for base_name.

      Return the result STRICTLY as a JSON object with four keys: 
      'base_name' (string: the generic name from the list), 
      'specific_name' (string: the exact species/breed, e.g., 'Golden Retriever', 'Macaque', 'Monarch Butterfly'),
      'category' (string: Mammal, Reptile, Avian, Insect, Amphibian, Aquatic, or Unknown), 
      'fun_fact' (string: a short 1-sentence fun fact about the specific_name). 
      Output ONLY valid JSON. No markdown tags.`;

      const imagePart = { inlineData: { data: base64Image, mimeType: "image/jpeg" } };
      const result = await model.generateContent([prompt, imagePart]);
      const jsonString = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString);

    } catch (error) {
      console.error("Gemini Error:", error);
      return null;
    }
  };

  // --- CORE MECHANIC: CAPTURE, SCAN & MISSION LOGIC ---
  const takePictureAndScan = async () => {
    if (cameraRef.current) {
      setIsScanning(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
        const aiResult = await analyzeImageWithGemini(photo.base64);
        
        if (aiResult && aiResult.base_name && aiResult.base_name !== 'None') {
          const bName = aiResult.base_name.trim();
          const sName = aiResult.specific_name.trim();
          
          const isBaseAnimal = MASTER_ECO_DEX.some(a => a.name.toLowerCase() === bName.toLowerCase());
          const pointsToAward = isBaseAnimal ? 10 : 20;

          const currentUserDisplayName = user.displayName || (user.email ? user.email.split('@')[0] : `Hunter-${user.uid.substring(0,4)}`);

          alert(`📸 Captured: ${sName}!\n⭐ +${pointsToAward} Points!\n\n💡 Fun Fact: ${aiResult.fun_fact}`);
          
          try {
            await addDoc(collection(db, "capturedAnimals"), {
              baseName: bName,
              specificName: sName,
              category: aiResult.category,
              funFact: aiResult.fun_fact || "No fact available.",
              points: pointsToAward, 
              timestamp: new Date(),
              userId: user.uid,
              userName: currentUserDisplayName
            });

            // --- DAILY MISSION LOGIC (2 Random Targets) ---
            // Check if the animal they just scanned is one of today's targets
            if (!missionCompleted && dailyTargets.includes(bName)) {
              
              // Make sure they haven't already caught this specific target today
              if (!missionProgress.includes(bName)) {
                const updatedProgress = [...missionProgress, bName];
                setMissionProgress(updatedProgress);
                
                if (updatedProgress.length >= 2) {
                  setMissionCompleted(true);
                  
                  // Save the Mission Bonus to Firebase
                  await addDoc(collection(db, "capturedAnimals"), {
                    baseName: "Daily Mission Bonus",
                    specificName: `Found ${dailyTargets[0]} & ${dailyTargets[1]}`,
                    category: "Bonus",
                    funFact: "Awesome job tracking down today's targets!",
                    points: 50,
                    timestamp: new Date(),
                    userId: user.uid,
                    userName: currentUserDisplayName
                  });

                  setTimeout(() => alert("🎉 DAILY MISSION COMPLETE! +50 Bonus Points!"), 500);
                } else {
                  setTimeout(() => alert(`🎯 Mission Update!\nYou found the ${bName}! Just 1 more target to go.`), 500);
                }
              }
            }

          } catch (e) {
            console.error("Save Error: ", e);
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

  // --- UI RENDERING ---
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
            <Text style={styles.communityText}>🌍 Found by {item.discoveredByCount} player(s)</Text>
          </View>
        ) : (
          <Text style={[styles.communityText, { color: '#7f8c8d', marginTop: 8 }]}>🌍 Undiscovered</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (!permission) return <View />;
  if (!permission.granted) { 
    return (
      <View style={styles.container}>
        <Text style={{color: 'white', textAlign: 'center', marginTop: 100}}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    ); // <-- This was missing a closing bracket in your code!
  }

  // Your personal score is drawn directly from the live Firebase leaderboard calculation
  const myTotalScore = leaderboard.find(player => player.id === user?.uid)?.score || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eco-Dex</Text>
        <Text style={styles.scoreText}>⭐ Score: {myTotalScore}</Text>
      </View>
      
      {/* --- FLOATING MISSION DROPDOWN (TOP LEFT) --- */}
      <View style={styles.floatingMissionContainer}>
        <TouchableOpacity 
          style={styles.missionToggleButton} 
          onPress={() => setIsMissionExpanded(!isMissionExpanded)}
        >
          <Text style={styles.missionToggleIcon}>🎯 {missionCompleted ? '✅' : 'Bounties'}</Text>
        </TouchableOpacity>

        {isMissionExpanded && (
          <View style={styles.missionDropdownCard}>
            <Text style={styles.missionTitle}>Today's Targets</Text>
            {dailyTargets.length > 0 && (
              <Text style={styles.missionText}>
                • {dailyTargets[0]} ({missionCompleted || missionProgress.includes(dailyTargets[0]) ? "1" : "0"}/1){"\n"}
                • {dailyTargets[1]} ({missionCompleted || missionProgress.includes(dailyTargets[1]) ? "1" : "0"}/1)
              </Text>
            )}
            {missionCompleted ? (
              <Text style={styles.missionCompleteText}>✅ +50 Points Claimed!</Text>
            ) : (
              <Text style={styles.missionPendingText}>Reward: 50 Points</Text>
            )}
          </View>
        )}
      </View>

      {/* --- TAB 1: CAMERA --- */}
      {activeTab === 'camera' && (
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
      )}

      {/* --- TAB 2: ECO-DEX --- */}
      {activeTab === 'ecodex' && (
        <FlatList
          data={database}
          renderItem={renderAnimalCard}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.pokedexList}
        />
      )}

      {/* --- TAB 3: LEADERBOARD --- */}
      {activeTab === 'leaderboard' && (
        <View style={styles.leaderboardContainer}>
           <Text style={styles.leaderboardTitle}>🏆 Global Rankings</Text>
           <FlatList
              data={leaderboard}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({item, index}) => (
                 <View style={[styles.leaderboardRow, item.id === user?.uid && styles.leaderboardRowMe]}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                    <Text style={styles.hunterNameText}>
                      {item.id === user?.uid ? `${item.name} (You)` : item.name}
                    </Text>
                    <Text style={styles.hunterScoreText}>{item.score} pts</Text>
                 </View>
              )}
           />
        </View>
      )}

      {/* THE ANIMAL DETAIL MODAL WITH INVENTORY */}
      <Modal visible={!!selectedAnimal} transparent={true} animationType="slide">
        {selectedAnimal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedAnimal(null)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.modalImageContainer}>
                <Image source={{ uri: selectedAnimal.imageUri }} style={[styles.modalImage, !selectedAnimal.isUnlocked && styles.silhouette]} />
              </View>
              <Text style={styles.modalName}>{selectedAnimal.name}</Text>
              <Text style={styles.modalCategory}>{selectedAnimal.category}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {selectedAnimal.isUnlocked ? "✅ UNLOCKED" : "🔒 LOCKED"}
                </Text>
              </View>
              <ScrollView style={styles.modalScrollArea}>
                <View style={styles.factContainer}>
                  <Text style={styles.factTitle}>Eco-Fact:</Text>
                  <Text style={[styles.factText, !selectedAnimal.isUnlocked && { fontStyle: 'italic', color: '#95a5a6' }]}>
                    {selectedAnimal.funFact}
                  </Text>
                </View>
                <View style={styles.inventoryContainer}>
                  <Text style={styles.inventoryTitle}>
                    🎒 Your Collection ({selectedAnimal.catchCount || 0} caught)
                  </Text>
                  {selectedAnimal.catchCount > 0 ? (
                    selectedAnimal.inventory.map((breedName, index) => (
                      <Text key={index} style={styles.inventoryItem}>• {breedName}</Text>
                    ))
                  ) : (
                    <Text style={styles.inventoryItem}>No specific species found yet.</Text>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>

      {/* NAVIGATION BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity style={[styles.navItem, activeTab === 'camera' && styles.navItemActive]} onPress={() => setActiveTab('camera')}>
          <Text style={styles.navText}>Scanner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'ecodex' && styles.navItemActive]} onPress={() => setActiveTab('ecodex')}>
          <Text style={styles.navText}>Eco-Dex</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'leaderboard' && styles.navItemActive]} onPress={() => setActiveTab('leaderboard')}>
          <Text style={styles.navText}>Rankings</Text>
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
  
  cameraContainer: { flex: 1, position: 'relative' },
  cameraUI: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40, zIndex: 10 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#27ae60' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
  scanningOverlay: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 15, alignItems: 'center' },
  scanningText: { color: '#00ff00', marginTop: 10, fontWeight: 'bold', letterSpacing: 1 },

  floatingMissionContainer: { position: 'absolute', top: 55, left: 15, zIndex: 100, alignItems: 'flex-start' },
  missionToggleButton: { backgroundColor: '#2c3e50', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 2, borderColor: '#27ae60', elevation: 5 },
  missionToggleIcon: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  missionDropdownCard: { marginTop: 10, backgroundColor: 'rgba(44, 62, 80, 0.95)', padding: 15, borderRadius: 15, borderWidth: 2, borderColor: '#27ae60', minWidth: 200, elevation: 10 },
  missionTitle: { color: '#f1c40f', fontWeight: '900', fontSize: 14, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#34495e', paddingBottom: 5 },
  missionText: { color: 'white', fontSize: 13, fontWeight: 'bold', lineHeight: 22 },
  missionCompleteText: { color: '#2ecc71', fontSize: 12, fontWeight: '900', marginTop: 10, backgroundColor: 'rgba(46, 204, 113, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  missionPendingText: { color: '#bdc3c7', fontSize: 12, fontStyle: 'italic', marginTop: 10 },

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

  leaderboardContainer: { flex: 1, padding: 20, backgroundColor: '#1a1a1a' },
  leaderboardTitle: { fontSize: 22, color: '#f1c40f', fontWeight: '900', textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
  leaderboardRow: { flexDirection: 'row', backgroundColor: '#2c3e50', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 3 },
  leaderboardRowMe: { borderWidth: 2, borderColor: '#27ae60', backgroundColor: '#1e3329' },
  rankText: { color: '#95a5a6', fontSize: 18, fontWeight: '900', width: 40 },
  hunterNameText: { color: 'white', fontSize: 16, fontWeight: 'bold', flex: 1 },
  hunterScoreText: { color: '#2ecc71', fontSize: 18, fontWeight: '900' },

  navBar: { flexDirection: 'row', backgroundColor: '#2c3e50', paddingBottom: 30, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#34495e' },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  navItemActive: { borderBottomWidth: 3, borderBottomColor: '#27ae60' },
  navText: { color: 'white', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '85%', backgroundColor: '#2c3e50', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 10, position: 'relative' },
  closeButton: { position: 'absolute', top: 15, right: 15, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.1)', width: 35, height: 35, borderRadius: 17.5, justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modalImageContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ecf0f1', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 4, borderColor: '#27ae60' },
  modalImage: { width: 80, height: 80 },
  modalName: { color: 'white', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  modalCategory: { color: '#bdc3c7', fontSize: 14, textTransform: 'uppercase', marginBottom: 15, letterSpacing: 2 },
  statusBadge: { backgroundColor: 'rgba(39, 174, 96, 0.2)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginBottom: 20 },
  statusText: { color: '#2ecc71', fontWeight: 'bold', fontSize: 12 },
  modalScrollArea: { width: '100%' },
  factContainer: { width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 10, marginBottom: 15 },
  factTitle: { color: '#3498db', fontWeight: 'bold', marginBottom: 5 },
  factText: { color: 'white', fontSize: 15, lineHeight: 22 },
  inventoryContainer: { width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', padding: 15, borderRadius: 10 },
  inventoryTitle: { color: '#f39c12', fontWeight: 'bold', marginBottom: 10, fontSize: 16 },
  inventoryItem: { color: 'white', fontSize: 14, marginBottom: 5, marginLeft: 5 },
  primaryButton: { backgroundColor: '#27ae60', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, alignSelf: 'center' },
  primaryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});