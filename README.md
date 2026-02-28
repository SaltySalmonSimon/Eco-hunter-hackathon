# EcoHunter 🦖

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

## 📖 Project Overview
**EcoHunter** is a gamified, AI-powered mobile application designed to reconnect people with local biodiversity. By transforming the outdoors into a real-world "Eco-Dex," users are encouraged to explore their environment, photograph local wildlife, and dynamically learn about the ecosystems around them. 

### ✨ Key Features
* 📸 **AI Species Identification:** Uses Google's Gemini 2.5 Flash multimodal AI to analyze photos and identify species in real-time.
* 📖 **Infinite Dynamic Eco-Dex:** A local database of 50 base animals, plus the ability for the AI to dynamically generate brand new cards for rare, undocumented species.
* 🏆 **Global Leaderboard:** Real-time scoring system powered by Firebase, ranking players based on their discoveries.
* 🎯 **Daily Bounties:** Auto-generated daily missions that challenge users to find specific wildlife for bonus points.
* 💡 **Educational Micro-Learning:** Generates dynamic, contextual ecological fun facts for every successful capture.

---

## 🌍 Problem-Solution Alignment & SDGs
* **The Problem:** In an increasingly urbanized world, there is a growing disconnect between the general public and local wildlife. Traditional conservation education often fails to engage younger demographics.
* **The Solution:** WildLens tackles this by turning nature exploration into a multiplayer game, rewarding users with points and unique knowledge for exploring their environment.

**Supported UN Sustainable Development Goals:**
* **SDG 15 (Life on Land):** Fosters a grassroots appreciation for biodiversity and habitat preservation.
* **SDG 4 (Quality Education):** Provides on-demand, AI-driven educational facts in the field.

---

## 🛠️ Setup & Installation Instructions

To run this project locally on your machine, follow these steps:

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your machine.
* A mobile device with the **Expo Go** app installed (available on iOS and Android), or a local emulator.
* A [Google Gemini API Key](https://aistudio.google.com/).
* A Firebase Project with Firestore and Authentication (Email/Password) enabled.

### 1. Clone the Repository
```bash
git clone https://github.com/SaltySalmonSimon/Eco-hunter-hackathon.git
cd YOUR-REPO-NAME
```
### 2. Install Dependencies
npm install

### 3. Configure Environment Variables
1. Create a file named exactly .env.
2. Add the following lines, replacing the placeholder text with your actual keys:
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

### 4. Run The Application
npx expo start -c
Public Wi-Fi network: You may need to run the tunnel command instead: npx expo start -c --tunnel.
To test on a physical phone: Scan the QR code shown in your terminal using the Expo Go app.
