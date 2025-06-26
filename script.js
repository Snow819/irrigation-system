// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Your Firebase configuration - cleaned up
const firebaseConfig = {
    apiKey: "AIzaSyB3kxjeWnNA7MnK0NxKlxCC9njsc4-dKDM",
    authDomain: "soil-monitor-system.firebaseapp.com",
    databaseURL: "https://soil-monitor-system-default-rtdb.firebaseio.com",
    projectId: "soil-monitor-system",
    storageBucket: "soil-monitor-system.appspot.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// DOM elements
const connectionStatus = document.getElementById('connectionStatus');
const waterLevel = document.getElementById('waterLevel');
const waterStatus = document.getElementById('waterStatus');
const waterLevelBar = document.getElementById('waterLevelBar');
const temperature = document.getElementById('temperature');
const humidity = document.getElementById('humidity');
const relayValue = document.getElementById('relayValue');
const relayStatus = document.getElementById('relayStatus');
const lastUpdate = document.getElementById('lastUpdate');

// Function to update connection status
function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.textContent = '🟢 Connected';
        connectionStatus.className = 'connection-status connected';
    } else {
        connectionStatus.textContent = '🔴 Disconnected';
        connectionStatus.className = 'connection-status disconnected';
    }
}

// Function to calculate water level percentage (0-100%)
function calculateWaterPercentage(value) {
    if (value < 1000) return 0; // Dry
    if (value > 2000) return 100; // Submerged
    // Linear interpolation between 1000 and 2000
    return ((value - 1000) / 1000) * 100;
}

// Function to get status class
function getStatusClass(status) {
    switch(status) {
        case 'DRY': return 'status-dry';
        case 'TOUCHING_WATER': return 'status-touching';
        case 'SUBMERGED': return 'status-submerged';
        case 'TRANSITION': return 'status-transition';
        default: return '';
    }
}

// Function to initialize database listeners
function initializeListeners() {
    // Listen to latest data
    const latestRef = ref(database, 'latest');
    onValue(latestRef, (snapshot) => {
        updateConnectionStatus(true);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // Update water level
            if (data.water_level !== undefined) {
                waterLevel.textContent = data.water_level;
                const percentage = calculateWaterPercentage(data.water_level);
                waterLevelBar.style.width = percentage + '%';
            }
            
            // Update water status
            if (data.water_status) {
                waterStatus.textContent = data.water_status.replace('_', ' ');
                waterStatus.className = 'card-status ' + getStatusClass(data.water_status);
            }
            
            // Update temperature
            if (data.temperature !== undefined) {
                temperature.textContent = data.temperature.toFixed(1) + '°C';
            }
            
            // Update humidity
            if (data.humidity !== undefined) {
                humidity.textContent = data.humidity.toFixed(1) + '%';
            }
            
            // Update relay status
            if (data.relay_state !== undefined) {
                relayValue.textContent = data.relay_state ? 'ON' : 'OFF';
                relayStatus.textContent = data.relay_state ? 'Active' : 'Inactive';
                relayStatus.className = 'card-status ' + (data.relay_state ? 'relay-on' : 'relay-off');
            }
            
            // Update last update time
            if (data.last_update) {
                const updateTime = new Date(parseInt(data.last_update));
                lastUpdate.textContent = 'Last updated: ' + updateTime.toLocaleString();
            }
            
        } else {
            console.log("No data available");
        }
    }, (error) => {
        console.error("Error reading data:", error);
        updateConnectionStatus(false);
    });

    // Handle connection state
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snapshot) => {
        updateConnectionStatus(snapshot.val() === true);
    });
}

// Authentication state listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User authenticated:", user.uid);
        connectionStatus.textContent = '🟢 Authenticated & Connected';
        connectionStatus.className = 'connection-status connected';
        initializeListeners();
    } else {
        console.log("User not authenticated, signing in anonymously...");
        connectionStatus.textContent = '🔄 Authenticating...';
        signInAnonymously(auth).catch((error) => {
            console.error("Authentication failed:", error);
            connectionStatus.textContent = '🔴 Authentication Failed';
            connectionStatus.className = 'connection-status disconnected';
        });
    }
});

console.log("Dashboard initialized and listening for real-time updates...");