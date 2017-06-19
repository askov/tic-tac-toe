//---------------------------------- Globals ---------------------------------//
// Turn state x | 0
var turn = 'x';
// Score
var score = [0, 0];
var gameOn = false;
// Contains data about occupied squares for x & 0
// and free squares left
var meta = {
  'x': [],
  '0': [],
  free: ['1', '2', '3', '4', '5', '6', '7', '8', '9']
};
// Contains win combinations for 3x3 grid
const winCombs = [
  ['1', '4', '7'],
  ['2', '5', '8'],
  ['3', '6', '9'],
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['1', '5', '9'],
  ['3', '5', '7']
];
const edges = ['2', '4', '6', '8'];
const corners = ['1', '3', '7', '9'];

//----------------------------- Event listeners ------------------------------//
document.addEventListener("DOMContentLoaded", ready);
// Processes user click on game field
var squares = document.querySelectorAll('.game-field > div');
Array.prototype.forEach.call(squares, function(item) {
  item.addEventListener('click', processUserAction);
});
// Restart game
var clearBtn = document.getElementById('clear-field');
clearBtn.addEventListener('click', reset);
// Radiobuttons chose role
var roleSelect = document.querySelectorAll('input[name="role"]');
Array.prototype.forEach.call(roleSelect, function(item) {
  item.addEventListener('click', reset);
});
var difficultySelect = document.querySelectorAll('input[name="difficulty"]');
Array.prototype.forEach.call(difficultySelect, function(item) {
  item.addEventListener('click', reset);
});
var modeSelect = document.querySelectorAll('input[name="mode"]');
Array.prototype.forEach.call(modeSelect, function(item) {
  item.addEventListener('click', switchMode);
});

var settingsIcon = document.getElementsByClassName('icon-container')[0];
settingsIcon.addEventListener('click', showMenu);

//-------------------------------- Game logic --------------------------------//
function ready() {
  switchMode();
  reset();
}
// Switches game modes between one player and two players
function switchMode() {
  if (document.getElementById('mode-one').checked) {
    document.querySelector('form[name=choose-difficulty]').style.display = 'block';
    document.querySelector('form[name=choose-role]').style.display = 'block';
  } else if (document.getElementById('mode-two').checked) {
    document.querySelector('form[name=choose-difficulty]').style.display = 'none';
    document.querySelector('form[name=choose-role]').style.display = 'none';
  }
  reset();
}

function reset() {
  score = [0, 0];
  updateScore();
  restartGame();
}


// Restarts the game
function restartGame() {
  // Reset free squares and rounds history
  meta.free = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  meta['x'] = [];
  meta['0'] = [];
  // x turn always first
  turn = 'x';
  // Remove endgame screen
  document.querySelector('.stroke').innerHTML = '';
  document.querySelector('.stroke').style.display = 'none';
  // Clear field
  Array.prototype.forEach.call(squares, function(item) {
    while (item.hasChildNodes()) {
      item.removeChild(item.firstChild);
    }
  });
  if (document.getElementById('mode-one').checked) {
    updateMessage('Start the game or choose player');
  } else {
    updateMessage('Start the game');
  }
  if (document.getElementById('role-0').checked
  && document.getElementById('mode-one').checked) {
    forcePlayerTwoTurn();
  }
}

// Checks if someone won this turn and calls endgame events
function checkGameOver() {
  // Check win state only when at least 5 squares occupied
  if (meta.free.length < 5) {
    for (var i = 0; i < winCombs.length; i++) {
      // Check if X win
      if (containsArrray(meta['x'], winCombs[i])) {
        score[0] += 1;
        updateScore();
        updateMessage('X won!');
        finishGame(winCombs[i]);
        return true;
      }
      // Check if 0 win
      if (containsArrray(meta['0'], winCombs[i])) {
        score[1] += 1;
        updateScore();
        updateMessage('0 won!');
        finishGame(winCombs[i]);
        return true;
      }
    }
    // Tie
    if (!meta.free.length) {
      updateMessage('Draw!');
      finishGame(null);
      return true;
    }
  }
  updateMessage((turn === 'x' ? '0' : 'X') + ' turn');
  return false;
}

// Game finish
function finishGame(combo) {
  gameOn = false;
  combo ? drawStroke(combo) : {};
  window.setTimeout(restartGame, 1000);
}

// Processes user click on game field
function processUserAction(event) {
  var element = event.target;
  if (playerOneTurn(element)) {
    if (document.getElementById('mode-one').checked) {
      window.setTimeout(playerTwoTurn, 500);
    }
  }
}
// Always human
function playerOneTurn(element) {
  // Move only in your turn
  var role = document.querySelector('input[id^=role-]:checked').id.slice(-1);
  if ((turn === role
    && document.getElementById('mode-one').checked)
    || document.getElementById('mode-two').checked) {
    // Check if square clicked is occupied
    var index = meta.free.indexOf(element.id.slice(-1));
    if (index !== -1) {
      gameOn = true;
      meta[turn].push(meta.free.splice(index, 1)[0]);
      drawMark(element);
      console.log("Nice move, player1!");
      checkGameOver();
      turn = turn === 'x' ? '0' : 'x';
      return true;
    } else {
      console.log("Square is already occupied!");
      return false;
    }
  } else {
    console.log("It's not your turn, cheater!");
    return false;
  }
}
// Computer or human player 2
function playerTwoTurn() {
  if (gameOn && document.getElementById('mode-one').checked) {
    var freeElement;
    if (document.getElementById('difficulty-easy').checked) {
      freeElement = randomMove();  // Easy
    } else if (document.getElementById('difficulty-normal').checked) {
      freeElement = preventiveStrategy();  // Prevent
    } else if (document.getElementById('difficulty-hard').checked) {
      freeElement = offensiveStrategy(); // Offensive
    } else if (document.getElementById('difficulty-hardcore').checked) {
      freeElement = neverLoseStrategy();  // Never lose
    }
    console.log("Nice move, player2!", freeElement);
    var index = meta.free.indexOf(freeElement);
    meta[turn].push(meta.free.splice(index, 1)[0]);
    var element = document.getElementById('square-' + freeElement);
    drawMark(element);
    checkGameOver();
    turn = turn === 'x' ? '0' : 'x';
  }
}
// Forces player2 to start turn
function forcePlayerTwoTurn() {
  if (document.getElementById('role-0').checked) {
    gameOn = true;
    // document.querySelector('.role-select > fieldset').disabled = true;
    playerTwoTurn();
  }
}

//-------------------------------- Strategies --------------------------------//

// Strategy 1. Computer occupies random free square
// - no options
function randomMove() {
  var freeElement = getRandomArrayItem(meta.free);
  return !freeElement ? null : freeElement;
}
// Strategy 2. Computer tries to prevent your win by breaking
// your 2 of 3 win combinations if any. If not - occupies random
// free square.
function preventiveStrategy() {
  return checkLossAvailable() ? checkLossAvailable() : randomMove();
}
// Strategy 3. Computer tries to win completing his own 2 of 3
// combinations if any. Otherwise tries to prevent your win
// by breaking your 2 of 3 win combinations if any.
// If not - occupies random free square.
function offensiveStrategy() {
  if (checkWinAvailable()) {
    return checkWinAvailable();
  } else if (checkLossAvailable()) {
    return checkLossAvailable();
  } else {
    console.log('Random move!');
    return randomMove();
  }
}
// Strategy 4. Computer uses unbeatable strategies
function neverLoseStrategy() {
  var opponent = turn === 'x' ? '0': 'x';
  if (!meta[opponent].length) {
    // return getRandomArrayItem(['1', '3', '7', '9', '5']);
    console.log('I just pick center!');
    return '5';
  }
  if (meta[opponent].length === 1) {
    // Opponent has 5. Move to any corner
    if (meta[opponent][0] === '5' && !meta[turn].length) {
      console.log('I choose any corner, center is yours!');
      return getRandomArrayItem(['1', '3', '7', '9']);
    }
    // Opponent has one of the corner squares. Occupie center.
    if (['1', '3', '7', '9'].indexOf(meta[opponent][0]) > -1 && !meta[turn].length) {
      console.log('I occupie center!');
      return '5';
    }
    // You have central square (5) and your opponent has edge square. Just pick random corner.
    if (meta[turn][0] === '5' && edges.indexOf(meta[opponent][0]) > -1) {
      console.log('I choose any corner, because you picked edge!');
      return getRandomArrayItem(corners);
      // You have central square (5) and your opponent has corner square. Pick opposite corner.
    } else if (meta[turn][0] === '5' && edges.indexOf(meta[opponent][0]) === -1) {
      console.log('I choose opposite corner!');
      return getOppositeCorner(meta[opponent][0]);
    }
  } else if (meta[opponent].length === 2) {
    if (checkWinAvailable()) {
      return checkWinAvailable();
    } else if (checkLossAvailable()) {
      return checkLossAvailable();
    } else {
      if (containsArrray(['1', '9'], meta[opponent]) || containsArrray(['3', '7'], meta[opponent])) {
        console.log('Setting free edge!');
        return getRandomArrayItem(getFreeEdges());
      }
      console.log('intersect', arrayIntersection(edges, meta[opponent]));
      return getCornerWithoutNeighbour(arrayIntersection(edges, meta[opponent])[0]);
    }
  }
  return offensiveStrategy();
}
// Returns free edges
function getFreeEdges() {
  return arrayIntersection(edges, meta.free);
}
// Returns opposite corner
function getOppositeCorner(square) {
  var oc = {'1': '9', '3': '7', '7': '3', '9': '1'};
  return oc.hasOwnProperty(square) ? oc[square] : null;
}
// Returns free corner without edge neighbour
function getCornerWithoutNeighbour(edge) {
  if (['2', '4'].indexOf(edge) === -1 && meta.free.indexOf('1') > -1) {
    return '1';
  } else if (['2', '6'].indexOf(edge) === -1 && meta.free.indexOf('3') > -1) {
    return '3';
  } else if (['4', '8'].indexOf(edge) === -1 && meta.free.indexOf('7') > -1) {
    return '7';
  } else if (['6', '8'].indexOf(edge) === -1 && meta.free.indexOf('9') > -1) {
    return '9';
  } else {
    return null;
  }
}
// Checks if player is able to finish game. player = 'x' | '0'
function checkCompleteAvailable(player) {
  for (var i = 0; i < winCombs.length; i++) {
    var move = containsTwoOfThree(meta[player], winCombs[i]);
    if (move && meta.free.indexOf(move) > -1) {
      return move;
    }
  }
  return null;
}
// Returns missing element from subarray when array contains
// 2 of 3 elements of the subarray, otherwise returns null.
function containsTwoOfThree(array, subarray) {
  var count = 0;
  var missingElement;
  for (var i = 0; i < subarray.length; i++) {
    if (array.indexOf(subarray[i]) > -1) {
      count += 1;
    } else {
      missingElement = subarray[i];
    }
  }
  return count === 2 ? missingElement : null;
}
// Checks if current player is able to win
function checkWinAvailable() {
  return checkCompleteAvailable(turn);
}
// Checks if current player is able to lose
function checkLossAvailable() {
  return checkCompleteAvailable(turn === 'x' ? '0' : 'x');
}
//------------------------ Draw functions -----------------------//

// Returns coordinates in % to draw winner stroke
function winnerStrokeCoords(comb) {
  var oneSixths = String((100 / 6).toFixed(2)) + '%';
  var fiveSixths = String((100 - 100 / 6).toFixed(2)) + '%';
  var combStr = comb.join('');
  if (combStr === '147') {
    return [oneSixths, '5%', oneSixths, '95%'];
  } else if (combStr === '258') {
    return ['50%', '5%', '50%', '95%'];
  } else if (combStr === '369') {
    return [fiveSixths, '5%', fiveSixths, '95%'];
  } else if (combStr === '123') {
    return ['5%', oneSixths, '95%', oneSixths];
  } else if (combStr === '456') {
    return ['5%', '50%', '95%', '50%'];
  } else if (combStr === '789') {
    return ['5%', fiveSixths, '95%', fiveSixths];
  } else if (combStr === '159') {
    return ['5%', '5%', '95%', '95%'];
  } else if (combStr === '357') {
    return ['95%', '5%', '5%', '95%'];
  }
}
// Draws winner combination stroke
function drawStroke(comb) {
  var coords = winnerStrokeCoords(comb);
  var stroke = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  stroke.setAttribute('x1', coords[0]);
  stroke.setAttribute('y1', coords[1]);
  stroke.setAttribute('x2', coords[2]);
  stroke.setAttribute('y2', coords[3]);
  stroke.setAttribute('style', "stroke-width:10px");
  document.querySelector('.stroke').appendChild(stroke);
  document.querySelector('.stroke').style.display = 'block';
}
// Draws nought or cross depending on turn state
function drawMark(element) {
  if (turn === 'x') {
    element.innerHTML = '<svg><g transform="scale(1, 1)"><line x1="20%" y1="20%" x2="80%" y2="80%" /><line x1="80%" y1="20%" x2="20%" y2="80%" /></g></svg>';
  } else {
    element.innerHTML = '<svg><g transform="scale(1, 1)"><circle cx="50%" cy="50%" r="30%" /></g></svg>';
  }
}
//---------------------------- General-purpose logic -------------------------//
// Return random item from array
function getRandomArrayItem(array) {
  var max = array.length;
  return max === 0 ? null : max === 1 ? array[0] : array[Math.floor(Math.random() * max)];
}
// Checks if array contains all of the subarray elements
function containsArrray(array, subarray) {
  for (var i = 0; i < subarray.length; i++) {
    if (array.indexOf(subarray[i]) === -1) {
      return false;
    }
  }
  return true;
}
// Returns array intersection
function arrayIntersection(array1, array2) {
  return array1.filter(function(el) {
    return array2.indexOf(el) > -1;
  });
}
//---------------------------------- UI update -------------------------------//
function updateMessage(message) {
  document.querySelector('.status-message > p').innerHTML = message;
}

function updateScore() {
  document.querySelector('.score > p').innerHTML = score[0] + ' : ' + score[1];
}

function showMenu() {
  // Settings menu trigger
  var y;
  if (document.querySelector('.column-1').style.display === 'block') {
    y = 'none';
  } else if (document.querySelector('.column-1').style.display === 'none') {
    y = 'block';
  } else {
    y = 'block';
  }
  document.querySelector('.column-1').style.display = y;
}
