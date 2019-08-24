let windowHeight = $(window).height();
let windowWidth = $(window).width();
let player = {} // this player
let orbs = [];
let players = [];

let canvas = document.querySelector('#the-canvas');
let context = canvas.getContext('2d');

canvas.height = windowHeight;
canvas.width = windowWidth;

$(window).load(() => {
  $('#loginModal').modal('show');
})   

$('.name-form').submit((e) => {
  e.preventDefault();
  player.name = document.querySelector('#name-input').value;
  $('#loginModal').modal('hide');
  $('#spawnModal').modal('show');

  document.querySelector('.player-name').innerHTML = player.name;
})

$('.start-game').click((e) => {
  $('.modal').modal('hide');
  $('.hiddenOnStart').removeAttr('hidden');
  init();
})