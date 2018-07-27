Quintus.Game=function(Q){
    //Loads a stage with passed in parameters
    Q.loadStage = function(data){
        Q.loadTMX(data.map, function() {
            Q.stageScene("level", 0, {data:data});
            Q.stageScene("hud", 1, {weather:data.weather, goal:data.goal});
        }, {tmxImagePath:"maps/"});
        
    };
    Q.clickStage = function(e){
        //Can't click sprite if placing one
        var x = e.offsetX || e.layerX,
            y = e.offsetY || e.layerY,
            stage = Q.stage();
        //If we've dragged or it's disabled, don't click
        if(stage.dragged || stage.disabled || !stage){
            stage.dragged = false;
            return;
        }

        var stageX = Q.canvasToStageX(x, stage),
            stageY = Q.canvasToStageY(y, stage);
        if(stageX < 0 || stageY < 0) return;

        var locX = Math.floor(stageX / Q.tileW);
        var locY = Math.floor(stageY / Q.tileH);
        var objAt = Q.getSpriteAt([locX, locY]);
        if(stage.canSelectObjects){
            if(objAt){
                objAt.trigger("selected");
                Q.stage().trigger("selectedObject", objAt);
            } else {
                Q.stage().trigger("selectedLocation", [locX, locY]);
            }
        } else {
            objAt = Q.getMenuButtonAt(stageX, stageY);
            if(objAt){
                objAt.trigger("selected");
                Q.stage().trigger("selectedObject", objAt);
            } else {
                Q.stage().trigger("clickedStage", {stageX:stageX, stageY:stageY, dragged:stage.dragged});
            }
        }
    };
    Q.scene("level",function(stage){
        stage.canSelectObjects = true;
        var data = stage.options.data;
        Q.stageTMX(data.map, stage);
        stage.lists.TileLayer[0].p.z = -5;
        stage.lists.TileLayer[1].p.z = -4;
        stage.mapWidth = stage.lists.TileLayer[0].p.tiles[0].length;
        stage.mapHeight = stage.lists.TileLayer[0].p.tiles.length;
        
        var gridMatrix = function(){
            var matrix = [];
            for(var i=0; i<stage.mapHeight; i++) {
                matrix[i] = [];
                for(var j=0; j<stage.mapWidth; j++) {
                    matrix[i][j] = 0;
                }
            }
            return matrix;
        };
        
        Q.RangeTileLayer = stage.insert(new Q.TileLayer({
            tileW:Q.tileW,
            tileH:Q.tileH,
            sheet:"ui_tiles",
            tiles:new gridMatrix(),
            w:32,
            h:32,
            type:Q.SPRITE_NONE,
            opacity:0.7,
            z:-3
        }));
        Q.RangeTileLayer.add("tween");
        //Set the battlegrid's stage
        Q.BattleGrid.stage = stage;
        //Reset the battle grid for this battle
        Q.BattleGrid.reset();
    
        //Create Homes
        for(var i=0;i<data.homes.length;i++){
            stage.insert(new Q.Home({loc: data.homes[i]}));
        }
        //Create plants
        for(var i=0;i<data.plants.length;i++){
            stage.insert(new Q.Crop({crop:data.plants[i][0], loc:data.plants[i][5], days:data.plants[i][1], sun: data.plants[i][2], water:data.plants[i][3], hp:data.plants[i][4]}));
        }
        Q.state.set("money", data.money);
        Q.state.set("weather", data.weather);
        Q.state.set("walkSpeed", 0.1);
        
        stage.add("viewport");
        stage.viewport.scale = 2;
        //The viewSprite is what moves when dragging the viewport
        stage.viewSprite = stage.insert(new Q.ViewSprite());
        stage.viewSprite.centerOn(data.homes[0]);
        Q.viewFollow(stage.viewSprite);
        
        Q.el.addEventListener("click", Q.clickStage);
        
        //stage.lists.Home[0].trigger("selected");
        //stage.lists.Home[0].showMoveOutMenu();
       /*setTimeout(function(){
            var char = stage.insert(new Q.Character({loc:[data.homes[0][0] - 2, data.homes[0][1] -1 ], data:GDATA.dataFiles["game-data.json"].classes[0], fromData:true}));
            stage.insert(new Q.Character({loc:[data.homes[0][0] - 1, data.homes[0][1] -1 ], data:GDATA.dataFiles["game-data.json"].classes[5], fromData:true}));
            stage.insert(new Q.Character({loc:[data.homes[0][0] - 3, data.homes[0][1] -1 ], data:GDATA.dataFiles["game-data.json"].classes[5], fromData:true}));
            char.showPlantingMenu();
            stage.insert(new Q.Crop({loc: [data.homes[0][0] - 2, data.homes[0][1] -2 ], crop: "Potato"}));
        });*/
    }, {sort:true});
    Q.scene("hud", function(stage){
        stage.add("viewport");
        stage.viewport.scale = 2;
        
        var moneyCont = stage.insert(new Q.UI.Container({x: Q.width / stage.viewport.scale - 70, y: 20, w: 120, h:30, fill: "lightblue", radius: 5, type:Q.SPRITE_UI, opacity: 0.8}));
        //moneyCont.insert(new Q.Sprite({x: 0, y: 0, w: 70, h:30, type:Q.SPRITE_UI, sheet:"purchase"}));
        var text = moneyCont.insert(new Q.UI.Text({label:"$"+Q.state.get("money") + " / $" + stage.options.goal, size:12, y:0}));
        Q.state.on("change.money", function(to){
            text.p.label = "$" +  to + " / $" + Q.stage().options.data.goal;
        });
        var resetAll = stage.insert(new Q.UI.Container({x: 60, y:Q.height / stage.viewport.scale - 20, w: 100, h:30, fill: "lightblue", radius: 5, type:Q.SPRITE_UI, opacity: 0.8}));
        resetAll.insert(new Q.UI.Text({label: "Reset All Actions", size: 10, y: 0}));
        resetAll.on("touch", function(){
            Q.Resetter.resetTurn();
        });
        
        var nextDay = stage.insert(new Q.UI.Container({x: Q.width / stage.viewport.scale - 60, y:Q.height / stage.viewport.scale - 20, w: 100, h:30, fill: "lightblue", radius: 5, type:Q.SPRITE_UI, opacity: 0.8}));
        nextDay.insert(new Q.UI.Text({label: "Next Day", size: 14, y: 0}));
        nextDay.on("touch", function(){
            if(Q.stage().canSelectObjects){
                Q.advanceDay();
            }
        });
        var weather = stage.options.weather;
        var num = Math.min(10, weather.length);
        var weatherReel = stage.insert(new Q.UI.Container({x: 10, y:20, radius: 5, type:Q.SPRITE_UI, fill: "lightblue", opacity: 0.8, w: 40 * num, h:30, cx:-5}));
        weatherReel.insert(new Q.UI.Container({x: 20, y:0, radius: 5, type:Q.SPRITE_UI, stroke: "gold", border: 5, w: 30, h:30}));
        for(var i = 0; i < num; i++){
            weatherReel.insert(new Q.Sprite({x:5 + i * 40, y:0, sheet:weather[i], cx:0}));
        }
        
    });
};