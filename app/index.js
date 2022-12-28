import clock from "clock";
import document from "document";
import { preferences } from "user-settings";
import * as util from "../common/utils";
import { me as appbit } from "appbit";
import { today } from "user-activity";
import * as messaging from "messaging";
import { HeartRateSensor } from "heart-rate";
import * as hr from "../common/heartRateMgmt";
import * as battery from "../common/batteryWidget";
import * as dayStrip from "../common/dayStrip";
import * as ab from "../common/AlertsBar";

// Create a new instance of the HeartRateSensor object
var hrm = new HeartRateSensor();
var lastWxUpdate = 0;
var wxUpdateFreqMins = 20;
var h = 0;
var totalM = 0;
var dt=0;
var hours=0;

// Update the clock every minute
clock.granularity = "minutes";

// Get a handle on the <text> element
const lblTime = document.getElementById("lblTime");
const lblDate = document.getElementById("lblDate");
const lblTemperature = document.getElementById("lblTemperature");
const lblHR = document.getElementById("lblHR");
const imgHR = document.getElementById("imgHR");
const lblSteps = document.getElementById("lblSteps");
const lblAM = document.getElementById("lblAM");
const lblBattery = document.getElementById("lblBattery");
const rectNow = document.getElementById("dsNow");
const gNow = document.getElementById("gNow");
const dsSunrise = document.getElementById("dsSunrise");
const gSunrise = document.getElementById("gSunrise");
const dsSunset = document.getElementById("dsSunset");
const gSunset = document.getElementById("gSunset");
const lblAlerts = [document.getElementById("lblAlert1"), document.getElementById("lblAlert2"), document.getElementById("lblAlert3")];
const lblAlertsNow = [document.getElementById("lblAlert1_now"), document.getElementById("lblAlert2_now"), document.getElementById("lblAlert3_now")];

//weather rectangles
const rectW = [document.getElementById("dsW0"),document.getElementById("dsW1"),document.getElementById("dsW2"),document.getElementById("dsW3"),
               document.getElementById("dsW4"),document.getElementById("dsW5"),document.getElementById("dsW6"),document.getElementById("dsW7"),
               document.getElementById("dsW8"),document.getElementById("dsW9"),document.getElementById("dsW10"),document.getElementById("dsW11"),
               document.getElementById("dsW12"),document.getElementById("dsW13"),document.getElementById("dsW14"),document.getElementById("dsW15"),
               document.getElementById("dsW16"),document.getElementById("dsW17"),document.getElementById("dsW18"),document.getElementById("dsW19"),
               document.getElementById("dsW20"),document.getElementById("dsW21"),document.getElementById("dsW22"),document.getElementById("dsW23")];

function refreshWxDisplay()
{
  dayStrip.Update(totalM, gNow);
  battery.Update(lblBattery);
  //update stats
  lblSteps.text = today.adjusted.steps.toLocaleString('en').replace(',', ' ');
  //lblAM.text = today.adjusted.activeZoneMinutes.total + " m";
  lblAM.text = Math.floor(lastWxUpdate/60) + ":" + lastWxUpdate%60;
}

// Update the <text> element every tick with the current time
clock.ontick = (evt) => {
 
  //update time
  dt = evt.date;
  hours = dt.getHours();
  h = hours;
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = util.zeroPad(hours);
  }
  let mins = util.zeroPad(dt.getMinutes());
  totalM = h*60 + dt.getMinutes();
  lblTime.text = `${hours}:${mins}`;
  let day = dt.getDate();
  let month = dt.getMonth()+1;
  lblDate.text = `${day}.${month}.`;  
  
  refreshWxDisplay();
  
  //console.log(hours*60+mins-lastWxUpdate + " > " + wxUpdateFreqMins + " = " + (lastWxUpdate>wxUpdateFreqMins) + "\n");
  //console.log("Diff: " + (hours*60+mins - lastWxUpdate));
  /*if(totalM - lastWxUpdate> wxUpdateFreqMins){
    if(util.debugMode>0){
      console.log("\n### UPDATE REQUEST CONDITION ###\n");
      console.log(totalM-lastWxUpdate + " > " + wxUpdateFreqMins + " = " + (lastWxUpdate>wxUpdateFreqMins));
      console.log("\n### END ###\n");
      
    }
    //console.log("\n### UPDATE REQUESTED:###\n");
    requestWeatherUpdate();
  }*/
}


function requestWeatherUpdate(){
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send the data to peer as a message
    messaging.peerSocket.send("NewWx");
  }
}

// onOpen listener
function OpenMsg(){
  // Ready to send or receive messages
  requestWeatherUpdate();
}

// onMessage listener
function processWeatherData(evt) {
  // on companion message receipt
  lblTemperature.text = evt.data.temperature + "°C";
  ab.Set(evt.data);
  /*  
  evt.data.precipitation[15]=util.PrecipitationTypes.Rain;
  evt.data.precipitation[22]=util.PrecipitationTypes.Rain;
  */
  dayStrip.SetupStrip(evt.data.sunrise, evt.data.sunset, gSunrise, gSunset, dsSunrise, dsSunset, totalM);
  dayStrip.SetupPrecipitation(evt.data.precipitation, rectW, h);
  dayStrip.Update(totalM,gNow);
  lastWxUpdate = dayStrip.now;
  refreshWxDisplay();
  //console.log("\n*** UPDATE RECEIVED ***\n");
  //console.log("###TIME###" + lastWxUpdate);
}

hrm.onreading = function() {
  // Peek the current sensor values
  lblHR.text = hrm.heartRate;
  var color = hr.getHRColor(hrm.heartRate);
  lblHR.style.fill = color;
  imgHR.style.fill = color;
}


//add communication listeners
messaging.peerSocket.addEventListener("open", (evt) => {
  OpenMsg();
});

messaging.peerSocket.addEventListener("message", (evt) => {
  if (evt.data) {
    processWeatherData(evt);
  }else{
    if(util.specialDebug>0){
      console.log("### No Data Received in newWx Event! ###\n");
    }
  }
});

setInterval(requestWeatherUpdate, wxUpdateFreqMins * 1000 * 60);

// Begin monitoring the sensor
hrm.start();
