$(function() {
    
var Q = window.Q = Quintus({audioSupported: ['mp3','ogg','wav']}) 
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX, Audio, Game, Objects")
        .setup("quintus",{development:true, width:$("#content-container").width(), height:$("#content-container").height()})
        .touch().controls(true)
        .enableSound();
Q.input.drawButtons = function(){};
Q.setImageSmoothing(false);

//Since this is a top-down game, there's no gravity
Q.gravityY=0;
//The width of the tiles
Q.tileW = 32;
//The height of the tiles
Q.tileH = 32;
//Astar functions used for pathfinding
Q.astar = astar;
//A necessary component of Astar
Q.Graph = Graph;

Q.progressCallback = function(loaded,total){
    var progress = Math.floor(loaded/total*100);
    var str = progress+"%";
    $("#bar-top").width(str);
    $("#bar-text").text(str);
    if(loaded===total){
        $("#loading-bar").hide();
        //Remove this until we get a bg.
        $("#background-container").remove();
    }
};
//Load all of the assets that we need. We should probably load bgm only when necessary as it takes several seconds per file.
var toLoad = [];
var fileKeys = Object.keys(GDATA);
//TEMP: don't load music on every page refresh. Music also won't be loaded unless enabled, so if it's set to off, then loading times while testing will be great.
delete GDATA["bgm"];
for(var i=0;i<fileKeys.length;i++){
    var files = GDATA[fileKeys[i]];
    if(Array.isArray(files)){
        toLoad.push(files);
        delete GDATA[fileKeys[i]];
    }
}
toLoad.push("tiles.png", "objects.png", "farmer.png", "allrounder.png", "soldier.png");
Q.load(toLoad.join(","),function(){
    Q.assets["images/tiles.png"] = Q.assets["tiles.png"];
    Q.assets["sprites.json"] = GDATA.dataFiles["sprites.json"];
    Q.compileSheets("objects.png","sprites.json");
    Q.sheet("farmer", "farmer.png", {
        tilew:24,
        tileh:24,
        sx:0,
        sy:0,
        w:24 * 8,
        h:24 * 8
    });
    Q.sheet("peasant", "allrounder.png", {
        tilew:24,
        tileh:24,
        sx:0,
        sy:0,
        w:24 * 8,
        h:24 * 8
    });
    Q.sheet("soldier", "soldier.png", {
        tilew:24,
        tileh:24,
        sx:0,
        sy:0,
        w:24 * 8,
        h:24 * 8
    });
    Q.sheet("officer", "soldier.png", {
        tilew:24,
        tileh:24,
        sx:0,
        sy:0,
        w:24 * 8,
        h:24 * 8
    });
    
    //Create the grid which keeps track of all interactable objects. This allows for easy searching of objects by location
    Q.BattleGrid = new Q.BattleGridObject();
    Q.rangeController = new Q.RangeController();
    var levels = GDATA.dataFiles["level-data.json"].levels;
    var level = "beginning";
    var data = levels.find(function(l){return l.name === level;});
    Q.loadStage(data);
    
},{
    progressCallback:Q.progressCallback
});
//Q.debug=true;
});