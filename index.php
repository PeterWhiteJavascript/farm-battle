<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Farm Battle</title>
        <link rel="stylesheet" type="text/css" href="css/style.css">
    </head>
    <body>
        <?php include 'GameFilesLoader.php'; ?>
        
        <!-- Stores canvas and UI elements -->
        <div id="main-content">
            <div id="background-container"></div>
            
            <div id="loading-bar">
                <div id="bar-cont">
                    <div id="bar-bottom"></div>
                    <div id="bar-top"></div>
                    <div id="bar-text"></div>
                </div>
            </div>
            <div id="content-container">
                <canvas id='quintus'></canvas>
            </div>
        </div>
        
    </body>
</html>
