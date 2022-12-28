import * as util from "../common/utils";

var sr = new Date(); 
var ss = new Date(); 
export var sunrise=0; 
export var sunset=0;

const startY=0;
const lengthY=300;
const invStart=startY+lengthY;
var pixPerMin = lengthY/1440;
export var now;

export const outlook3h = 38;

//##########################################################################
//App Functions
//##########################################################################


export function SetupStrip(inSr, inSs, gSunrise, gSunset, dsSunrise, dsSunset, tm){
  sunrise = inSr;
  sunset = inSs;
  
  if(sunrise-tm <= -720 || (sunrise-tm > 0 && sunrise - tm <= 720)){
    dsSunrise.style.display = "inline";
  }else{
    dsSunrise.style.display = "none";
  }
  
  
  if(sunset-tm <= -720 || (sunset-tm > 0 && sunset - tm <= 720)){
    dsSunset.style.display = "inline";
  }else{
    dsSunset.style.display = "none";
  }
  
  gSunrise.groupTransform.rotate.angle = sunrise/2;
  gSunset.groupTransform.rotate.angle = sunset/2;
}

export function SetupPrecipitation(data, rectW, h){
  for(var i=h; i<h+12; i++){
    var iG = i%12;
    var iD = i%24;
    if(data[iD]==util.PrecipitationTypes.None){
      rectW[iG].style.display = "none";
      /*rectW[i].style.display = "inline";
      rectW[i].style.fill="#00b3ff";*/
    }else{
      rectW[iG].style.display = "inline";
      switch (data[iD]){
        case util.PrecipitationTypes.Rain:
            rectW[iG].style.fill="#00b3ff";
            break;
        case util.PrecipitationTypes.Snow:
           rectW[iG].style.fill="#ffffff";
           break;
        case util.PrecipitationTypes.Unknown:
           rectW[iG].style.fill="#000000";
           break;
        default:
          break;
      }
    }
  }
}

export function Update(tm, gNow){
  now=tm;
  gNow.groupTransform.rotate.angle = tm/2;
}

//##########################################################################
//Companion Functions
//##########################################################################

export function setupDaytime(unixSR, unixSS){
  sr.setTime(unixSR*1000);
  ss.setTime(unixSS*1000);
  sunrise = sr.getHours()*60 + sr.getMinutes();
  sunset = ss.getHours()*60 + ss.getMinutes();
}