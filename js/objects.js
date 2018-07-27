//Contains spritesheet data as well as extended objects
Quintus.Objects=function(Q){
    var standRate = 1/3;
    var walkRate = 1/6;
    var tooFast = 1/24;
    Q.animations("Character", {
        standingup:{ frames: [0,1], rate:standRate},
        walkingup:{ frames: [0,1], rate:walkRate},
        attackingup:{ frames: [0,2,6,4], rate:tooFast, loop:false,trigger:"doneAttack"},
        
        standingright:{ frames: [2,3], rate:standRate},
        walkingright:{ frames: [2,3], rate:walkRate},
        attackingright:{ frames: [0,2,6,4], rate:tooFast, loop:false,trigger:"doneAttack"},

        standingleft:{ frames: [4,5], rate:standRate},
        walkingleft:{ frames: [4,5], rate:walkRate},
        attackingleft:{ frames: [0,2,6,4], rate:tooFast, loop:false,trigger:"doneAttack"},

        standingdown:{ frames: [6,7], rate:standRate},
        walkingdown:{ frames: [6,7], rate:walkRate},
        attackingdown:{ frames: [0,2,6,4], rate:tooFast, loop:false,trigger:"doneAttack"}
    });
    Q.animations("Crop",{
        idle: {frames:[0,1], rate:standRate},
        pickable: {frames:[2], rate:standRate}
    });
    Q.getXY = function(loc){
        return {x:loc[0] * Q.tileW + Q.tileW / 2,y:loc[1] * Q.tileH + Q.tileH / 2};
    };
    Q.setXY = function(obj){
        obj.p.x = obj.p.loc[0] * Q.tileW + Q.tileW / 2;
        obj.p.y = obj.p.loc[1] * Q.tileH + Q.tileH / 2;
    };
    Q.getSpriteAt = function(loc){
        return Q.stage().locate(loc[0] * Q.tileW + Q.tileW/2, loc[1] * Q.tileH + Q.tileH / 2, Q.SPRITE_INTERACTABLE);
    };
    Q.getMenuButtonAt = function(x, y){
        return Q.stage().locate(x, y, Q.SPRITE_MENUBUTTON);
    };
    Q.getLoc = function(x, y){
        return [~~(x / Q.tileW), ~~(y / Q.tileH)];
    };
    
    //Make the character look at the pointer when moving.
    Q.compareLocsForDirection = function(userLoc, loc, dir){
        var difX = userLoc[0] - loc[0];
        var difY = userLoc[1] - loc[1];
        //When the pointer is on top of the character, don't change the direction
        if(difX===0&&difY===0) return dir;
        //If the x dif is greater than the y dif
        if(Math.abs(difX)>Math.abs(difY)){
            //If the user is to the left of the pointer, make him face right
            if(difX<0) dir = "right";
            else dir = "left";
        } else {
            if(difY<0) dir = "down";
            else dir = "up";
        }
        return dir;
    };
    Q.advanceDay = function(){
        Q("Crop", 0).trigger("endDay");
        Q("Character", 0).trigger("endDay");
        Q("Home", 0).trigger("endDay");
        
        var stage = Q.stage();
        stage.options.data.weather.splice(0, 1);
        
        if(!stage.options.data.weather.length){
            //Auto Harvest all on field for half
            var additionalMoney = 0;
            Q.stage().lists["Crop"].forEach(function(crop){
                if(crop.p.pickable) {
                    additionalMoney += calculateCropValue(crop.p.data) / 2;
                    crop.pickCrop();
                }
            });
            Q.state.inc("money", additionalMoney);
            //Figure out if the money goal was reached
            var money = Q.state.get("money");
            if(money >= stage.options.data.goal){
                alert("You won with $"+money+" / $"+stage.options.data.goal+"!");
            } else{
                alert("You lost with $"+money+" / $"+stage.options.data.goal+"...");
            }
        }
        //If it's raining, wet the soil. This could be more efficient by keeping track of soil at the start of the map so we don't have to find it all every turn.
        var checkTile = 18;
        var tile = 17;
        if(GDATA.dataFiles["game-data.json"].weather[stage.options.data.weather[0]].water){
            checkTile = 17;
            tile = 18;
        }
        var w = Q.stage().lists.TileLayer[1].p.tiles[0].length;
        var h = Q.stage().lists.TileLayer[1].p.tiles.length;
        for(var y = 0; y < h; y++){
            for(var x = 0; x < w; x++){
                if(Q.stage().lists.TileLayer[1].p.tiles[y][x] === checkTile){
                    Q.stage().lists.TileLayer[1].setTile(x, y, tile);
                }
            }
        }
        
        Q.Resetter.reset();
        Q.stageScene("hud", 1, {weather:stage.options.data.weather, goal:stage.options.data.goal});
    };
    
    Q.viewFollow=function(obj, stage){
        if(!stage){stage=Q.stage(0);};
        var minX=0;
        var maxX=(stage.mapWidth*Q.tileW)*stage.viewport.scale;
        var minY=0;
        var maxY=(stage.mapHeight*Q.tileH)*stage.viewport.scale;
        stage.follow(obj,{x:true,y:true}/*,{minX: minX, maxX: maxX, minY: minY,maxY:maxY}*/);
    };
    Q.getTileType = function(loc){
        //Prioritize the collision objects
        var tileLayer = Q.stage().lists.TileLayer[1];
        if(tileLayer.p.tiles[loc[1]] && tileLayer.tileCollisionObjects[tileLayer.p.tiles[loc[1]][loc[0]]]){
            var type = tileLayer.tileCollisionObjects[tileLayer.p.tiles[loc[1]][loc[0]]].p.type; 
            return type || "impassable";
        }
        //If there's nothing on top, check the ground
        var tileLayer = Q.stage().lists.TileLayer[0];
        if(tileLayer.p.tiles[loc[1]]&&tileLayer.tileCollisionObjects[tileLayer.p.tiles[loc[1]][loc[0]]]){
             return tileLayer.tileCollisionObjects[tileLayer.p.tiles[loc[1]][loc[0]]].p.type;
        }
    };
    Q.getWalkableOn = function(tile){
        var move = tile.move;
        return move || 1000000;
    };
    var tileTypes = {
        "impassable":{
            "name":"Impassable",
            "move":0
        },
        "tilledSoil":{
            "name":"Impassable",
            "move":0
        },
        "wateredSoil":{
            "name":"Impassable",
            "move":0
        },
        "grass":{
            "name":"Grass",
            "move":1
        },
        "dirt":{
            "name":"Dirt",
            "move":1000000
        },
        "sand":{
            "name":"Sand",
            "move":2
        },
        "rock":{
            "name":"Rock",
            "move":3
        },
        "road":{
            "name":"Road",
            "move":1
        },
        "desert":{
            "name":"Desert",
            "move":2
        }
    };

    Q.getMatrix = function(type, team, didAction){
        var cM = [];
        var stage = Q.stage();
        for(var x=0;x<stage.lists.TileLayer[0].p.tiles[0].length;x++){
            var costRow = [];
            for(var y=0;y<stage.lists.TileLayer[0].p.tiles.length;y++){
                var cost = 1;
                var objOn = false;
                //If we're walking, enemies are impassable
                if(type==="walk"){
                    cost = Q.getWalkableOn(tileTypes[ Q.getTileType([x,y]) ]);
                    //Don't check for other objects and ZOC in the story
                    if(cost < 1000000){
                        objOn = Q.BattleGrid.getObject([x,y]);
                    }
                    //Allow going into homes if the char has not done an action
                    if(objOn && objOn.isA("Home")){
                        if(!didAction){ 
                            objOn=false;
                        }
                    } 
                    //Allow walking over allies
                    else if(objOn && objOn.p.team === team){
                        objOn=false;
                    };
                }
                //If there's still no enemy on the square, get the tileCost
                if(objOn){
                    costRow.push(1000000);
                }
                else {
                    costRow.push(cost);
                }
            }
            cM.push(costRow);
        }
        return cM;
    };
    //Returns a path from one location to another
    Q.getPath = function(loc, toLoc, graph, max){
        var start = graph.grid[loc[0]][loc[1]];
        var end = graph.grid[toLoc[0]][toLoc[1]];
        return Q.astar.search(graph, start, end, {maxScore:max});
    };
    Q.GameObject.extend("ResetterObject",{
        actionsOrder:[],
        addToActionsOrder:function(data){
            this.actionsOrder.push(data);
        },
        //Resets all objects
        resetTurn:function(){
            var actions = this.actionsOrder;
            for(var i = actions.length - 1; i >= 0; i--){
                var action = this.actionsOrder[i];
                if(action.type === "move"){
                    action.obj.resetMove();
                } else if(action.type === "action"){
                    action.obj.resetAction();
                } else if(action.type === "hire"){
                    action.obj.undoHire();
                } else if(action.type === "upgrade"){
                    action.obj.undoUpgrade();
                }
            }
            this.reset();
        },
        reset:function(){
            this.actionsOrder = [];
        },
        removeFromActionsOrder:function(obj, type){
            //Stop after the first instance
            for(var i = this.actionsOrder.length - 1; i >= 0; i--){
                if(this.actionsOrder[i].obj.p.id === obj.p.id && this.actionsOrder[i].type === type){
                    this.actionsOrder.splice(i, 1);
                    break;
                }
            }
        }
    });
    Q.Resetter = new Q.ResetterObject();
    //The grid that keeps track of all interactable objects in the battle.
    //Any time an object moves, this will be updated
    Q.GameObject.extend("BattleGridObject",{
        reset:function(){
            //When an item is inserted into this stage, check if it's an interactable and add it to the grid if it is
            this.stage.on("inserted", this, function(itm){
                if(!itm.p.loc) return;
                this.addObjectToBattle(itm);
            });
            this.grid = [];
            var tilesX = this.stage.mapWidth;
            var tilesY = this.stage.mapHeight;
            for(var i=0;i<tilesY;i++){
                this.grid[i]=[];
                for(var j=0;j<tilesX;j++){
                    this.grid[i][j]=false;
                }
            }
        },
        //Returns a grid that is as big as the level that is empty
        emptyGrid:function(){
            var grid = [];
            for(var i=0;i<Q.stage(0).mapHeight;i++){
                grid.push([]);
                for(var j=0;j<Q.stage(0).mapWidth;j++){
                    grid[i].push(0);
                }
            }
            return grid;
        },
        outOfBounds:function(loc){
            return loc[0]<0||loc[1]<0||loc[0]>this.stage.mapWidth||loc[1]>this.stage.mapHeight;
        },
        //Get an object at a location in the grid
        getObject:function(loc){
            if(this.outOfBounds(loc)) return false;
            return this.grid[loc[1]][loc[0]];
        },
        //Set an object to a space in the grid
        setObject:function(loc, obj){
            this.grid[loc[1]][loc[0]] = obj;
        },
        //Move an object in the grid
        moveObject:function(from, to, obj){
            this.removeObject(from);
            this.setObject(to,obj);
        },
        //Removes an object from the grid
        removeObject:function(loc){
            this.grid[loc[1]][loc[0]] = false;
        },
        addObjectToBattle:function(obj){
            if(obj.p.type === Q.SPRITE_INTERACTABLE){
                //Place the object in the grid
                this.setObject(obj.p.loc,obj);
            }
        },
        //Used to get rid of the object. Used in lifting and if an interactable is destroyed(TODO)
        removeObjectFromBattle:function(obj){
            this.removeObject(obj.p.loc);
        },
        getObjectsWithin:function(centerLoc,radius){
            var objects = [];
            for(var i=-radius;i<radius+1;i++){
                for(var j=0;j<((radius*2+1)-Math.abs(i*2));j++){
                    if(i===0&&j===radius) j++;
                    var object = this.getObject([centerLoc[0]+i,centerLoc[1]+j-(radius-Math.abs(i))]);
                    if(object) objects.push(object);
                }
            }
            return objects;
        },
        //Not great wording, but this gets all objects that are on top of these tiles
        getObjectsAround:function(tiles){
            var objects = [];
            for(var i=0;i<tiles.length;i++){
                //var object = this.getObject(tiles[i].p.loc);
                var object = this.getObject(tiles[i]);
                if(object) objects.push(object);
            };
            return objects;
        },
        //Gets the closest empty tiles around a location
        getEmptyAround:function(loc,required){
            alert("Not in use")
            var tiles = [];
            var radius = 1;
            //If the search fails for the closest 4 tiles, try the next range
            while(!tiles.length){
                for(var i=-radius;i<radius+1;i++){
                    for(var j=0;j<((radius*2+1)-Math.abs(i*2));j++){
                        var curLoc = [loc[0]+i,loc[1]+j-(radius-Math.abs(i))];
                        var object = this.getObject(curLoc);
                        var tile = Q.BatCon.getTileType(curLoc);
                        if(!object&&tile!=="impassable"&&(!tile.required||(tile.required&&required[tile.required]))) tiles.push(curLoc);
                    }
                }
                radius++;
            }
            return tiles;
        },
        removeAllies:function(arr,allyTeam){
            return arr.filter(function(itm){
                return itm.p.team!==allyTeam;
            });
        },
        removeEnemies:function(arr,allyTeam){
            return arr.filter(function(itm){
                return itm.p.team===allyTeam;
            });
        },
        //Removes any objects that are dead
        removeDead:function(arr){
            return arr.filter(function(itm){
                return itm.p.combatStats.hp>0;
            });
        },
        //Gets the bounds of the level
        getBounds:function(loc, num){
            var maxTileRow = this.grid.length;
            var maxTileCol = this.grid[0].length;
            var minTile = 0;
            var rows=num*2+1,
                cols=num*2+1,
                tileStartX=loc[0]-num,
                tileStartY=loc[1]-num;
            var dif=0;

            if(loc[0]-num<minTile){
                dif = cols-(num+1+loc[0]);
                cols-=dif;
                tileStartX=num+1-cols+loc[0];
            }
            if(loc[0]+num>=maxTileCol){
                dif = cols-(maxTileCol-loc[0]+num);
                cols-=dif;
            }
            if(loc[1]-num<minTile){
                dif = rows-(num+1+loc[1]);
                rows-=dif;
                tileStartY=num+1-rows+loc[1];
            }
            if(loc[1]+num>=maxTileRow){
                dif = rows-(maxTileRow-loc[1]+num);
                rows-=dif;
            }
            if(cols+tileStartX>=maxTileCol){cols=maxTileCol-tileStartX;};
            if(rows+tileStartY>=maxTileRow){rows=maxTileRow-tileStartY;};
            return {tileStartX:tileStartX,tileStartY:tileStartY,rows:rows,cols:cols,maxTileRow:maxTileRow,maxTileCol:maxTileCol};
        },
        //Gets the tile distance between two locations
        getTileDistance:function(loc1,loc2){
            return Math.abs(loc1[0]-loc2[0])+Math.abs(loc1[1]-loc2[1]);
        }
    });
    Q.UI.Container.extend("ButtonBG",{
        init:function(p){
            this._super(p, {
                fillStyle:'lightblue', 
                type:Q.SPRITE_NONE
            });
        },
        draw:function(ctx){
            ctx.beginPath();
            ctx.arc(0, 0, this.p.w, 0, 2 * Math.PI);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'black';
            ctx.fillStyle = this.p.fillStyle;
            ctx.stroke();
            ctx.fill();
        }
    });
    Q.GameObject.extend("uiController",{
        //Creates one of 'dem bubbles
        createButton:function(stage, obj, p, opt){
            var bg = new Q.ButtonBG({x:p.x, y:p.y, w:p.w, h:p.h});
            stage.insert(bg, obj);
            var scale = opt.scale || 1;
            var icon = new Q.Sprite({x:p.x, y:p.y, w:p.w * 2 / scale, h:p.h * 2 / scale, idx:p.idx, sheet: opt.icon, sprite:opt.sprite, scale:scale, frame:opt.disabled ? 1 : 0, data:opt.data || {}, cx:p.w * 1.33, cy:p.h * 1.33, type: Q.SPRITE_MENUBUTTON, bg:bg});
            //Reposition if the sprite icon is not 32/32
            var sheet = Q.sheet(opt.icon);
            icon.p.x += (Q.tileW - sheet.tileW) / 4;
            icon.p.y += (Q.tileH - sheet.tileH) / 4;
            //TODO: make the BG clickable or use only 32/32 icons
            icon.on("selected", opt.click);
            stage.insert(icon, obj);
            if(opt.sprite){
                icon.add("animation");
                icon.play(opt.animation);
            }
            if(opt.autoSelect){
                icon.trigger("selected");
            }
            return icon;
        },
        //Creates the ring of options that goes around an object that gets selected
        createOptionsRing:function(obj, menuOptions, fullCircleAmount, roundedLineProps){
            var stage = obj.stage;
            this.obj = obj;
            obj.p.z = 10000000;
            
            //Do a few calculations to determine where to put things
            var menuOptionsNum = menuOptions.length;
            var ratio = menuOptionsNum  / fullCircleAmount;
            var circleLength = 2 * ratio * Math.PI;
            var start = 1.5 * Math.PI - circleLength / 2;
            var radius = Q.tileW * 1.5;
            //Create the background that the worker icons sit on
            var backgroundRoundedLine = new Q.UI.Container({x:0, y:0, w: radius, h:radius, lineWidth:roundedLineProps.lineWidth || 10, strokeStyle: roundedLineProps.strokeStyle || "gold"});
            backgroundRoundedLine.draw = function(ctx){
                ctx.beginPath();
                ctx.arc(0, 0, this.p.w, start, start + circleLength);
                ctx.lineWidth = this.p.lineWidth;
                ctx.strokeStyle = this.p.strokeStyle;
                ctx.lineCap = "round";
                ctx.stroke();
            };
            stage.insert(backgroundRoundedLine, obj);
            var buttons = [];
            for(var i = 0; i < menuOptions.length; i++){
                var x = radius * Math.cos(start + i * circleLength / menuOptionsNum + (circleLength / menuOptionsNum / 2));
                var y = radius * Math.sin(start + i * circleLength / menuOptionsNum + (circleLength / menuOptionsNum / 2));
                buttons.push(this.createButton(stage, obj, {x:x, y:y, w:radius / 4, h:radius / 4, idx:i}, menuOptions[i]));
            }
            stage.on("clickedStage", this, this.removeMenu);
            stage.canSelectObjects = false;
            return buttons;
        },
        
        //A vertical list of buttons to the right of an object
        createSideButtons:function(obj, menuOptions){
            var stage = obj.stage;
            var radius = Q.tileW * 1.5;
            var buttons = [];
            for(var i = 0; i < menuOptions.length; i++){
                var x = radius * 1.5;
                var spacing = radius / 4 + 15;
                var y = spacing * i - ( spacing / 2 * (menuOptions.length - 1));
                buttons.push(this.createButton(stage, obj, {x:x, y:y, w:radius / 4, h:radius / 4}, menuOptions[i]));
            }
            return buttons;
        },
        removeMenu:function(){
            var obj = this.obj;
            obj.p.z = obj.p.y - obj.p.h;
            var stage = Q.stage();
            Q._each(obj.children, function(itm){itm.destroy();});
            stage.off("clickedStage", this, this.removeMenu);
            stage.canSelectObjects = true;
        }
    });
    //In charge of creating the beautiful menu bubbles.
    Q.UIController = new Q.uiController();
    Q.Sprite.extend("Home", {
        init:function(p){
            this._super(p, {
                sheet:"home",
                type:Q.SPRITE_INTERACTABLE,
                workers:[],
                actionsOrder:[]
            });
            Q.setXY(this);
            this.on("selected");
            this.on("endDay");
        },
        endDay:function(){
            this.p.actionsOrder = [];
        },
        undoHire:function(){
            var action = this.p.actionsOrder[this.p.actionsOrder.length - 1];
            Q.state.inc("money", action.cost);
            this.changeWorkerAmount(action.hired, -1);
            
            this.p.actionsOrder.pop();
            Q.Resetter.removeFromActionsOrder(this, "hire");
        },
        undoUpgrade:function(){
            var action = this.p.actionsOrder[this.p.actionsOrder.length - 1];
            this.changeWorkerAmount(action.upgraded, 3);
            this.changeWorkerAmount(action.upgradedClass, -1);
            this.p.actionsOrder.pop();
            Q.Resetter.removeFromActionsOrder(this, "upgrade");
        },
        getTotalNumberOfWorkers:function(){
            return this.p.workers.reduce(function(a, b){return a + b[1];}, 0);
        },
        getClassAvailable:function(group, rank){
            if(rank === 0) return false;
            var stage = this.stage;
            return stage.options.data.classes.find(function(worker){return worker === GDATA.dataFiles["game-data.json"].classes.find(function(cl){return cl.group === group && cl.rank === rank;}).name;});
        },
        getWorkerAmount:function(type){
            var found = this.p.workers.find(function(worker){return worker[0] === type;});
            if(!found) return [type, 0];
            return found;
        },
        //Gets a list in the same format as stage.options.classes ["Soldier", "Peasant"]
        getAvailableWorkers:function(){
            return this.p.workers.filter(function(worker){return worker[1] > 0;}).map(function(worker){return worker[0];});
        },
        changeWorkerAmount:function(kind, amount){
            var worker = this.p.workers.find(function(w){return w[0] === kind;});
            if(!worker){ 
                worker = [kind, amount];
                this.p.workers.push(worker);
            } else {
                worker[1] += amount;
            }
            return worker;
        },
        showWorkers:function(availableWorkers, onSelectedWorker){
            var stage = this.stage;
            var obj = this;
            
            var radius = Q.tileW * 1.5;
            
            var cont = new Q.UI.Container({x:0, y:0 - radius * 1.75, fill:"tan", w: radius * 2, h:radius});
            stage.insert(cont, obj);
            var name = new Q.UI.Text({size:10, x:-cont.p.w/2 + 5, y:-cont.p.h / 2 + 10, align:"left", family: "Times New Roman"});
            cont.insert(name);
            var costText  = new Q.UI.Text({size:8, x:cont.p.w/2 - 5, y:-cont.p.h / 2 + 10, color:"maroon", align:"right", family:"Lucida Console"});
            cont.insert(costText);
            
            var move = new Q.UI.Text({size:8, x:-cont.p.w/2 + 5, y:0, align:"left", family:"Lucida Console"});
            cont.insert(move);
            var attack  = new Q.UI.Text({ size:8, x:0, y:0, align:"center", family:"Lucida Console"});
            cont.insert(attack);
            var defense  = new Q.UI.Text({ size:8, x:cont.p.w/2 - 5, y:0, align:"right", family:"Lucida Console"});
            cont.insert(defense);
            
            var hp  = new Q.UI.Text({size:8, x:-cont.p.w/2 + 5, y:cont.p.h/4, align:"left", family:"Lucida Console"});
            cont.insert(hp);
            var haveText = new Q.UI.Text({size:8, x:0, y:cont.p.h/4, align:"center", label: "Avail.", family:"Lucida Console"});
            cont.insert(haveText);
            var haveAmountText  = new Q.UI.Text({size:8, x:cont.p.w/2 - 5, y:cont.p.h/4, align:"right", family:"Lucida Console"});
            cont.insert(haveAmountText);
            
            
            obj.p.nameText = name;
            obj.p.hpText = hp;
            obj.p.moveText = move;
            obj.p.attackText = attack;
            obj.p.defenseText = defense;
            obj.p.costText = costText;
            obj.p.haveAmountText = haveAmountText;
            obj.p.cont = cont;
            
            
            var menuOptions = [];
            //Create each worker icon
            for(var i=0; i < availableWorkers.length; i++){
                menuOptions.push({
                    icon:availableWorkers[i].toLowerCase(),
                    sprite: "Character",
                    animation:"standingdown",
                    scale:0.5,
                    autoSelect: i === 0 ? true : false,
                    data: GDATA.dataFiles["game-data.json"].classes.find(function(d){return d.name === availableWorkers[i];}),
                    click:function(){
                        onSelectedWorker(this);
                    }
                });
            }
            Q.UIController.createOptionsRing(
                    obj, 
                    menuOptions,
                    GDATA.dataFiles["game-data.json"].classes.length,
                    {strokeStyle: "gold"}
            );
            
        },
        showRecruitingMenu:function(){
            this.p.z = 10000000;
            var stage = this.stage;
            var obj = this;
            
            var buttons = Q.UIController.createSideButtons(
                this,
                [
                    {
                        icon: "purchase",
                        click: function(){
                            if(this.p.frame === 0){
                                obj.changeWorkerAmount(currentSelection.p.data.name, 1);
                                var classCost = getClassCost(currentSelection.p.data);
                                Q.state.inc("money", -classCost);
                                currentSelection.trigger("selected");
                                obj.p.actionsOrder.push({name: "hire", hired:currentSelection.p.data.name, cost: classCost});
                                Q.Resetter.addToActionsOrder({obj: obj, type: "hire"});
                            }
                        }
                    },
                    {
                        icon: "upgrade",
                        click: function(){
                            if(this.p.frame === 0){
                                obj.changeWorkerAmount(currentSelection.p.data.name, -3);
                                var upClass = obj.getClassAvailable(currentSelection.p.data.group, currentSelection.p.data.rank - 1);
                                obj.changeWorkerAmount(upClass, 1);
                                currentSelection.trigger("selected");
                                obj.p.actionsOrder.push({name: "upgrade", upgraded:currentSelection.p.data.name, upgradedClass: upClass});
                                Q.Resetter.addToActionsOrder({obj: obj, type:"upgrade"});
                            }
                        }
                    },
                    {
                        icon: "back",
                        click: function(){
                            Q.UIController.removeMenu();
                            obj.trigger("selected");
                        }
                    }
                ]
            );

            var currentSelection;
            this.showWorkers(stage.options.data.classes, function(worker){
                var data = worker.p.data;
                if(currentSelection){
                    currentSelection.p.bg.p.fillStyle = "lightblue";
                }
                currentSelection = worker;
                worker.p.bg.p.fillStyle = "green";
                var classCost = getClassCost(data);
                var workerAmount = obj.getWorkerAmount(data.name)[1];
                var enoughMoney = Q.state.get("money") - classCost >= 0;
                var canUpgrade = workerAmount > 2 && obj.getClassAvailable(data.group, data.rank - 1);
                obj.p.nameText.p.label = data.name;
                obj.p.hpText.p.label = "H"+data.hp;
                obj.p.moveText.p.label = "M"+data.move;
                obj.p.attackText.p.label = "A"+data.atk;
                obj.p.defenseText.p.label = "D"+data.def;
                obj.p.costText.p.label = "$"+classCost;
                obj.p.haveAmountText.p.label = "("+workerAmount+")";
                if(enoughMoney){ buttons[0].p.frame = 0; } else { buttons[0].p.frame = 1; };
                if(canUpgrade) { buttons[1].p.frame = 0; } else { buttons[1].p.frame = 1; };
                
                
                
                obj.p.cont.p.fill = data.rank === 3 ? "tan" : data.rank === 2 ? "silver" : "gold";
            });
            
        },
        showMoveOutMenu:function(){
            this.p.z = 10000000;
            var stage = this.stage;
            var obj = this;
            Q.UIController.createSideButtons(
                this,
                [
                    {
                        icon: "moving",
                        click: function(){
                            Q.UIController.removeMenu();
                            stage.insert(new Q.Character({loc:obj.p.loc, data:currentSelection.p.data, initialMove:obj, lastLoc:obj.p.loc}));
                            obj.changeWorkerAmount(currentSelection.p.data.name, -1);
                        }
                    },
                    {
                        icon: "back",
                        click: function(){
                            Q.UIController.removeMenu();
                            obj.trigger("selected");
                        }
                    }
                ]
            );
            
            var currentSelection;
            this.showWorkers(this.getAvailableWorkers(), function(worker){
                var data = worker.p.data;
                if(currentSelection){
                    currentSelection.p.bg.p.fillStyle = "lightblue";
                }
                currentSelection = worker;
                worker.p.bg.p.fillStyle = "green";
                var workerAmount = obj.getWorkerAmount(data.name)[1];
                
                
                obj.p.nameText.p.label = data.name;
                obj.p.hpText.p.label = "H"+data.hp;
                obj.p.moveText.p.label = "M"+data.move;
                obj.p.attackText.p.label = "A"+data.atk;
                obj.p.defenseText.p.label = "D"+data.def;
                obj.p.costText.p.label = " ";
                obj.p.haveAmountText.p.label = "("+workerAmount+")";
                
                obj.p.cont.p.fill = data.rank === 3 ? "tan" : data.rank === 2 ? "silver" : "gold";
            });
        },
        selected:function(){
            var obj = this;
            var hasWorkersToMove = this.getTotalNumberOfWorkers();
            var buttons = Q.UIController.createOptionsRing(
                    obj,
                    [
                        {
                            icon: "move",
                            click: function(){
                                if(this.p.frame === 0){
                                    Q.UIController.removeMenu();
                                    obj.showMoveOutMenu();
                                }
                            }
                        },
                        {
                            icon: "hiring",
                            click: function(){
                                Q.UIController.removeMenu();
                                obj.showRecruitingMenu();
                            }
                        },
                        {
                            icon: "back",
                            click: function(){
                                Q.UIController.removeMenu();
                            }
                        }
                    ],
                    9,
                    {strokeStyle: "gold"}
            );
            if(!hasWorkersToMove) buttons[0].p.frame = 1;
            
        }
    });
    
    Q.Sprite.extend("Character",{
        init:function(p){
            this._super(p, {
                type:Q.SPRITE_INTERACTABLE,
                sheet:p.data.name.toLowerCase(),
                sprite:"Character",
                hp:p.data.hp,
                actionsOrder:[],
                attackedThisTurn:[],
                move:p.data.move,
                atk:p.data.atk,
                def:p.data.def,
                rank:p.data.rank,
                dir:"down"
            });
            this.add("animation, killable");
            Q.setXY(this);
            this.p.z = this.p.y;
            this.on("inserted");
            this.on("selected");
            this.on("endDay", "reset");
        },
        inserted:function(){
            this.playStand();
            Q._generatePoints(this, true);
            this.reset();
            if(!this.p.fromData) this.selectIcon("move");
        },
        reset:function(){
            this.p.didAction = [];
            this.p.didMove = false;
            this.p.actionsOrder = [];
            this.p.walkMatrix = new Q.Graph(Q.getMatrix("walk", this.p.team, this.p.didAction.length));
            this.p.lastLoc = this.p.loc;
            this.p.attackedThisTurn = [];
        },
        resetAction:function(){
            var stage = this.stage;
            var action = this.p.didAction[this.p.didAction.length - 1];
            switch(action.name){
                case "till":
                    Q.stage().lists.TileLayer[1].setTile(action.loc[0], action.loc[1], 11);
                    break;
                case "plantseeds":
                    Q.BattleGrid.getObject(action.loc).destroy();
                    Q.BattleGrid.removeObject(action.loc);
                    Q.state.inc("money", action.cost);
                    break;
                case "water":
                    Q.stage().lists.TileLayer[1].setTile(action.loc[0], action.loc[1], 17);
                    break;
                case "pick":
                    if(action.target.p.picked){
                        action.target.p.picked = false;
                        action.target.p.pickable = true;
                        action.target.play("pickable");
                        action.target.show();
                        Q.BattleGrid.setObject(action.target.p.loc, action.target);
                        if(action.target.p.regrow){
                            action.target.reversePick();
                        }
                    }
                    Q.state.dec("money", action.value);
                    break;
                case "attack":
                    if(action.target.p.hp < 0){
                        action.target.show();
                        Q.BattleGrid.setObject(action.target.p.loc, action.target);
                    }
                    action.target.p.hp += action.damageDealt;
                    action.target.p.attackedThisTurn.pop();
                    this.p.dir = action.origDir;
                    this.playStand(this.p.dir);
                    break;
                case "defend":
                    action.target.p.tempDef = 0;
                    break;
                case "mend":
                    action.target.p.hp -= action.damageDealt;
                    action.target.p.attackedThisTurn.pop();
                    break;
            }
            this.p.didAction.splice(this.p.didAction.length - 1, 1);
            this.p.actionsOrder.pop();
            Q.Resetter.removeFromActionsOrder(this, "action");
            this.p.walkMatrix = new Q.Graph(Q.getMatrix("walk", this.p.team, this.p.didAction.length));
        },
        resetMove:function(){
            //If we've gone into a home
            if(this.isDestroyed){
                var curLoc = this.p.loc;
                this.p.loc = this.p.lastLoc;
                this.p.fromData = true;
                this.stage.insert(new Q.Character(this.p));
                var homeAt = Q.stage(0).lists["Home"].filter(function(home){
                    return home.p.loc[0] === curLoc[0] && home.p.loc[1] === curLoc[1];
                });
                //This could happen when a unit is destroyed and then tries to go back, but probably not.
                if(!homeAt.length) alert("That's a bug.");
                homeAt[0].changeWorkerAmount(this.p.data.name, -1);
                this.p.actionsOrder.pop();
                Q.Resetter.removeFromActionsOrder(this, "move");
                return;
            }
            var lastLoc = this.p.lastLoc;
            var homeAt = Q.stage(0).lists["Home"].filter(function(home){
                return home.p.loc[0] === lastLoc[0] && home.p.loc[1] === lastLoc[1];
            });
            if(homeAt.length){
                homeAt[0].changeWorkerAmount(this.p.data.name, 1);
                this.destroy();
                Q.BattleGrid.removeObject(this.p.loc);
            } else {
                Q.BattleGrid.moveObject(this.p.loc, lastLoc, this);
                this.p.loc = lastLoc;
                Q.setXY(this);
                this.p.didMove = false;
                
                this.p.walkMatrix = new Q.Graph(Q.getMatrix("walk", this.p.team, this.p.didAction.length));
                this.p.lastLoc = this.p.loc;
            }
            this.p.actionsOrder.pop();
            Q.Resetter.removeFromActionsOrder(this, "move");
        },
        checkPlayDir:function(dir){
            if(!dir){return this.p.dir;}else{return dir||"down";}
        },
        playStand:function(dir){
            this.p.dir = this.checkPlayDir(dir);
            this.play("standing"+this.p.dir);
        },
        playAttack:function(dir,callback){
            this.p.dir = this.checkPlayDir(dir);
            this.play("attacking"+this.p.dir);
            this.on("doneAttack",function(){
                this.off("doneAttack");
                this.playStand(this.p.dir);
                if(callback){
                    setTimeout(function(){
                        callback();
                    },400);
                }
            });
        },
        playWalk:function(dir){
            this.p.dir = this.checkPlayDir(dir);
            this.play("walking"+this.p.dir);
        },
        
        selected:function(){
            var obj = this;
            var groupData = GDATA.dataFiles["game-data.json"].groups[obj.p.data.group];
            var stage = this.stage;
            
            var radius = Q.tileW * 1.5;
            //Display top info (this is pretty custom, so just do it here)
            var cont = new Q.UI.Container({x:0, y:0 - radius * 1.75, fill:"tan", w: radius * 2, h:radius / 1.5});
            stage.insert(cont, obj);
            var name = new Q.UI.Text({size:10, x:-cont.p.w/2 + 5, y:-cont.p.h / 2 + 10, align:"left", family: "Times New Roman", label:obj.p.data.name});
            cont.insert(name);
            var hp  = new Q.UI.Text({size:8, x:cont.p.w/2 - 5, y:-cont.p.h / 2 + 10, align:"right", family:"Lucida Console", label:""+obj.p.hp+"/"+obj.p.data.hp});
            cont.insert(hp);
            
            var move = new Q.UI.Text({size:8, x:-cont.p.w/2 + 5, y:cont.p.h / 2 - 10, align:"left", family:"Lucida Console", label:"M"+obj.p.data.move});
            cont.insert(move);
            var attack  = new Q.UI.Text({ size:8, x:0, y:cont.p.h / 2 - 10, align:"center", family:"Lucida Console", label:"A"+obj.p.data.atk});
            cont.insert(attack);
            var defense  = new Q.UI.Text({ size:8, x:cont.p.w/2 - 5, y:cont.p.h / 2 - 10, align:"right", family:"Lucida Console", label:"D"+obj.p.data.def});
            cont.insert(defense);
            
            
            //Get an array of all of the action names based on what the char has done this turn and its group
            var actions = [];
            if(!this.p.didMove){
                actions.push("move");
            } else {
                actions.push("resetmove");
            }
            //If the character has not acted this turn
            if(!this.p.didAction.length){
                actions = actions.concat(groupData.actions);
            } else {
                //If the character has only done pick actions
                if(this.p.didAction.filter(function(action){return action.name === "pick";}).length === this.p.didAction.length){
                    actions = actions.concat(groupData.actions);
                }
                actions.push("resetaction");
            }
            
            actions.push("pick", "back");
            
            //Create the buttons that the user can click to do actions
            Q.UIController.createOptionsRing(
                    obj,
                    actions.map(function(action){
                        var act = action.toLowerCase();
                        return {
                            disabled:!obj.tilesAvailable(act),
                            icon:act,
                            click:function(){
                                if(this.p.frame === 0){
                                    Q.UIController.removeMenu();
                                    obj.selectIcon(act, this);
                                }
                            }
                        };
                    }),
                    9,
                    {strokeStyle: "gold"}
            );
        },
        showPlantingMenu:function(){
            var obj = this;
            var seeds = this.stage.options.data.crops;
            var seedOptions = [];
            var currentSelection;
            var stage = this.stage;
            
            var radius = Q.tileW * 1.5;
            //Display top info (this is pretty custom, so just do it here)
            var cont = new Q.UI.Container({x:0, y:0 - radius * 1.75, fill:"tan", w: radius * 2, h:radius});
            stage.insert(cont, obj);
            var crop = new Q.UI.Text({size:10, x:-cont.p.w/2 + 5, y:-cont.p.h / 2 + 10, align:"left", family: "Times New Roman"});
            cont.insert(crop);
            var val = new Q.UI.Text({size:8, x:cont.p.w/2 - 5, y:-cont.p.h / 2 + 10, align:"right", color:"maroon", family:"Lucida Console"});
            cont.insert(val);
            
            var sun  = new Q.UI.Text({size:8, x:-cont.p.w/2 + 5, y:0, align:"left", family:"Lucida Console"});
            cont.insert(sun);
            var water  = new Q.UI.Text({ size:8, x:0, y:0, align:"center", family:"Lucida Console"});
            cont.insert(water);
            var days  = new Q.UI.Text({ size:8, x:cont.p.w/2 - 5, y:0, align:"right", family:"Lucida Console"});
            cont.insert(days);
            
            var cost = new Q.UI.Text({ size:8, x:-cont.p.w/2 + 5, y:cont.p.h / 2 - 10, align:"left", family:"Lucida Console"});
            cont.insert(cost);
            var regrow  = new Q.UI.Text({ size:8, x:0, y:cont.p.h / 2 - 10, align:"center", family:"Lucida Console"});
            cont.insert(regrow);
            var hp  = new Q.UI.Text({size:8, x:cont.p.w/2 - 5, y:cont.p.h / 2 - 10, align:"right", family:"Lucida Console"});
            cont.insert(hp);
            
            var buttons = Q.UIController.createSideButtons(
                this,
                [
                    {
                        icon: "plantseeds",
                        click: function(){
                            if(this.p.frame === 0){
                                Q.UIController.removeMenu();
                                obj.selectIcon("plantseeds", currentSelection.p.data);
                            }
                        }
                    },
                    {
                        icon: "back",
                        click: function(){
                            Q.UIController.removeMenu();
                            obj.trigger("selected");
                        }
                    }
                ]
            );
            
            for(var i = 0; i < seeds.length; i++){
                var data = GDATA.dataFiles["game-data.json"].crops.find(function(d){return d.name === seeds[i];});
                seedOptions.push({
                    icon:seeds[i],
                    autoSelect: i === 0 ? true : false,
                    data: data,
                    click:function(){
                        let data = this.p.data;
                        let value = calculateCropValue(data);
                        if(this.p.frame === 0){
                            if(currentSelection){
                                currentSelection.p.bg.p.fillStyle = "lightblue";
                            }
                            currentSelection = this;
                            this.p.bg.p.fillStyle = "green";
                            
                            crop.p.label = data.name;
                            val.p.label = "$"+value;
                            sun.p.label = "S "+currentSelection.p.data.sun;
                            water.p.label = "W "+currentSelection.p.data.water;
                            days.p.label = "D "+currentSelection.p.data.days;
                            cost.p.label = "C "+currentSelection.p.data.cost;
                            regrow.p.label = "R "+(currentSelection.p.data.regrow ? "Y" : "N");
                            hp.p.label = "H "+currentSelection.p.data.hp;
                            cont.p.fill = data.rank === 5 ? "white" : data.rank === 4 ? "yellow" : data.rank === 3 ? "tan" : data.rank === 2 ? "silver" : "gold";
                        }
                        if(Q.state.get("money") < currentSelection.p.data.cost){ buttons[0].p.frame = 1; }
                        else { buttons[0].p.frame = 0; }
                    }
                });
            }
            Q.UIController.createOptionsRing(
                    obj,
                    seedOptions,
                    9,
                    {strokeStyle: "gold"}
            );
        },
        checkCanResetAction:function(action){
            switch(action.name){
                //If there is water or a crop on the tilled soil, then we can't reset
                case "till":
                    var loc = action.loc;
                    var plantOn = Q.BattleGrid.getObject(loc);
                    var waterOn = Q.getTileType(loc) === "wateredSoil";
                    if(!plantOn && !waterOn) return true;
                    return false;
                //If the planted seeds have been damaged, can't reset it until the damager has reset
                case "plantseeds":
                    var crop = action.crop;
                    if(!crop.p.damaged) return true;
                    return false;
                //Can always reset water (I think). Only wouldn't be able to if there was some way to dehydrate the soil, but there isn't.
                case "water":
                    return true;
                //If there is another plant in its place that is not it, can't reset.
                case "pick":
                    var loc = action.loc;
                    var plantOn = Q.BattleGrid.getObject(loc);
                    //If theres no plant on, or in the case of regrow, the id matches.
                    if(!plantOn || action.target.p.id === plantOn.p.id) return true;
                    return false;
                //Make sure the thing that has been attacked is not dead. If it is dead, make sure the spot that it was on doesn't have something on it now.
                case "attack":
                    //If this was not the last to damage it, can't go back.
                    if(action.target.p.attackedThisTurn[action.target.p.attackedThisTurn.length - 1] !== this) return false;
                    //The target is destroyed. Can we recreate it?
                    if(action.target.isDestroyed){
                        var objOn = Q.BattleGrid.getObject(action.loc);
                        //Can recreate because there's nothing on top
                        if(!objOn) return true;
                        return false;
                    }
                    //The target also can't have moved
                    if(action.target.p.loc[0] !== action.loc[0] || action.target.p.loc[1] !== action.loc[1]) return false;
                    //If the target is not dead, just refund its hp. This will get messy with mend.
                    return true;
                //Make sure the plant that is getting mended still exists and the last to hit it was this (mend counts as hit as well)
                case "mend":
                    if(!action.target.isDestroyed && action.target.p.attackedThisTurn[action.target.p.attackedThisTurn.length - 1] === this){
                        return true;
                    }
                    return false;
                //Default includes defend, which can always be reset.
                default:
                    return true;
            }
        },
        canResetMove:function(){
            //If there's no one at the location, and any actions that have come after move can be reset, this move can be reset.
            if(this.p.actionsOrder[this.p.actionsOrder.length - 1].name !== "move"){
                for(var i = this.p.actionsOrder.length - 1; i >= 0; i--){
                    //If it fails for any of these action, can't reset move.
                    if(!this.checkCanResetAction(this.p.actionsOrder[i])) return false;
                }
            }
            //Also can't reset move if this character has gotten hurt
            //There can be a "moved" item in the arrya that separates when the char has been attacked (before and after moving).
            if(this.p.attackedThisTurn.length && this.p.attackedThisTurn[this.p.attackedThisTurn.length - 1] !== "moved") return false;
            
            var lastLoc = this.p.didMove;
            var obj = Q.BattleGrid.getObject(lastLoc);
            if(!obj || obj.isA("Home")){
                return true;
            }
            return false;
        },
        canResetAction:function(){
            //If there is a move action after the action we want to reset, we need to be able to reset move first.
            if(this.p.actionsOrder[0].name === "move" && !this.canResetMove()){
                return false;
            }
            for(var i = 0; i < this.p.actionsOrder.length; i++){
                //If we're past the first action and we come across a move, we're all good since it'll reset to that point.
                if(i > 0 && this.p.actionsOrder[i].name === "move") return true;
                //If we can't reset this action, GG
                if(!this.checkCanResetAction(this.p.actionsOrder[i])) return false;
            }
            return true;
        },
        tilesAvailable:function(type){
            switch(type){
                case "till":
                    return Q.rangeController.getTilesAround(this.p.loc, 1).filter(function(tile){return tile[0] === "dirt";}).length;
                case "plant":
                    return Q.rangeController.getTilesAround(this.p.loc, 1).filter(function(tile){return tile[0] === "tilledSoil" || tile[0] === "wateredSoil";}).filter(function(tile){return !Q.BattleGrid.getObject(tile[1]);}).length;
                case "water":
                    return Q.rangeController.getTilesAround(this.p.loc, 1).filter(function(tile){return tile[0] === "tilledSoil";}).length;
                case "pick":
                    return Q.rangeController.getTilesAround(this.p.loc, 1).filter(function(tile){return tile[0] === "tilledSoil" || tile[0] === "wateredSoil";}).filter(function(tile){var obj = Q.BattleGrid.getObject(tile[1]); return obj && obj.p.pickable;}).length;
                case "attack":
                    return Q.rangeController.getTilesAround(this.p.loc, 1).filter(function(tile){var obj = Q.BattleGrid.getObject(tile[1]); return obj && obj.p.hp;}).length;
                case "mend":
                    return Q.rangeController.getTilesAround(this.p.loc, 1).filter(function(tile){var obj = Q.BattleGrid.getObject(tile[1]); return obj && (obj.p.hp !== obj.p.maxHp) && obj.isA("Crop");}).length;
                case "resetmove":
                    return this.canResetMove();
                case "resetaction":
                    return this.canResetAction();
                //For back, we want to return true since it is always available
                default: 
                    return true;
            }
        },
        selectIcon:function(type, data){
            var obj = this;
            switch(type){
                case "move":
                    Q.rangeController.setTiles(2, obj.p.loc, obj.p.data.move, [], obj.p.walkMatrix);
                    obj.prevLoc = [-1, -1];
                    break;
                case "till":
                    //Get the tiles around the character. If they are dirt tiles, they are good.
                    var tiles = Q.rangeController.getTilesAround(obj.p.loc, 1); //1 is the range in diamond shape (TODO: make option for square shape)
                    tiles.forEach(function(tile){
                        if(tile[0] === "dirt"){
                            Q.rangeController.setTile(tile[1][0], tile[1][1], 1);
                        }
                    });
                    break;
                case "plant":
                    obj.showPlantingMenu();
                    return;
                case "plantseeds":
                    obj.p.curCrop = data;
                    //Get the tiles around the character. If they are tilledSoil tiles, they are good.
                    var tiles = Q.rangeController.getTilesAround(obj.p.loc, 1); //1 is the range in diamond shape (TODO: make option for square shape)
                    tiles.forEach(function(tile){
                        if(tile[0] === "tilledSoil" || tile[0] === "wateredSoil"){
                            Q.rangeController.setTile(tile[1][0], tile[1][1], 1);
                        }
                    });
                    break;
                case "water":
                    //Get the tiles around the character. If they are tilledSoil tiles, they are good.
                    var tiles = Q.rangeController.getTilesAround(obj.p.loc, 1); //1 is the range in diamond shape (TODO: make option for square shape)
                    tiles.forEach(function(tile){
                        if(tile[0] === "tilledSoil"){
                            Q.rangeController.setTile(tile[1][0], tile[1][1], 1);
                        }
                    });
                    break;
                case "pick":
                    var objects = Q.BattleGrid.getObjectsWithin(obj.p.loc, 1);
                    objects.forEach(function(obj){
                        if(obj.p.pickable){
                            Q.rangeController.setTile(obj.p.loc[0], obj.p.loc[1], 1);
                        }
                    });
                    break;
                case "attack":
                    var objects = Q.BattleGrid.getObjectsWithin(obj.p.loc, 1);
                    objects.forEach(function(obj){
                        if(obj.p.hp){
                            Q.rangeController.setTile(obj.p.loc[0], obj.p.loc[1], 1);
                        }
                    });
                    break;
                case "defend":
                    //Doubles defense
                    obj.p.tempDef = obj.p.def;
                    var action = { name:"defend", target:obj };
                    obj.p.didAction.push(action);
                    obj.p.actionsOrder.push(action);
                    Q.Resetter.addToActionsOrder({obj: obj, type: "action"});
                    return true;
                case "mend":
                    var objects = Q.BattleGrid.getObjectsWithin(obj.p.loc, 1);
                    objects.forEach(function(obj){
                        if(obj.isA("Crop") && obj.p.hp !== obj.p.maxHp){
                            Q.rangeController.setTile(obj.p.loc[0], obj.p.loc[1], 1);
                        }
                    });
                    break;
                case "resetmove":
                    //If the most recent action was move, then we don't need to reset the actions.
                    if(obj.p.actionsOrder[obj.p.actionsOrder.length - 1].name !== "move"){
                        //Reset actions until we hit move
                        for(var i = 0; i < obj.p.actionsOrder.length; i++){
                            if(obj.p.actionsOrder[i].type === "move"){
                                break;
                            } else {
                                obj.resetAction();
                            }
                        }
                    }
                    obj.resetMove();
                    return;
                case "resetaction":
                    if(obj.p.actionsOrder[obj.p.actionsOrder.length - 1].name === "move"){
                        obj.resetMove();
                    }
                    obj.resetAction();
                    return;
                //Do nothing for back
                default:
                    return true;
            }
            obj.p.detectingTile = type;
            Q.stage().on("clickedStage", obj, "detectTile");
            obj.stage.canSelectObjects = false;
        },
        detectTile:function(pos){
            var char = this;
            var detecting = char.p.detectingTile;
            var loc = Q.getLoc(pos.stageX, pos.stageY);
            if(detecting === "move"){
                //Returns true if the character can move to the selected tile
                if(!Q.rangeController.checkConfirmMove(this, loc)){
                    Q.rangeController.resetGrid();
                    if(this.p.initialMove){
                        this.p.initialMove.changeWorkerAmount(this.p.data.name, 1);
                        this.destroy();
                    }
                }
            } else if(Q.rangeController.checkValidPointerLoc(Q.RangeTileLayer, loc, 1)){
                var action;
                switch(detecting){
                    case "till":
                        Q.stage().lists.TileLayer[1].setTile(loc[0], loc[1], 17);
                        action = { name: "till", loc:loc };
                        break;
                    case "plantseeds":
                        var cropObj = char.stage.insert(new Q.Crop({loc: loc, crop: char.p.curCrop.name}));
                        var cost = char.p.curCrop.cost;
                        Q.state.inc("money", -cost);
                        action = { name: "plantseeds", loc:loc, crop:cropObj, cost: cost };
                        char.p.curCrop = false;
                        char.stage.insert(new Q.DynamicNumber({color:"#000", loc:cropObj.p.loc, text:"$-"+cost, z:char.p.z}));
                        break;
                    case "water":
                        Q.stage().lists.TileLayer[1].setTile(loc[0], loc[1], 18);
                        action = { name: "water", loc:loc};
                        break;
                    case "pick":
                        var obj = Q.BattleGrid.getObject(loc);
                        var value = calculateCropValue(obj.p.data);
                        Q.state.inc("money", value);
                        obj.pickCrop();
                        action = { name: "pick", loc:loc, target:obj, value:value};
                        char.stage.insert(new Q.DynamicNumber({color:"#000", loc:obj.p.loc, text:"$"+value, z:char.p.z}));
                        break;
                    case "attack":
                        var obj = Q.BattleGrid.getObject(loc);
                        action = { name: "attack", loc: loc, target:obj, origDir: this.p.dir};
                        var damage = obj.takeDamage(char.p.data.atk, char);
                        action.damageDealt = damage;
                        char.playAttack(Q.compareLocsForDirection(char.p.loc, obj.p.loc, this.p.dir));
                        char.stage.insert(new Q.DynamicNumber({color:"#000", loc:obj.p.loc, text:"-"+damage, z:char.p.z}));
                        break;
                    case "mend":
                        var obj = Q.BattleGrid.getObject(loc);
                        action = { name: "mend", loc: loc, target:obj, origDir: this.p.dir};
                        var damage = obj.healDamage(char.p.data.atk, char);
                        action.damageDealt = damage;
                        char.playAttack(Q.compareLocsForDirection(char.p.loc, obj.p.loc, this.p.dir));
                        char.stage.insert(new Q.DynamicNumber({color:"#000", loc:obj.p.loc, text:"+"+damage, z:char.p.z}));
                        break;
                }
                char.p.didAction.push(action);
                char.p.actionsOrder.push(action);
                Q.Resetter.addToActionsOrder({obj: char, type: "action"});
                char.p.walkMatrix = new Q.Graph(Q.getMatrix("walk", char.p.team, char.p.didAction.length));
            }
            Q.stage().off("clickedStage", char, "detectTile");
            Q.rangeController.resetGrid();
            char.stage.canSelectObjects = true;
        },
        
        //Move this character to a location based on the passed path
        moveAlong:function(path){
            var newLoc = [path[path.length-1].x,path[path.length-1].y];
            var onHome = Q.stage(0).lists["Home"].filter(function(home){
                return home.p.loc[0] === newLoc[0] && home.p.loc[1] === newLoc[1];
            });
            if(!onHome.length){
                Q.BattleGrid.moveObject(this.p.loc, newLoc, this);
            } else {
                Q.BattleGrid.removeObject(this.p.loc);
            }
            this.p.didMove = this.p.loc;
            this.p.actionsOrder.push({name: "move", loc: this.p.loc});
            Q.Resetter.addToActionsOrder({obj: this, type: "move"});
            
            if(this.p.attackedThisTurn.length) this.p.attackedThisTurn.push("moved");
            
            this.p.calcPath = path;
            this.p.destLoc = newLoc;
            this.add("autoMove");
            var t = this;
            this.on("doneAutoMove",function(){
                t.off("doneAutoMove");
                //If this character hasn't attacked yet this turn, generate a new attackgraph
                if(!t.p.didAction.length){
                    t.p.attackMatrix = new Q.Graph(Q.getMatrix("attack"));
                    //Do the AI action
                    //TEMP
                    if(false&&this.p.team==="enemy") {
                        t.trigger("startAIAction");
                    }
                }
                t.stage.canSelectObjects = true;
                if(onHome.length){
                    onHome[0].changeWorkerAmount(t.p.data.name, 1);
                    t.destroy();
                }
                t.p.initialMove = false;
            });
        }
    });
    Q.component("killable", {
        extend: {
            tempKill:function(){
                this.hide();
            },
            healDamage:function(amount, healer){
                this.p.damaged = true;
                var damage = Math.max(1, amount);
                this.p.hp += damage;
                this.p.attackedThisTurn.push(healer);
                return damage;
            },
            takeDamage:function(amount, attacker){
                this.p.damaged = true;
                var damage = Math.max(1, (amount - (this.p.def + (this.p.tempDef || 0))));
                this.p.hp -= damage;
                if(this.p.hp <= 0){
                    Q.BattleGrid.removeObject(this.p.loc);
                    //Temporarily kill this object. This is so that we can bring it back on reset. Check to see if it's enemy turn to permakill.
                    this.tempKill();
                }
                this.p.attackedThisTurn.push(attacker);
                return damage;
            }
        } 
    });
    Q.Sprite.extend("Crop",{
        init:function(p){
            var crop = p.crop;
            var data = GDATA.dataFiles["game-data.json"].crops.find(function(c){return c.name === crop;});
            this._super(p,{
                hp:1,
                maxHp:data.hp,
                days:0,
                sun:0,
                water:0,
                def:data.def,
                rank:data.rank,
                regrow:data.regrow,
                desc:data.desc,
                name:crop,
                sheet:crop,
                sprite:"Crop",
                type:Q.SPRITE_INTERACTABLE,
                data:data,
                attackedThisTurn:[]
            });
            this.add("animation, killable");
            Q.setXY(this);
            this.play("idle");
            this.on("endDay");
            this.on("selected");
            this.advanceCrop();
        },
        isWatered:function(){
            return Q.getTileType(this.p.loc) === "wateredSoil" ? 1 : 0;
        },
        endDay:function(){
            var wData = GDATA.dataFiles["game-data.json"].weather[this.stage.options.data.weather[0]];
            var watered = this.isWatered();
            if(watered) Q.stage().lists.TileLayer[1].setTile(this.p.loc[0], this.p.loc[1], 17);
            this.p.picked = false;
            this.p.sun += wData.sun || 0;
            this.p.water += wData.water || 0 + watered;
            this.p.days ++;
            this.p.hp =  Math.min(Math.floor(this.p.hp + this.p.maxHp / this.p.data.days), this.p.maxHp);
            this.p.attackedThisTurn = [];
            this.advanceCrop();
        },
        advanceCrop:function(){
            var data = this.p.data;
            if(this.p.days >= data.days && this.p.water >= data.water && this.p.sun >= data.sun){
                this.play("pickable");
                this.p.pickable = true;
            }
        },
        pickCrop:function(){
            if(this.p.regrow){
                this.play("idle");
                this.p.picked = true;
                this.p.pickable = false;
                this.p.sun -= this.p.data.sun;
                this.p.days -= this.p.data.days;
                this.p.water -= this.p.data.water;
            } else {
                this.p.picked = true;
                Q.BattleGrid.removeObject(this.p.loc);
                this.hide();
            }
        },
        reversePick:function(){
            this.p.sun += this.p.data.sun;
            this.p.days += this.p.data.days;
            this.p.water += this.p.data.water;
        },
        removeMenu:function(){
            this.p.cont.destroy();
            this.stage.canSelectObjects = true;
            this.p.z = this.p.y;
            this.stage.off("clickedStage", this, this.removeMenu);
        },
        //Show the status
        selected:function(){
            var obj = this;
            var stage = this.stage;
            var radius = Q.tileW * 1.5;
            this.p.z = 1000000;
            //Display top info (this is pretty custom, so just do it here)
            var cont = new Q.UI.Container({x:0, y:0 - radius, fill:"tan", w: radius * 2, h:radius / 1.5});
            stage.insert(cont, obj);
            var crop = new Q.UI.Text({size:10, x:-cont.p.w/2 + 5, y:-cont.p.h/4, align:"left", label:obj.p.crop, family: "Times New Roman"});
            cont.insert(crop);
            var hp  = new Q.UI.Text({size:8, x:cont.p.w/2 - 5, y:-cont.p.h/4, align:"right", label:obj.p.hp+"/"+obj.p.maxHp, family: "Lucida Console"});
            cont.insert(hp);

            var sun  = new Q.UI.Text({label:"S"+obj.p.sun+"/"+obj.p.data.sun, size:8, x:-cont.p.w/2 + 5, y:cont.p.h/4, align:"left", family: "Lucida Console"});
            cont.insert(sun);
            var water  = new Q.UI.Text({label:"W"+obj.p.water+"/"+obj.p.data.water, size:8, x:0, y:cont.p.h/4, align:"center", family: "Lucida Console"});
            cont.insert(water);
            var days  = new Q.UI.Text({label:"D"+obj.p.days+"/"+obj.p.data.days, size:8, x:cont.p.w/2 - 5, y:cont.p.h/4, align:"right", family: "Lucida Console"});
            cont.insert(days);
            obj.p.cont = cont;
            
            stage.on("clickedStage", this, this.removeMenu);
            stage.canSelectObjects = false;
        }
    });
    Q.UI.Container.extend("ViewSprite",{
        init: function(p) {
            this._super(p, {
                w:Q.width,
                h:Q.height,
                type:Q.SPRITE_UI, 
                dragged:false
            });
            this.add("tween");
            this.on("touch");
            this.on("drag");
        },
        animateTo:function(to, speed, callback){
            if(this.p.obj){
                this.p.obj = false;
                this.off("step","follow");
            }
            if(!speed){
                this.p.x = to.x;
                this.p.y = to.y;
                if(callback){
                    callback();
                }
            } else {
                this.animate({x:to.x,y:to.y},speed,Q.Easing.Quadratic.InOut,{callback:callback || function(){} });
            }
        },
        unfollowObj:function(){
            this.p.obj = false;
        },
        followObj:function(obj){
            this.p.obj = obj;
            this.on("step","follow");
        },
        follow:function(){
            var obj = this.p.obj;
            if(obj){
                this.p.x = obj.p.x;
                this.p.y = obj.p.y;
            } else {
                this.off("step","follow");
            }
        },
        //If we're not following the viewSprite, follow it
        touch:function(){
            if(this.stage.viewport.following !== this){
                Q.viewFollow(this, this.stage);
            }
        },
        drag:function(touch){
            this.p.x = touch.origX - touch.dx / this.stage.viewport.scale;
            this.p.y = touch.origY - touch.dy / this.stage.viewport.scale;
            this.stage.dragged = true;
        },
        centerOn:function(loc){
            var pos = Q.getXY(loc);
            this.p.x = pos.x;
            this.p.y = pos.y;
        }
    });
    Q.component("autoMove", {
        added: function() {
            var p = this.entity.p;
            p.stepX = Q.tileW;
            p.stepY = Q.tileH;
            if(!p.stepDelay) { p.stepDelay = Q.state.get("walkSpeed"); }
            p.stepWait = 0;
            p.stepping=false;
            this.entity.on("step",this,"step");
            p.walkPath = this.moveAlong(p.calcPath);
            p.calcPath=false;
        },

        atDest:function(){
            var p = this.entity.p;
            p.loc = p.destLoc;
            Q.setXY(this.entity);
            this.entity.playStand(p.dir);
            this.entity.del("autoMove");
            this.entity.trigger("doneAutoMove");
            this.entity.trigger("atDest",[(p.x-Q.tileW/2)/Q.tileW,(p.y-Q.tileH/2)/Q.tileH]);
        },
        moveAlong:function(to){
            if(!to){this.atDest();return;};
            var p = this.entity.p;
            var walkPath=[];
            var curLoc = {x:p.loc[0],y:p.loc[1]};
            var going = to.length;
            for(var i=0;i<going;i++){
                var path = [];
                //Going right
                if(to[i].x>curLoc.x){
                    path.push("right");
                //Going left
                } else if(to[i].x<curLoc.x){
                    path.push("left");
                //Stay same
                } else {
                    path.push(false);
                }
                //Going down
                if(to[i].y>curLoc.y){
                    path.push("down");

                //Going up
                } else if(to[i].y<curLoc.y){
                    path.push("up");
                //Stay same
                } else {
                    path.push(false);
                }
                walkPath.push(path);

                curLoc=to[i];

            }
            if(walkPath.length===0||(walkPath[0][0]===false&&walkPath[0][1]===false&&walkPath.length===1)){this.atDest();return;};
            return walkPath;
        },

        step: function(dt) {
            var p = this.entity.p;
            p.stepWait -= dt;
            if(p.stepping) {
                p.x += p.diffX * dt / p.stepDelay;
                p.y += p.diffY * dt / p.stepDelay;
                p.z =  p.y;
            }

            if(p.stepWait > 0) {return; }
            //At destination
            if(p.stepping) {
                p.x = p.destX;
                p.y = p.destY;
                p.walkPath.shift();
                this.entity.trigger("atDest",[(p.x-Q.tileW/2)/Q.tileW,(p.y-Q.tileH/2)/Q.tileH]);
                if(p.walkPath.length===0){
                    this.atDest();
                    return;
                }
            }
            p.stepping = false;

            p.diffX = 0;
            p.diffY = 0;
            //p.walkPath = [["left","up"],["left",false],[false,"up"],["right","down"]]
            if(p.walkPath[0][0]==="left") {
                p.diffX = -p.stepX;
            } else if(p.walkPath[0][0]==="right") {
                p.diffX = p.stepX;
            } else if(p.walkPath[0][1]==="up") {
                p.diffY = -p.stepY;
            } else if(p.walkPath[0][1]==="down"){
                p.diffY = p.stepY;
            }
            //Run the first time
            if(p.diffX || p.diffY ){
                p.destX = p.x + p.diffX;
                p.destY = p.y + p.diffY;
                p.stepping = true;
                p.origX = p.x;
                p.origY = p.y;

                p.stepWait = p.stepDelay;
                p.stepped=true;

                //If we have passed all of the checks and are moving
                if(p.stepping){
                    p.dir="";
                    switch(p.walkPath[0][1]){
                        case "up":
                            p.dir="up";
                            break;
                        case "down":
                            p.dir="down";
                            break;
                    }
                    if(p.dir.length===0){
                        switch(p.walkPath[0][0]){
                            case "right":
                                p.dir+="right";
                                break;
                            case "left":
                                p.dir+="left";
                                break;
                        }
                    }
                    //Play the correct direction walking animation
                    this.entity.playWalk(p.dir);
                };
            }
        }
    });
    Q.GameObject.extend("RangeController",{
        pulse:function(){
            Q.RangeTileLayer.stop();
            this.animatePulse();
        },
        animatePulse:function(){
            Q.RangeTileLayer.animate({opacity:0.7} ,1.2, Q.Easing.Linear).chain({opacity:0.3} , 1, Q.Easing.Linear, {callback:function(){Q.rangeController.animatePulse();}});
        },
        setTile:function(x, y, tile){
            if(!this.tiles) this.tiles = [];
            Q.RangeTileLayer.setTile(x, y, tile);
            this.tiles.push({x: x, y: y});  
        },
        setTiles:function(tile,loc,range,rangeProps,matrix){
            Q.RangeTileLayer.stop();
            var bounds = Q.BattleGrid.getBounds(loc,range);
            var tiles = [];
            //Get all possible move locations that are within the bounds
            for(var i=bounds.tileStartX;i<bounds.tileStartX+bounds.cols;i++){
                for(var j=bounds.tileStartY;j<bounds.tileStartY+bounds.rows;j++){
                    if(matrix.grid[i][j].weight<10000){
                        tiles.push(matrix.grid[i][j]);
                    }
                }
            }
            this.tiles = [];
            //If there is at least one tile
            if(tiles.length){
                //Loop through the possible tiles
                var straight = rangeProps.includes("Straight");
                for(var i=tiles.length-1;i>=0;i--){
                    if(straight){
                        if(tiles[i].x!==loc[0]&&tiles[i].y!==loc[1]){
                            continue;
                        }
                    }
                    //Get the path and then slice it if it goes across caltrops
                    var path = Q.getPath(loc,[tiles[i].x,tiles[i].y],matrix,range+1000);
                    var pathCost = 0;
                    for(var j=0;j<path.length;j++){
                        pathCost+=path[j].weight;
                    }
                    if(path.length>0&&path.length<=range&&pathCost<=range+1000){
                        //If the path is normal
                        if(pathCost<=range){
                            this.setTile(tiles[i].x, tiles[i].y, tile);
                        } 
                        //If the path includes a single caltrops tile
                        else if(pathCost>=1000) {
                            //Only include this path if the last tile is the ZOC tile
                            if(path[path.length-1].weight===1000){
                                this.setTile(tiles[i].x, tiles[i].y, tile);
                            }
                        }
                    }
                }
            //If there's nowhere to move
            } else {
                
            }
            this.pulse();
        },
        setSpecificTile:function(tile,loc){
            this.tiles = this.tiles || [];
            this.setTile(loc[0], loc[1], tile);
            this.pulse();
        },
        resetGrid:function(){
            if(!this.tiles) return;
            this.tiles.forEach(function(tile){
                Q.RangeTileLayer.setTile(tile.x, tile.y, 0);
            });
            this.tiles = [];
        },
        checkConfirmMove:function(user, loc){
            if(this.checkValidPointerLoc(Q.RangeTileLayer, loc, 2)){
                var obj = Q.BattleGrid.getObject(loc);
                if(!obj || obj.isA("Home")){
                    //Follow the mover
                    //Q.viewFollow(user, Q.stage());
                    //Make the character move to the spot
                    user.moveAlong(Q.getPath(user.p.loc, loc, user.p.walkMatrix));
                    //Destroy this range grid
                    this.resetGrid();
                    return true;
                } else {this.cannotDo();}
            } else {this.cannotDo();}
        },
        validateAttack:function(user, loc){
            var obj = Q.BattleGrid.getObject(loc);
            //Make sure the target hasn't died (due to extra attacks)
            if(obj && Q.BattleGrid.removeDead([obj]).length){
                Q.BatCon.previewAttackTarget(user, loc);
                //Destroy this range grid
                this.resetGrid();
                return true;
            } else {this.cannotDo();}
        },
        checkConfirmAttack:function(){
            if(this.checkValidPointerLoc(Q.RangeTileLayer,Q.pointer.p.loc,2)){
                this.validateAttack(this.target);
            }
            
        },
        refresh:function(){
            this.cannotDo --;
            if(this.cannotDo < 0){
                this.cannotDo = 0;
                this.off("step",this,"refresh");
            }
        },
        cannotDo:function(){
            if(this.cannotDo) return;
            Q.audioController.playSound("cannot_do.mp3");
            this.cannotDo = 100;
            this.on("step",this,"refresh");
        },
        //Checks if we've selected a tile
        checkValidPointerLoc:function(tileLayer, loc, validTile){
            return tileLayer.getTile(loc[0], loc[1]) === validTile;
        },
        getPossibleTargets:function(tiles){
            var targets = [];
            for(var i=0;i<tiles.length;i++){
                var target = Q.BattleGrid.getObject([tiles[i].x,tiles[i].y]);
                if(target) targets.push(target);
            }
            return targets;
        },
        getTilesAround:function(loc, radius){
            var tiles = [];
            for(var i=-radius;i<radius+1;i++){
                for(var j=0;j<((radius*2+1)-Math.abs(i*2));j++){
                    if(i===0&&j===radius) j++;
                    var spot = [loc[0] + i, loc[1] + j - ( radius - Math.abs(i) )];
                    tiles.push([Q.getTileType(spot), spot]);
                }
            }
            return tiles;
        }
    });
    Q.UI.Container.extend("DynamicNumber", {
        init:function(p){
            //For bigger boxes, set the w and h values when creating
            //12 is the default size since it's used for the damage box
            this._super(p, {
                color: "black",
                w: Q.tileW,
                h: Q.tileH,
                type:Q.SPRITE_NONE,
                collisionMask:Q.SPRITE_NONE,
                opacity:1,
                size:12,
                text:"",
                fill:"white"
            });
            Q.setXY(this);
            this.p.y -= Q.tileH/2;
            this.add("tween");
            this.animate({ y:this.p.y-Q.tileH, opacity: 0 }, 2, Q.Easing.Quadratic.Out, { callback: function() { this.destroy(); }});
        },

        draw: function(ctx){
            ctx.textAlign="center"; 
            ctx.fillStyle = this.p.color;
            ctx.font      = 'Bold 15px Arial';
            ctx.fillText(this.p.text, 0,0);
        }
    });
};