const io = require('../server').io
const checkForOrbCollisions = require('./checkCollision').checkForOrbCollisions;
const checkForPlayerCollisions = require('./checkCollision').checkForPlayerCollisions;

const Orb = require('./classes/Orb')
const PlayerData = require('./classes/PlayerData')
const PlayerConfig = require('./classes/PlayerConfig')
const Player = require('./classes/Player')

let orbs = [];
let players = [];

let settings = {
  defaultOrbs: 500,
  defaultSpeed: 6, 
  defaultSize: 6, 
  defaultZoom: 1.5,
  worldWidth: 500, 
  worldHeight: 500
}

initGame();

setInterval(() => {
  if(players.length > 0) {
    io.to('game').emit('tock', {
      players,
    })
  }
}, 33); 


// there are 30 33s in 1000 millisec, or 1/30th of a sec or 1 of 30 fps
io.sockets.on('connect', (socket) => {
  let player = {};
  player.tickSent = false;

  socket.on('init', (data) => {
    //add players to game namespace
    socket.join('game');
    let playerConfig = new PlayerConfig(settings);
    let playerData = new PlayerData(data.playerName, settings);
    player = new Player(socket.id, playerConfig, playerData);

    setInterval(() => {
      socket.emit('tickTock', {
        playerX: player.playerData.locX,
        playerY: player.playerData.locY
      })
    }, 33);

    socket.emit('initReturn', {
      orbs
    })
    players.push(playerData);
  })
  //client sends a tick 
  socket.on('tick', (data) => {
    player.tickSent = true;

    speed = player.playerConfig.speed;
    xV = player.playerConfig.xVector = data.xVector;
    yV = player.playerConfig.yVector = data.yVector;
  
    if((player.playerData.locX < 5 && player.playerData.xVector < 0) || (player.playerData.locX > settings.worldWidth) && (xV > 0)){
        player.playerData.locY -= speed * yV;
    }else if((player.playerData.locY < 5 && yV > 0) || (player.playerData.locY > settings.worldHeight) && (yV < 0)){
        player.playerData.locX += speed * xV;
    }else{
        player.playerData.locX += speed * xV;
        player.playerData.locY -= speed * yV;
    }  
    let capturedOrb = checkForOrbCollisions(player.playerData, player.playerConfig, orbs, settings);
    capturedOrb
      .then((data) => {
        const orbData = {
          orbIndex: data,
          newOrb: orbs[data]
        }

        io.sockets.emit('updateLeaderBoard', getLeaderBoard());
        io.sockets.emit('orbSwitch',orbData)
    })
      .catch(() => {
        // console.log('no collision');
      })

      let playerDeath = checkForPlayerCollisions(player.playerData, player.playerConfig, players, player.socketId);
      playerDeath.then((data) => {
        io.sockets.emit('updateLeaderBoard', getLeaderBoard());
        io.sockets.emit('playerDeath', data);
      }).catch(() => {
        // console.log('no collision')
      })
  })

  socket.on('disconnect', (data) => {
    if(player.playerData) {
      players.forEach((curPlayer, i) => {
        if(curPlayer.uid == player.playerData.uid) {
          players.splice(i, 1);
          io.sockets.emit('updateLeaderBoard', getLeaderBoard());
        }
      });
    }
  })
})

function getLeaderBoard() {
  players.sort((a, b) => {
    return b.score - a.score;
  })

  let leaderBoard = players.map((curPlayer) => {
    return {
      name: curPlayer.name, 
      score: curPlayer.score
    }
  })
  return leaderBoard
}

function initGame() {
  for(let i = 0; i < 500; i++) {
    orbs.push(new Orb(settings));
  }
}

module.exports = io;