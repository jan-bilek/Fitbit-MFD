export const debugMode=0;
export const specialDebug = 1;

export const alertsCount=3;

// Add zero in front of numbers < 10
export function zeroPad(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

export var PrecipitationTypes = {
  Unknown:0,
  None:1,
  Mist:2,
  Rain:3,
  Storm:4,
  Hail:5,
  Snow:6,
  Other:7
}

export var WindDirEnum = {
  Error:0,
  North:1,
  NorthEast:2,
  East:3,
  SouthEast:4,
  South:5,
  SouthWest:6,
  West:7,
  NorthWest:8
}

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