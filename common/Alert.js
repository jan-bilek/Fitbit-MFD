
//single alert with all properties
export class Alert{
  type=enAlertTypes.None; //alert type
  level=enAlertLevels.None; //alert severity
  mainText=""; //big text (max 3 chars)
  sideText=""; //supplemental text (max 5 chars)

  setAlert(type,level, mainText, sideText){
    this.type = type;
    this.level = level;
    this.mainText = mainText;
    this.sideText = sideText;
  }
  
}