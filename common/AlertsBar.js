import * as util from "../common/utils";
import * as Alert from "../common/Alert";

import document from "document";

//var activeAlerts=0; //how many alerts use up the notification space (rest is populated by measurements)
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

const lblAlerts = [document.getElementById("lblAlert1"), document.getElementById("lblAlert2"), document.getElementById("lblAlert3")];
const lblAlertsNow = [document.getElementById("lblAlert1_now"), document.getElementById("lblAlert2_now"), document.getElementById("lblAlert3_now")];
const imgAlerts = [document.getElementById("imgAlert1"), document.getElementById("imgAlert2"), document.getElementById("imgAlert3")];
const icons = ["", "symbols/humidity_8bit.png", "", "symbols/frost_8bit.png", "", "symbols/sun_8bit.png", "symbols/temperature_8bit.png", "symbols/wind_8bit.png", ""];
const imgClasses = ["imgAlertNone", "imgAlertInformative", "imgAlertLow", "imgAlertModerate", "imgAlertHigh", "imgAlertSevere", "imgAlertExtreme"];
const lblClasses = ["lblAlertNone", "lblAlertInformative", "lblAlertLow", "lblAlertModerate", "lblAlertHigh", "lblAlertSevere", "lblAlertExtreme"];

export function Set(weather){
  var i=0;  
  for(i=0; i<util.alertsCount; i++){
    //console.log("DEBUG: " + i + ": "+ classes[weather.alertLevel[i]]);
    imgAlerts[i].href=icons[weather.alertType[i]];
    imgAlerts[i].class=imgClasses[weather.alertLevel[i]];
    lblAlerts[i].class=lblClasses[weather.alertLevel[i]];
    lblAlerts[i].text=weather.alertText[i];
    lblAlertsNow[i].text=weather.alertSubText[i];
  }
}