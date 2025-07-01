// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const clearBtn = document.getElementById('clear-btn');
const locationBtn = document.getElementById('location-btn');
const toggleUnitBtn = document.getElementById('toggle-unit');
const toggleViewBtn = document.getElementById('toggle-view');
const loadingIndicator = document.querySelector('.loading-indicator');
const errorMessage = document.querySelector('.error-message');
const weatherDisplay = document.querySelector('.weather-display');

// Current weather elements
const currentWeatherIcon = document.querySelector('.current .weather-icon i');
const currentTempValue = document.querySelector('.current .temp-value');
const currentCityName = document.querySelector('.current .city-name');
const currentWeatherDesc = document.querySelector('.current .weather-desc');
const currentHumidity = document.querySelector('.current .humidity');
const currentWind = document.querySelector('.current .wind');
const currentClouds = document.querySelector('.current .clouds');
const currentPressure = document.querySelector('.current .pressure');
const currentDateTime = document.querySelector('.current .date-time');

// Forecast container
const forecastContainer = document.querySelector('.forecast-container');

// App state
let isCelsius = true;
let isListView = true;
let weatherData = null;

// Hardcoded API key (for development only)
const API_KEY = '';

// Weather icon mapping
const weatherIconMap = {
    '01d': 'wi-day-sunny',
    '01n': 'wi-night-clear',
    '02d': 'wi-day-cloudy',
    '02n': 'wi-night-alt-cloudy',
    '03d': 'wi-cloud',
    '03n': 'wi-cloud',
    '04d': 'wi-cloudy',
    '04n': 'wi-cloudy',
    '09d': 'wi-rain',
    '09n': 'wi-rain',
    '10d': 'wi-day-rain',
    '10n': 'wi-night-alt-rain',
    '11d': 'wi-thunderstorm',
    '11n': 'wi-thunderstorm',
    '13d': 'wi-snow',
    '13n': 'wi-snow',
    '50d': 'wi-fog',
    '50n': 'wi-fog'
};

// Initialize the app
function init() {
    // Load last searched city if exists
    const lastCity = localStorage.getItem('lastSearchedCity');
    if (lastCity) {
        cityInput.value = lastCity;
    }
    
    // Load unit preference
    const savedUnit = localStorage.getItem('temperatureUnit');
    if (savedUnit === 'fahrenheit') {
        isCelsius = false;
        toggleUnitBtn.textContent = '°C';
    }
    
    // Load view preference
    const savedView = localStorage.getItem('forecastView');
    if (savedView === 'grid') {
        isListView = false;
        toggleViewMode();
    }
    
    // Set up event listeners
    searchBtn.addEventListener('click', fetchWeather);
    clearBtn.addEventListener('click', clearWeather);
    locationBtn.addEventListener('click', getLocationWeather);
    toggleUnitBtn.addEventListener('click', toggleTemperatureUnit);
    toggleViewBtn.addEventListener('click', toggleViewMode);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchWeather();
    });
}

// Fetch weather data
async function fetchWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    errorMessage.style.display = 'none';
    weatherDisplay.style.display = 'none';
    
    try {
        // Save city to localStorage
        localStorage.setItem('lastSearchedCity', city);
        
        // Fetch current weather
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
        const currentResponse = await fetch(currentWeatherUrl);
        
        if (!currentResponse.ok) {
            throw new Error(`Failed to fetch current weather: ${await currentResponse.text()}`);
        }
        
        const currentData = await currentResponse.json();
        
        // Fetch 5-day forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;
        const forecastResponse = await fetch(forecastUrl);
        
        if (!forecastResponse.ok) {
            throw new Error(`Failed to fetch forecast: ${await forecastResponse.text()}`);
        }
        
        const forecastData = await forecastResponse.json();
        
        // Save data to state
        weatherData = {
            current: currentData,
            forecast: forecastData
        };
        
        // Display the data
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        
        // Hide loading indicator and show weather
        loadingIndicator.style.display = 'none';
        weatherDisplay.style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(error.message || 'Failed to fetch weather data. Please check the city name.');
        loadingIndicator.style.display = 'none';
    }
}

// Get weather by current location
function getLocationWeather() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }
    
    loadingIndicator.style.display = 'flex';
    errorMessage.style.display = 'none';
    weatherDisplay.style.display = 'none';
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                // Fetch current weather by coordinates
                const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;
                const currentResponse = await fetch(currentWeatherUrl);
                
                if (!currentResponse.ok) {
                    throw new Error(`Failed to fetch current weather: ${await currentResponse.text()}`);
                }
                
                const currentData = await currentResponse.json();
                
                // Fetch forecast by coordinates
                const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;
                const forecastResponse = await fetch(forecastUrl);
                
                if (!forecastResponse.ok) {
                    throw new Error(`Failed to fetch forecast: ${await forecastResponse.text()}`);
                }
                
                const forecastData = await forecastResponse.json();
                
                // Update city input
                cityInput.value = currentData.name;
                localStorage.setItem('lastSearchedCity', currentData.name);
                
                // Save data to state
                weatherData = {
                    current: currentData,
                    forecast: forecastData
                };
                
                // Display the data
                displayCurrentWeather(currentData);
                displayForecast(forecastData);
                
                // Hide loading indicator and show weather
                loadingIndicator.style.display = 'none';
                weatherDisplay.style.display = 'block';
                
            } catch (error) {
                console.error('Error fetching weather data:', error);
                showError(error.message || 'Failed to fetch weather data.');
                loadingIndicator.style.display = 'none';
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            showError('Unable to retrieve your location. Please enter a city manually.');
            loadingIndicator.style.display = 'none';
        }
    );
}

// Display current weather
function displayCurrentWeather(data) {
    const { name, main, weather, wind, clouds, dt } = data;
    const iconCode = weather[0].icon;
    
    // Set weather icon
    currentWeatherIcon.className = `wi ${weatherIconMap[iconCode] || 'wi-day-sunny'}`;
    
    // Set temperature based on current unit
    const temp = isCelsius ? Math.round(main.temp) : Math.round((main.temp * 9/5) + 32);
    currentTempValue.textContent = temp;
    
    // Set other values
    currentCityName.textContent = name;
    currentWeatherDesc.textContent = weather[0].description;
    currentHumidity.textContent = `${main.humidity}%`;
    currentWind.textContent = `${Math.round(wind.speed * 3.6)} km/h`; // Convert m/s to km/h
    currentClouds.textContent = `${clouds.all}%`;
    currentPressure.textContent = `${main.pressure} hPa`;
    
    // Format date and time
    const date = new Date(dt * 1000);
    currentDateTime.textContent = `Last updated: ${formatDate(date)}`;
}

// Display forecast
function displayForecast(data) {
    // Clear previous forecast
    forecastContainer.innerHTML = '';
    
    // Group forecasts by day
    const dailyForecasts = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toDateString();
        
        if (!dailyForecasts[dateStr]) {
            dailyForecasts[dateStr] = [];
        }
        
        dailyForecasts[dateStr].push(item);
    });
    
    // Get the next 5 days (skip today)
    const forecastDates = Object.keys(dailyForecasts).slice(1, 6);
    
    forecastDates.forEach(dateStr => {
        const dayForecasts = dailyForecasts[dateStr];
        const date = new Date(dateStr);
        
        // Calculate average temp for the day
        const avgTemp = Math.round(
            dayForecasts.reduce((sum, item) => sum + item.main.temp, 0) / dayForecasts.length
        );
        
        // Get most common weather condition
        const weatherCondition = getMostCommonWeather(dayForecasts);
        const iconCode = weatherCondition.icon;
        
        // Create forecast card
        const forecastCard = document.createElement('div');
        forecastCard.className = `forecast-card ${isListView ? '' : 'grid-view'}`;
        
        forecastCard.innerHTML = `
            <div class="forecast-date">${formatDate(date, true)}</div>
            <div class="forecast-icon"><i class="wi ${weatherIconMap[iconCode] || 'wi-day-sunny'}"></i></div>
            <div class="forecast-temp">${isCelsius ? Math.round(avgTemp) : Math.round((avgTemp * 9/5) + 32)}°${isCelsius ? 'C' : 'F'}</div>
            <div class="forecast-desc">${weatherCondition.description}</div>
            <div class="forecast-details">
                <span><i class="fas fa-tint"></i> ${Math.round(dayForecasts[0].main.humidity)}%</span>
                <span><i class="fas fa-wind"></i> ${Math.round(dayForecasts[0].wind.speed * 3.6)} km/h</span>
            </div>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}

// Get most common weather condition from forecasts
function getMostCommonWeather(forecasts) {
    const weatherCounts = {};
    
    forecasts.forEach(forecast => {
        const weather = forecast.weather[0];
        const key = `${weather.id}_${weather.main}`;
        
        if (!weatherCounts[key]) {
            weatherCounts[key] = {
                count: 0,
                weather: weather
            };
        }
        
        weatherCounts[key].count++;
    });
    
    let mostCommon = null;
    let maxCount = 0;
    
    Object.values(weatherCounts).forEach(item => {
        if (item.count > maxCount) {
            mostCommon = item.weather;
            maxCount = item.count;
        }
    });
    
    return mostCommon || forecasts[0].weather[0];
}

// Toggle temperature unit between Celsius and Fahrenheit
function toggleTemperatureUnit() {
    isCelsius = !isCelsius;
    toggleUnitBtn.textContent = isCelsius ? '°F' : '°C';
    localStorage.setItem('temperatureUnit', isCelsius ? 'celsius' : 'fahrenheit');
    
    if (weatherData) {
        displayCurrentWeather(weatherData.current);
        displayForecast(weatherData.forecast);
    }
}

// Toggle forecast view between list and grid
function toggleViewMode() {
    isListView = !isListView;
    toggleViewBtn.innerHTML = isListView ? '<i class="fas fa-th"></i> Grid View' : '<i class="fas fa-list"></i> List View';
    localStorage.setItem('forecastView', isListView ? 'list' : 'grid');
    
    if (weatherData) {
        displayForecast(weatherData.forecast);
    }
}

// Format date for display
function formatDate(date, short = false) {
    const options = short 
        ? { weekday: 'short', month: 'short', day: 'numeric' }
        : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    
    return date.toLocaleDateString('en-US', options);
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    loadingIndicator.style.display = 'none';
    weatherDisplay.style.display = 'none';
}

// Show success message (temporary)
function showSuccess(message) {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.textContent = message;
    
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.style.opacity = '0';
        successMsg.style.transition = 'opacity 0.5s ease';
        setTimeout(() => successMsg.remove(), 500);
    }, 3000);
}

// Clear weather display
function clearWeather() {
    cityInput.value = '';
    weatherDisplay.style.display = 'none';
    errorMessage.style.display = 'none';
    localStorage.removeItem('lastSearchedCity');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
