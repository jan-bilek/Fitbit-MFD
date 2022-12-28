import * as messaging from "messaging";
import * as util from "../common/utils";
import { geolocation } from "geolocation";
import * as dayStrip from "../common/dayStrip";
import * as alertAssessment from "./AlertAssessment";

var lat = -500;
var lon = -500;

var API_KEY = "";
var ENDPOINT = "https://api.openweathermap.org/data/2.5/weather?" + "lat=" + lat + "&lon=" + lon + "&units=metric&cnt=1";
var UV_ENDPOINT = "https://api.openweathermap.org/data/2.5/uvi?" + "lat=" + lat + "&lon=" + lon;
var ONECALL_ENDPOINT = "https://api.openweathermap.org/data/2.5/onecall?" + "lat=" + lat + "&lon=" + lon + "&exclude=minutely,daily&units=metric&cnt=1";

function refreshPosition(){
  geolocation.getCurrentPosition(function(position) {
   lat = position.coords.latitude;
   lon = position.coords.longitude;
   if(util.debugMode>1) console.log(position.coords.latitude + ", " + position.coords.longitude);
   ENDPOINT = "https://api.openweathermap.org/data/2.5/weather?" + "lat=" + lat + "&lon=" + lon + "&units=metric&cnt=1";
   UV_ENDPOINT = "https://api.openweathermap.org/data/2.5/uvi?" + "lat=" + lat + "&lon=" + lon;
   ONECALL_ENDPOINT = "https://api.openweathermap.org/data/2.5/onecall?" + "lat=" + lat + "&lon=" + lon + "&exclude=minutely,daily&units=metric&cnt=1";
  })
}

refreshPosition();

var requestStatus = {
  currentWx:0,
  uv:0
}

var weather = {
  temperature:0,
  windSpeed:0,
  windDir:getWindDir(0),
  humidity:0,
  humidex:0,
  uv:0,
  
  temperatureMax:-99,
  temperatureMin:99,
  windSpeedMax:0,
  humidityMax:0,
  humidexMax:0,
  uvMax:0,
  
  sunrise:0,
  sunset:0,
  precipitation:[0,0,0,0,0,0,
                 0,0,0,0,0,0,
                 0,0,0,0,0,0,
                 0,0,0,0,0,0],
  alertLevel:[util.enAlertLevels.None, util.enAlertLevels.None, util.enAlertLevels.None],
  alertType:[util.enAlertTypes.None, util.enAlertTypes.None, util.enAlertTypes.None],
  alertText:["-","-","-"],
  alertSubText:["-","-","-"]
}
//var FCST_ENDPOINT = "https://api.openweathermap.org/data/2.5/onecall?" + "lat=" + lat + "&lon=" + lon;


// Fetch the weather from OpenWeather
function queryOpenWeather() {
  
  if(util.specialDebug > 0){
    console.log("# requesting\n");
  }
  //unset request status (0=not received)
  requestStatus.currentWx=0;
  requestStatus.uv=0;
  //resetAlerts();
  
  //refresh geo position
  refreshPosition();
  
  //requesting all weather data
  fetch(ONECALL_ENDPOINT + "&APPID=" + API_KEY)
  .then(function (response) {
      response.json()
      .then(function(data) {
        
        if(util.debugMode>1){
          console.log("\n##### ALL Wx Data #####\n");
          console.log(data);
        }
        
        //setup of daylight time strip
        dayStrip.setupDaytime(data["current"]["sunrise"],data["current"]["sunset"]);
        //update of variables in structure to be passed to device
        weather.temperature = /*38;//*/Math.round(data["current"]["temp"]);
        weather.windSpeed = Math.round(data["current"]["wind_speed"]);
        weather.windDir = getWindDir(data["current"]["wind_deg"]);
        weather.humidity = Math.round(data["current"]["humidity"]);
        weather.humidex = getHumidex(weather.temperature, weather.humidity);
        weather.sunrise = dayStrip.sunrise;
        weather.sunset = dayStrip.sunset;
                
        //UV setup
        weather.uv = Math.round((data["current"]["uvi"]*10.0))/10.0;
        
        //precipitation for dayStrip setup
        PreparePrecipitation(data["hourly"]);
        
        //set max values
        getExtremes(data["hourly"]);
        
        requestStatus.currentWx=1;
        sendWeatherInfo(); //trigger send to check if this was the last awaited response
      });
  })
  .catch(function (err) {
    if(util.debugMode>0) console.log("Error fetching weather: " + err);
    requestStatus.currentWx=-1;
    //sendWeatherInfo(); //trigger send to check if this was the last awaited response
    
  if(util.specialDebug > 0){
    console.log("### error fetching!\n");
  }
  });
  
}

//go through hourly forecast and get extremes
function getExtremes(data){
  for(var i=0; i<24; i++){
    if(data[i]["temp"]>weather.temperatureMax) weather.temperatureMax=data[i]["temp"];
    if(data[i]["temp"]<weather.temperatureMin) weather.temperatureMin=data[i]["temp"];
    if(data[i]["wind_speed"]>weather.windSpeedMax) weather.windSpeedMax=data[i]["wind_speed"];
    if(data[i]["humidity"]>weather.humidityMax) weather.humidityMax=data[i]["humidity"];
    if(getHumidex(data[i]["temp"],data[i]["humidity"])>weather.humidexMax) weather.humidexMax=getHumidex(data[i]["temp"],data[i]["humidity"]);
    if(data[i]["uvi"]>weather.uvMax) weather.uvMax=data[i]["uvi"];
  }
  //round the results as needed
  weather.temperatureMax=Math.round(weather.temperatureMax);
  weather.temperatureMin=Math.round(weather.temperatureMin);
  weather.windSpeedMax=Math.round(weather.windSpeedMax);
  weather.humidityMax=Math.round(weather.humidityMax);
  weather.humidexMax=Math.round(weather.humidexMax);
  weather.uvMax = Math.round((weather.uvMax*10.0))/10.0;
}


//process data from OWMA to intervals for dayStrip
function PreparePrecipitation(data){
  for(var i=0; i<24; i++){

    //hour (today or tomorrow - TODO: this should get configurable in future)
    var d = new Date(data[i]["dt"] * 1000);
    var hour = d.getHours();
    var day = d.getDate();
    var today = new Date(Date.now());
    
    //if the slot is in past, show no data
    //console.log(hour + "<" + today.getHours() + "&&" + day + "==" + today.getDate());
    if(hour < today.getHours() && day == today.getDate()){
      weather.precipitation[hour] = util.PrecipitationTypes.Unknown;
    }else{
      //if there's precipitation indicated in the data, insert it to precipitation table
      if(data[i]["snow"]!=null){
        weather.precipitation[hour] = util.PrecipitationTypes.Snow;
      }else if(data[i]["rain"]!=null){
        weather.precipitation[hour] = util.PrecipitationTypes.Rain;
      }else{
        weather.precipitation[hour] = util.PrecipitationTypes.None;
      }
    }
    //if(util.debugMode>0) console.log(hour + JSON.stringify(data[i]["rain"]));
  }
}

//wxforum.net has my gratitude
function getHumidex(T,H){
  var dewPoint = Math.pow(H/100, 1 / 8 ) * (112 + 0.9 * T) + 0.1 * T - 112;
  var expIndex = 5417.753 * ((1 / 273.16) - (1 / (dewPoint + 273.16)));
  var result = T + 0.5555 * (6.11 * Math.exp(expIndex) - 10);
  if (result < T)
     { result = T;
   }
  return result;
}

function resetAlerts(){
  weather.alertLevel[0]=util.enAlertLevels.None;
  weather.alertLevel[1]=util.enAlertLevels.None;
  weather.alertLevel[2]=util.enAlertLevels.None;
  weather.alertLevel[3]=util.enAlertLevels.None;
  
  weather.alertType[0]=util.enAlertTypes.None;
  weather.alertType[1]=util.enAlertTypes.None;
  weather.alertType[2]=util.enAlertTypes.None;
  weather.alertType[3]=util.enAlertTypes.None;
  
  weather.alertText[0]="";
  weather.alertText[1]="";
  weather.alertText[2]="";
  weather.alertText[3]="";
  
  weather.alertSubText[0]="";
  weather.alertSubText[1]="";
  weather.alertSubText[2]="";
  weather.alertSubText[3]="";
}

function getWindDir(deg){
  if(deg>337.5 || deg<22.5){
    return util.WindDirEnum.North;
  }else if(deg>22.5 && deg<=67.5){
    return util.WindDirEnum.NorthEast;
  }else if(deg>67.5 && deg<=112.5){
    return util.WindDirEnum.East;
  }else if(deg>112.5 && deg<=157.5){
    return util.WindDirEnum.SouthEast;
  }else if(deg>157.5 && deg<=202.5){
    return util.WindDirEnum.South;
  }else if(deg>202.5 && deg<=247.5){
    return util.WindDirEnum.SouthWest;
  }else if(deg>247.5 && deg<=292.5){
    return util.WindDirEnum.West;
  }else if(deg>292.5 && deg<=337.5){
    return util.WindDirEnum.NorthWest;
  }else{
    return util.WindDirEnum.Error;
  }
}

/*messaging.peerSocket.onopen = () => {
  //connection established, send data
  queryOpenWeather();
}

messaging.peerSocket.onerror = (err) => {
  //tbd
}

messaging.peerSocket.onmessage = (evt) => {
  //message received, process the data
  if(evt.data == "NewWx"){
    queryOpenWeather();
  }
}*/


messaging.peerSocket.addEventListener("message", (evt) => {
  if(evt.data == "NewWx"){
    queryOpenWeather();
  }
});


//prioritize alerts and send only if all asynchronous data was received
function sendWeatherInfo(){
  if(util.specialDebug > 0){
    console.log("# sending initiated\n");
  }
     
     
  //no need to build in a sync protection with unique IDs. The delay between updates should always be large enough and, 
  //in fact, even if the sync would not be kept, the received data should be quite usable and we don't need to delay the update
  //set up the alerts
  resetAlerts();
  
  /*TMP Alerts!
  weather.uv = 2.1;
  weather.windSpeed = 23;
  weather.temperature = -22;
  */
  
  alertAssessment.ProcessAlerts(weather);
  //and finally send the message
  if(util.debugMode>0){
    console.log("\n##### SENT DATA #####\n");
    console.log(JSON.stringify(weather));
  }
  sendMessage(weather);
  if(util.specialDebug > 0){
    console.log("# sent, t=" + weather.temperature + "\n");
  }
}

function sendMessage(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send the data to peer as a message
    messaging.peerSocket.send(data);
  }
}
