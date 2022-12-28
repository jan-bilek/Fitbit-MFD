import { battery } from "power";
import { charger } from "power";


export function Update(lblBattery){
  lblBattery.text = Math.floor(battery.chargeLevel) ;
  //console.log("The charger " + (charger.connected ? "is" : "is not") + " connected");
}