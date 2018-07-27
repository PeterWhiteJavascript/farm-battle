//This file includes functions that are used throughout the game
function calculateCropValue(crop){
    return (crop.cost + (crop.days + crop.sun / 2 + crop.water / 4) / crop.rank * 100) / (crop.regrow ? 2.5 : 1);
}
function getClassCost(charClass){
    return 150 / charClass.rank;
}