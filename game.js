'use strict';

const Cell = function (indexNum) {
  let value = '';
  const index = indexNum;

  const addValue = mark => (value = mark);
  const getValue = () => value;
  const getIndex = () => index;
  const isAvailable = () => value === '';

  return { addValue, getValue, getIndex, isAvailable };
};

const GameBoard = (function () {
  const rows = 3;
  const columns = 3;
  const gameBoard = [];
  let index = 0;

  for (let i = 0; i < rows; i++) {
    gameBoard[i] = [];
    for (let j = 0; j < columns; j++) {
      gameBoard[i].push(Cell(++index));
    }
  }

  const getGameBoard = () => gameBoard;

  const printBoard = () =>
    gameBoard.map(row => row.map(cell => cell.getValue()));

  return { getGameBoard, printBoard };
})();

const GameController = (function (
  playerOne = 'Player One',
  playerTwo = 'Computer'
) {
  const players = [
    {
      name: playerOne,
      mark: 'X',
    },
    {
      name: playerTwo,
      mark: 'O',
    },
  ];
  let activePlayer = players[0];
  const getActivePlayer = () => activePlayer;
  const switchPlayer = () =>
    (activePlayer = activePlayer === players[0] ? players[1] : players[0]);

  const getAvailableCells = () =>
    GameBoard.getGameBoard()
      .flat()
      .filter(cell => cell.getValue() === '');

  const checkRows = (activePlayerMark = getActivePlayer().mark) =>
    GameBoard.getGameBoard().some(row =>
      row.every(cell => cell.getValue() === activePlayerMark)
    );

  const checkColumns = (activePlayerMark = getActivePlayer().mark) =>
    GameBoard.getGameBoard().some((row, i, currentBoard) =>
      row.every((_, j) => currentBoard[j][i].getValue() === activePlayerMark)
    );

  const checkDioganals = (activePlayerMark = getActivePlayer().mark) => {
    return GameBoard.getGameBoard().some((row, i, currentBoard) => {
      if (i === 0)
        return row.every(
          (_, j) => currentBoard[j][j].getValue() === activePlayerMark
        );
      if (i === 2) {
        let n = i;
        return row.every(
          (_, j) => currentBoard[j][n--].getValue() === activePlayerMark
        );
      }
    });
  };

  const isWinning = (activePlayerMark = getActivePlayer().mark) =>
    checkRows(activePlayerMark) ||
    checkColumns(activePlayerMark) ||
    checkDioganals(activePlayerMark);

  const isDraw = () => getAvailableCells().length === 0;

  const clearGameBoard = () => {
    GameBoard.getGameBoard().forEach(row =>
      row.forEach(cell => cell.addValue(''))
    );
    activePlayer = players[0];
  };

  const minimax = function (gameBoard, depth, isMaximizingPlayer) {
    const aiPlayerMark = 'O';
    const humanPlayerMark = 'X';
    let bestScore = isMaximizingPlayer ? -Infinity : Infinity;

    if (isWinning(aiPlayerMark)) return 1;
    else if (isWinning(humanPlayerMark)) return -1;
    else if (depth === 0 || getAvailableCells().length === 0) return 0;

    gameBoard.forEach(row =>
      row.forEach(cell => {
        if (cell.isAvailable()) {
          cell.addValue(isMaximizingPlayer ? aiPlayerMark : humanPlayerMark);
          const score = minimax(gameBoard, depth - 1, !isMaximizingPlayer);

          bestScore = isMaximizingPlayer
            ? Math.max(score, bestScore)
            : Math.min(score, bestScore);
          cell.addValue('');
        }
      })
    );

    return bestScore;
  };

  const getRandomNumber = limit => {
    return Math.trunc(Math.random() * (limit + 1));
  };

  const getRandomCell = availableCells => {
    const len = availableCells.length;
    const randomIndexNum = getRandomNumber(len - 1);
    return availableCells[randomIndexNum];
  };

  const bestAIMove = (mode = 'easy') => {
    if (mode !== 'easy') {
      let bestScore = -Infinity;
      let move;
      let depth;
      if (mode === 'medium') depth = 2;
      else if (mode === 'hard') depth = 4;
      else depth = getAvailableCells().length;

      GameBoard.getGameBoard().forEach((row, i) =>
        row.forEach((cell, j) => {
          if (cell.isAvailable()) {
            cell.addValue('O');
            let score = minimax(GameBoard.getGameBoard(), depth - 1, false);
            cell.addValue('');
            if (score >= bestScore) {
              bestScore = score;
              move = { i, j };
            }
          }
        })
      );
      if (move !== undefined) {
        GameBoard.getGameBoard()[move.i][move.j].addValue('O');
      }
    } else {
      const availableCells = getAvailableCells();
      const randomCell = getRandomCell(availableCells);
      randomCell.addValue('O');
    }
  };

  return {
    getActivePlayer,
    switchPlayer,
    getAvailableCells,
    isWinning,
    isDraw,
    clearGameBoard,
    bestAIMove,
  };
})();

const DisplayController = (function () {
  const gameContainer = document.querySelector('.tic-tac-toe');
  const newGameBtn = document.querySelector('.btn');
  const selectEl = document.querySelector('[name="difficulty-levels');

  selectEl.addEventListener('change', () => {
    if (GameController.isWinning() || GameController.isDraw()) return;

    clearDisplay(gameContainer);
    GameController.clearGameBoard();
    updateDisplay(gameContainer);
  });

  newGameBtn.addEventListener('click', () => {
    clearDisplay(gameContainer);
    GameController.clearGameBoard();
    updateDisplay(gameContainer);
    updateGameResult();
  });

  const createDomBoard = () => {
    return GameBoard.getGameBoard().forEach(row =>
      row.forEach(cell => {
        const cellEl = document.createElement('button');
        cellEl.classList.add('cell-btn');
        cellEl.setAttribute('data-index', `${cell.getIndex()}`);
        gameContainer.appendChild(cellEl);

        cellEl.addEventListener('click', () => handleClick(cell));
      })
    );
  };

  const handleClick = cell => {
    if (
      !cell.isAvailable() ||
      GameController.isWinning() ||
      GameController.isDraw()
    )
      return;

    cell.addValue(GameController.getActivePlayer().mark);
    if (GameController.isWinning() || GameController.isDraw()) {
      updateGameResult();
    } else {
      GameController.switchPlayer();
      GameController.bestAIMove(getValue(selectEl));
      if (GameController.isWinning() || GameController.isDraw()) {
        updateGameResult();
      } else GameController.switchPlayer();
    }
    clearDisplay(gameContainer);
    updateDisplay(gameContainer);
  };

  const updateGameResult = () => {
    const resultParagraph = document.querySelector('.result');
    let resultMessage = '';

    if (GameController.isWinning())
      resultMessage = `${GameController.getActivePlayer().name} wins!`;
    else if (GameController.isDraw()) resultMessage = 'Tie!';

    resultParagraph.innerHTML = resultMessage;
    return resultMessage;
  };

  const findMatchingCell = target => {
    return GameBoard.getGameBoard()
      .flat()
      .find(cell => cell.getIndex() === +target.getAttribute('data-index'));
  };

  const createXMark = () => {
    const lineOne = document.createElement('div');
    const lineTwo = document.createElement('div');
    lineOne.classList.add('line-one');
    lineTwo.classList.add('line-two');

    return [lineOne, lineTwo];
  };

  const createOMark = () => {
    const circleEl = document.createElement('div');
    circleEl.classList.add('circle');

    return circleEl;
  };

  const updateDisplay = parentElement => {
    for (const child of parentElement.children) {
      const cell = findMatchingCell(child);
      if (cell.getValue() === 'X')
        createXMark().forEach(part => child.appendChild(part));
      if (cell.getValue() === 'O') child.appendChild(createOMark());
    }
  };

  const clearDisplay = parentElement => {
    for (const child of parentElement.children) {
      child.innerHTML = '';
    }
  };

  const getValue = element => element.value;

  return {
    createDomBoard,
    updateDisplay,
  };
})();

DisplayController.createDomBoard();
