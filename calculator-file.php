<?php
$data  = json_decode(file_get_contents('data/game-data.json'));
?>

<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Crops Calculator</title>
        <link rel="stylesheet" type="text/css" href="css/calculator-file.css">
    </head>
    <body>
        <script src="lib/jquery-3.1.1.js"></script>
        <script src="lib/jquery-ui.min.js"></script>
        <script src="js/utility.js"></script>
        
        <script>
            var data = <?php echo json_encode($data); ?>;
            $(function(){
                var crops = data.crops;
                function adjustEntries(){
                    for(var i = crops.length - 1; i > -1; i--){
                        $(".Table-header").after($("#"+crops[i].name));
                    }
                }
                function sortItemsByValue(prop, descending){
                    prop = prop.toLowerCase();
                    if(descending === "true"){
                        crops.sort(function(a, b){
                            return b[prop] - a[prop];
                        });
                    } else {
                        crops.sort(function(a, b){
                            return a[prop] - b[prop];
                        });
                    }
                    adjustEntries();
                };
                function sortItemsByName(prop, descending){
                    prop = prop.toLowerCase();
                    if(descending === "true"){
                        crops.sort(function(a, b){
                            var name1 = a[prop].toUpperCase();
                            var name2 = b[prop].toUpperCase();
                            if (name1 < name2) { return -1; }
                            if (name1 > name2) { return 1; }
                            return 0;
                        });
                    } else {
                        crops.sort(function(a, b){
                            var name1 = a[prop].toUpperCase();
                            var name2 = b[prop].toUpperCase();
                            if (name1 > name2) { return -1; }
                            if (name1 < name2) { return 1; }
                            return 0;
                        });
                    }
                    adjustEntries();
                };
                //Create entries for each crop. Sorting just moves them around.
                crops.forEach(function(crop, i){
                    var table = $("#crops-table");
                    crop.sell = calculateCropValue(crop);
                    var row = $("<div class='Table-row' id='"+crop.name+"'></div>");
                    row.append('<div class="Table-row-item">'+crop.name+'</div>');
                    row.append('<div class="Table-row-item">'+crop.cost+'</div>');
                    row.append('<div class="Table-row-item">'+crop.sell+'</div>');
                    row.append('<div class="Table-row-item">'+crop.days+'</div>');
                    row.append('<div class="Table-row-item">'+crop.sun+'</div>');
                    row.append('<div class="Table-row-item">'+crop.water+'</div>');
                    row.append('<div class="Table-row-item">'+crop.regrow+'</div>');
                    row.append('<div class="Table-row-item">'+crop.rank+'</div>');
                    row.append('<div class="Table-row-item">'+i+'</div>');
                    table.append(row);
                    crop.id = i;
                    crop.regrow = crop.regrow.toString();
                });
                $(".Table-header").children(".Table-row-item").on("click",function(){
                    var idx = $(this).index();
                    var isNum = parseInt($(".Table-row:eq(1)").children(".Table-row-item:eq("+idx+")").text());
                    var descending = $(this).attr("descending") === "true" ? "false" : "true";
                    if(isNum >= 0){
                        sortItemsByValue($(this).children(".title").text(), descending);
                    } else {
                        sortItemsByName($(this).children(".title").text(), descending);
                    }
                    $(this).attr("descending", descending);
                    
                    $("#direction-arrow").removeClass();
                    $("#direction-arrow").addClass($(this).attr("descending") === "true" ? "up" : "down");
                    $(this).append($("#direction-arrow"));
                });
            });
        </script>
        
        <div id="main">
            <div id="crops-table" class="Table">
                <div class="Table-row Table-header">
                    <div class="Table-row-item"><div class="title">Name</div></div>
                    <div class="Table-row-item"><div class="title">Cost</div></div>
                    <div class="Table-row-item"><div class="title">Sell</div></div>
                    <div class="Table-row-item"><div class="title">Days</div></div>
                    <div class="Table-row-item"><div class="title">Sun</div></div>
                    <div class="Table-row-item"><div class="title">Water</div></div>
                    <div class="Table-row-item"><div class="title">Regrow</div></div>
                    <div class="Table-row-item"><div class="title">Rank</div></div>
                    <div class="Table-row-item"><div class="title">ID</div><div id="direction-arrow" class="down"></div></div>
                </div>
            </div>
        </div>
        
    </body>
</html>