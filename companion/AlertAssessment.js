import * as util from "../common/utils"; //alert enums in there

/*
// alert enums copied for reference

//alerts enumeration, sorted by alert priority (lowest to highest)
export var enAlertTypes = {
  None:0,
  Humidity:1,
  Pressure:2,
  Freeze:3,
  AirQuality:4,
  UV:5,
  Temperature:6,
  Wind:7,
  Storm:8
}

//alerting levels, sorted by level priority (lowest to highest)
export var enAlertLevels = {
  None:0,
  Informative:1,
  Low:2,
  Moderate:3,
  High:4,
  Severe:5,
  Extreme:6
}
*/


//insert alert into one of three slots if there are no more severe alerts present
//alert is array of 4 items: type, level and two text fields
//alerts are kept sorted (highest first)
//  param alert [0]=alert type, [1]=alert severity, [2]=primary text, [3]=secondary text
//  param weather defined in /companion/index.js
function EnlistAlert(alert, weather){
  var i=0;
  for(i=0; i<util.alertsCount; i++){
    if(alert[1] > weather.alertLevel[i]){
      EnqueueAlert(i, alert, weather);
      break;
    }else if(alert[1] == weather.alertLevel[i] && alert[0] > weather.alertType[i]){
      EnqueueAlert(i, alert, weather);
      break;
    }
  }
}

function EnqueueAlert(where, alert, weather){
  var i=0;
  //shift alerts, from last to 'where-1'
  for(i=util.alertsCount-1; i>where; i--){
    weather.alertLevel[i] = weather.alertLevel[i-1];
    weather.alertType[i] = weather.alertType[i-1];
    weather.alertText[i] = weather.alertText[i-1];
    weather.alertSubText[i] = weather.alertSubText[i-1];
  }  
  //add the alert to 'where'
  weather.alertLevel[where] = alert[1];
  weather.alertType[where] = alert[0];
  weather.alertText[where] = alert[2];
  weather.alertSubText[where] = alert[3];
}

export function ProcessAlerts(weather){
  EvalUV(weather);
  EvalHumidex(weather);
  EvalWind(weather);
  //enlist 3 informative messages in case no alert was generated so the alerting area is populated
  if(weather.humidexMax<30) EnlistAlert([util.enAlertTypes.Humidity, util.enAlertLevels.Informative,weather.humidityMax,weather.humidity], weather);
  if(weather.windSpeedMax<5) EnlistAlert([util.enAlertTypes.Wind, util.enAlertLevels.Informative,weather.windSpeedMax,weather.windSpeed], weather);
  if(weather.uvMax<2.0) EnlistAlert([util.enAlertTypes.UV, util.enAlertLevels.Informative,weather.uvMax,weather.uv], weather);
  //test, to be removed after real alert assessment is implemented
  //weather.alertText[0] = weather.uv;
  
}

function EvalWind(weather){
  //ranges as defined by NWS (converted to m/s): 11-17, 17-24, 24-33, 33-49, 49-x
  //ranges adjusted to get much lower indications for awareness (in m/s): 5-11, 11-17, 17-24, 24-33, 33-x
  var result=[util.enAlertTypes.None, util.enAlertLevels.None, weather.windSpeedMax, weather.windSpeed];
  if(weather.windSpeedMax<5){ // no advisory
    //nothing
  }else if(weather.windSpeedMax>=5 && weather.windSpeedMax<11){ // noticeable wind
    result=[util.enAlertTypes.Wind, util.enAlertLevels.Low, weather.windSpeedMax, weather.windSpeed];
  }else if(weather.windSpeedMax>=11 && weather.windSpeedMax<17){ // wind advisory
    result=[util.enAlertTypes.Wind, util.enAlertLevels.Moderate, weather.windSpeedMax, weather.windSpeed];
  }else if(weather.windSpeedMax>=17 && weather.windSpeedMax<24){ // high wind/tropical storm warnming
    result=[util.enAlertTypes.Wind, util.enAlertLevels.High, weather.windSpeedMax, weather.windSpeed];
  }else if(weather.windSpeedMax>=24 && weather.windSpeedMax<33){ // high wind/severe tropical storm warning
    result=[util.enAlertTypes.Wind, util.enAlertLevels.Severe, weather.windSpeedMax, weather.windSpeed];
  }else if(weather.windSpeedMax>=33){ // high/extreme wind/hurricane warning
    result=[util.enAlertTypes.Wind, util.enAlertLevels.Extreme, weather.windSpeedMax, weather.windSpeed];
  }
  EnlistAlert(result, weather);
}

//humidex-based calculation
function EvalHumidex(weather){
  var resultFreeze=[util.enAlertTypes.None, util.enAlertLevels.None, weather.humidity,  weather.temperature];
  var resultHumidex=[util.enAlertTypes.None, util.enAlertLevels.None, weather.humidity,  weather.temperature];
  var resultHeat=[util.enAlertTypes.None, util.enAlertLevels.None, weather.humidity,  weather.temperature];
  //if it's freezing, only freeze alert is to be generated
  if(weather.temperatureMin<=4){
    resultFreeze=[util.enAlertTypes.Freeze, util.enAlertLevels.Informative, weather.temperatureMin,  weather.temperature];
    if(weather.temperatureMin>-2 && weather.temperatureMin<=0){ // Freeze
      resultFreeze=[util.enAlertTypes.Freeze, util.enAlertLevels.Low, weather.temperatureMin,  weather.temperature];
    }else if(weather.temperatureMin>=-15 && weather.temperatureMin<-2){ // Hard freeze
      resultFreeze=[util.enAlertTypes.Freeze, util.enAlertLevels.Moderate, weather.temperatureMin,  weather.temperature];
    }else if(weather.temperatureMin>=-22 && weather.temperatureMin<-15){ // Intense freeze
      resultFreeze=[util.enAlertTypes.Freeze, util.enAlertLevels.High, weather.temperatureMin,  weather.temperature];
    }else if(weather.temperatureMin>=-38 && weather.temperatureMin<-22){ // dangerous freeze
      resultFreeze=[util.enAlertTypes.Freeze, util.enAlertLevels.Severe, weather.temperatureMin,  weather.temperature];
    }else if(weather.temperatureMin<-38){ // extreme freeze
      resultFreeze=[util.enAlertTypes.Freeze, util.enAlertLevels.Extreme, weather.temperatureMin,  weather.temperature];
    }
    EnlistAlert(resultFreeze, weather);
  }else{//if above zero, humidity and/or temperature alerts can be generated
    if(weather.humidexMax<30){ // no discomfort
      //nothing
    }else if(weather.humidexMax>=30 && weather.humidexMax<35){ // noticeable discomfort
      resultHumidex=[util.enAlertTypes.Humidity, util.enAlertLevels.Informative, weather.humidityMax, weather.humidity];
    }else if(weather.humidexMax>=35 && weather.humidexMax<40){ // evident discomfort
      resultHumidex=[util.enAlertTypes.Humidity, util.enAlertLevels.Low, weather.humidityMax, weather.humidity];
    }else if(weather.humidexMax>=40 && weather.humidexMax<45){ // intense discomfort
      resultHumidex=[util.enAlertTypes.Humidity, util.enAlertLevels.Moderate, weather.humidityMax, weather.humidity];
    }else if(weather.humidexMax>=45 && weather.humidexMax<54){ // dangerous discomfort
      resultHumidex=[util.enAlertTypes.Humidity, util.enAlertLevels.High, weather.humidityMax, weather.humidity];
    }else if(weather.humidexMax>=54){ // heat stroke probable
      resultHumidex=[util.enAlertTypes.Humidity, util.enAlertLevels.Severe, weather.humidityMax, weather.humidity];
    }   
    EnlistAlert(resultHumidex, weather);
    
    //TODO: high temperature alert 26,31,36,40
    if(weather.temperatureMax>=26 && weather.temperatureMax<29){
      resultHeat=[util.enAlertTypes.Temperature, util.enAlertLevels.Low, weather.temperatureMax,  weather.temperature];
    }else if(weather.temperatureMax>=29 && weather.temperatureMax<34){ 
      resultHeat=[util.enAlertTypes.Temperature, util.enAlertLevels.Moderate, weather.temperatureMax,  weather.temperature];
    }else if(weather.temperatureMax>=34 && weather.temperatureMax<38){
      resultHeat=[util.enAlertTypes.Temperature, util.enAlertLevels.High, weather.temperatureMax,  weather.temperature];
    }else if(weather.temperatureMax>=38 && weather.temperatureMax<45){
      resultHeat=[util.enAlertTypes.Temperature, util.enAlertLevels.Severe, weather.temperatureMax,  weather.temperature];
    }else if(weather.temperatureMax>=45){
      resultHeat=[util.enAlertTypes.Temperature, util.enAlertLevels.Extreme, weather.temperatureMax,  weather.temperature];
    }
    EnlistAlert(resultHeat, weather);
  }
}

//standard table values used, no changes in assessment expected on regular basis
//UV index guides do not explain fractions, rounding principle assumed
function EvalUV(weather){
  //return value: alert ID
  var result=[util.enAlertTypes.None, util.enAlertLevels.None,weather.uvMax,weather.uv];
  //low risk not reported
  if(weather.uvMax>=2.0 && weather.uvMax<2.5){ //low risk
    result=[util.enAlertTypes.UV, util.enAlertLevels.Low,weather.uvMax,weather.uv];
  }else if(weather.uvMax>=2.5 && weather.uvMax<5.5){ //moderate risk
    result=[util.enAlertTypes.UV, util.enAlertLevels.Moderate,weather.uvMax,weather.uv];
  }else if(weather.uvMax>=5.5 && weather.uvMax<7.5){ //high risk
    result=[util.enAlertTypes.UV, util.enAlertLevels.High,weather.uvMax,weather.uv];
  }else if(weather.uvMax>=7.5 && weather.uvMax<10.5){ //severe risk
    result=[util.enAlertTypes.UV, util.enAlertLevels.Severe,weather.uvMax,weather.uv];
  }else if(weather.uvMax>=10.5){ //extreme risk
    result=[util.enAlertTypes.UV, util.enAlertLevels.Extreme,weather.uvMax,weather.uv];
  }
  EnlistAlert(result, weather);
}