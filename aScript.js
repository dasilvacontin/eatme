
var fps = 60;
var canvas;
var engine;
var players = [];
var myPlayer;
var currentLevel = -1;
var levelLabels = ["Easy", "Medium", "Hard", "Hardcore", "Insane", "Demental", "The Ball Master", "Shazzam!", "Impossibruu", "I'll suicide..", "while(true){}..", "Godlike", "Pentakill", "Karmageddon", "Upcoming crash"];
var playing = false;

var levelSound = document.createElement('audio');
levelSound.setAttribute('src', 'newLevel.wav');
levelSound.load();

var popSound = document.createElement('audio');
popSound.setAttribute('src', 'ping.wav');
popSound.load();

var dieSound = document.createElement('audio');
dieSound.setAttribute('src', 'die.wav');
dieSound.load();



window.onload = function() {

	canvas = document.getElementById('myCanvas');
	engine = new airEngineJS ({canvas:canvas, fps:fps});

	var self = this;
	engine.prerender = function () {
		self.gameLoop();
	}

	newLevel();

	canvas.onmousemove = function (event) {
		if (myPlayer){
			myPlayer.dx = event.pageX - canvas.offsetLeft;
			myPlayer.dy = event.pageY - canvas.offsetTop;
		}
	}

};


function Player (properties) {

	this.x = Math.random()*canvas.width;
	this.y = Math.random()*canvas.height;
	this.dx = this.x;
	this.dy = this.y;
	this.color = '#'+Math.floor(Math.random()*16777215).toString(16);

	console.log(this.color);
	this.evolStage = Math.random()*2+3;
	this.human = false;
	this.distX = 0;
	this.distY = 0;
	this.module = 0;
	this.speed = 1;

	this.logic = function () {

		if (this.evolStage > 0){

			if (!this.human){ //It's AI then.
				var aTarget = targetFor(this);
				if (aTarget) {
					this.dx = aTarget.x;
					this.dy = aTarget.y;
				}
			}

			this.distX = this.dx-this.x;
			this.distY = this.dy-this.y;
			this.module = Math.sqrt(Math.pow(this.distX, 2) + Math.pow(this.distY, 2));


			if (this.human && currentLevel < 5){
				this.speed = 3/this.evolStage + 1 - 0.1*currentLevel;
			} else {
				this.speed = 3/this.evolStage + 0.25;
			}
			

			if (this.module > this.speed){
				this.distX *= this.speed/this.module;
				this.distY *= this.speed/this.module;
			}
			this.x += this.distX;
			this.y += this.distY;
		}
	}	
	this.renderOn = function (c) {

		if (this.evolStage > 0){
			c.context2D.beginPath();
			c.context2D.arc(this.x, this.y, radiusPerEvol(this.evolStage), 0 , 2 * Math.PI, false);
			c.context2D.fillStyle = this.color;
	        c.context2D.fill();
	    }

	}
	this.setHuman = function (theValue) {
		this.human = theValue;
	}
}

Player.prototype = new displayObjectJS ();

function targetFor (p) {
	var j = Math.round(Math.random()*(players.length-1));
	for (var i = 0; i < players.length; i++){
		j++;
		if (j >= players.length){
			j = 0;
		}
		if (players[i] != p && players[i].evolStage > 0 && players[i].evolStage <= p.evolStage){
			return players[i];
		}
	}
	
	return undefined;
	
}

function checkCollisions () {
	for (var i = 0; i < players.length; i++){
		if (players[i].evolStage > 0){
			for (var j = 0; j < players.length; j++){
				if (i != j && players[j].evolStage > 0){
					checkHitBetween(players[i], players[j]);
				}
			}
		}
	}
}


function gameLoop () {

	if (playing) {
		if (myPlayer.evolStage == 0){
			gameOver();
			playing = false;
			setTimeout(resetGame, 4000);
		} else if (players.length == 1){
			setTimeout(nextRound, 2000);
			playing = false;
		}
	}
	checkCollisions();

}

function nextRound () {
	players = [];
	engine.removeDisplayObject(myPlayer);
	newLevel();
}

function resetGame () {
	players = [];
	myPlayer = [];
	engine.displayObjects = [];
	currentLevel--;
	newLevel();
}

function gameOver () {
	myBanner.displayMessage("Game Over");
}

function checkHitBetween (p1, p2) {
	var distX = p2.x - p1.x;
	var distY = p2.y - p1.y;
	var module = Math.sqrt(Math.pow(distX,2)+Math.pow(distY,2));
	if (module < radiusPerEvol(p1.evolStage)+radiusPerEvol(p2.evolStage) && p1.evolStage > 0 && p2.evolStage > 0){
		
		if ((p1.evolStage - p2.evolStage)*0.1*2 + 0.5 > Math.random()){
			p1.evolStage += p2.evolStage*0.5;
			p2.evolStage = 0;
			engine.removeDisplayObject(p2);
			removeObjectFromArray(p2, players);

		} else {
			p2.evolStage += p1.evolStage*0.5;
			p1.evolStage = 0;
			removeObjectFromArray(p1, players);

		}

		if (p1 == myPlayer || p2 == myPlayer){
			if (myPlayer.evolStage > 0){
				popSound.currentTime=0;
				popSound.play();
			} else {
				dieSound.play();
			}
			
		}

	}
}


function radiusPerEvol(level){

	if (level == 0){
		return 0;
	}
	return 1*level;

}

function newLevel () {
	currentLevel++;
	playing = false;
	levelSound.play();
	newBanner(levelLabels[currentLevel]);

	setTimeout(spawnEnemies, 3000);

	myPlayer = new Player ();
		engine.addDisplayObject(myPlayer);
		players.push(myPlayer);
		myPlayer.setHuman(true);
		if (currentLevel < 3){
			myPlayer.evolStage += 3-currentLevel;
		}

}

function spawnEnemies () {
	playing = true;
	for (var i = 0; i < 10 + 10*currentLevel; i++){
		var aPlayer = new Player ();
		engine.addDisplayObject(aPlayer);
		players.push(aPlayer);
	}

}

var colorCode = {
		white: 'rgba(255, 255, 255,',
		black: 'rgba(0,   0,   0,'
	};

function colorWithOpacity (color, opacity) {
	return colorCode[color] + opacity +')';
}

var myBanner;
var BANNER_IDLE = 0, BANNER_OPEN = 1, BANNER_SHOW = 2, BANNER_FADING = 3;

function Banner () {
	this.opacity = 0;
	this.speed = 0.25*fps;
	this.showTime = 1.5*fps;
	this.height = 100;
	this.message = "";
	this.messageArray = [];
	this.phase = BANNER_IDLE;
	this.countdown = 0;

	this.renderOn = function (c) {

		//Stripe
		c.context2D.fillStyle = colorWithOpacity('white', this.opacity/1.1);
		c.context2D.fillRect(0, canvas.height/2-this.height/2, canvas.width, this.height);
		

		//Username
   		c.context2D.font = "normal 10pt Helvetica";
		c.context2D.fillStyle = colorWithOpacity('black', this.opacity);
		c.context2D.textAlign = 'center';
		c.context2D.textBaseline = 'middle';
		c.context2D.fillText(this.message, canvas.width/2, canvas.height/2);

	}

	this.logic = function () {
		switch (this.phase){
			case BANNER_IDLE : 	if (this.messageArray.length > 0){
									this.message = this.messageArray[0];
									this.phase = BANNER_OPEN;
								}
								break;			
			case BANNER_OPEN : 	this.opacity += 1/this.speed;
								if (this.opacity >= 1){
									this.opacity = 1;
									this.phase = BANNER_SHOW;
									this.countdown = this.showTime;
								}
								break;
			case BANNER_SHOW : this.countdown--;
								if (this.countdown <= 0){
									this.phase = BANNER_FADING;
								}
								break;
			case BANNER_FADING: this.opacity -= 1/this.speed;
								if (this.opacity <= 0){
									this.opacity = 0;
									this.phase = BANNER_IDLE;
									this.messageArray.splice(0, 1);
								}
								break;
		}
	}

	this.displayMessage = function (theMessage) {

		this.messageArray.push(theMessage);
		
	}

	engine.hudDisplayObjects.push(this);
}

Banner.prototype = new displayObjectJS({isStatic:true, isCollider:false});


function newBanner(m) {
	if (!myBanner){
		myBanner = new Banner ();
	}

	myBanner.displayMessage(m);
}

function removeObjectFromArray (obj, arr) {
	for (var i = arr.length-1; i >= 0; i--){
		if (arr[i] == obj){
			arr.splice(i, 1);
			return;
		}
	}
}
