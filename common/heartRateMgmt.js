export function getHRColor(rate){
  if(rate<40){
      return "#ed1148";
  }else if(rate<70){
      return "#99eeff";
  }else if(rate<110){
      return "#ffffff";
  }else if(rate<130){
      return "#faf591";
  }else if(rate<145){
      return "#f7c560";
  }else if(rate<160){
      return "#f07d3e";
  }else{
    return "#ed1148";
  }
}
