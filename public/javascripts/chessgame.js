const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((column, columnIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + columnIndex)%2 === 0 ? "light" : "dark");
        
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = columnIndex;

            const square = column;
            if(square){
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = (playerRole === square.color && chess.turn() === playerRole);

                squareElement.appendChild(pieceElement);

                pieceElement.addEventListener("dragstart", (e) => {
                    if(pieceElement.draggable){
                        draggedPiece = pieceElement;
                        sourceSquare = {row: rowIndex, col: columnIndex};

                        e.dataTransfer.setData("text/plain", "");

                        const ghost = pieceElement.cloneNode(true);
                        ghost.style.position = "absolute";
                        ghost.style.top = "-1000px"; 
                        document.body.appendChild(ghost);

                        e.dataTransfer.setDragImage(ghost, 18, 18);

                        setTimeout(() => document.body.removeChild(ghost), 0);
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });
            }

            squareElement.addEventListener("dragover", function(e) {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function(e) {
                e.preventDefault();
                if(draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),                
                    };

                    handleMove(sourceSquare, targetSource);
                };
            });

            boardElement.appendChild(squareElement);
        });
    });

    if(playerRole === "b"){
        boardElement.classList.add("flipped");
    }

    else{
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q',
    };

    const result = chess.move(move);

    if(result){
        renderBoard();
        socket.emit("move", move);
    }
    else{
        console.log("Invalid move: ", move);
    }
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♟", 
        r: "♜", 
        n: "♞", 
        b: "♝", 
        q: "♛", 
        k: "♚",
        P: "♙", 
        R: "♖", 
        N: "♘", 
        B: "♗", 
        Q: "♕", 
        K: "♔",
    };

    const key = piece.color === "w" ? piece.type.toUpperCase() : piece.type;
    return unicodePieces[key] || "";
};

socket.on("playerRole", function(role) {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function() {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function(fen) {
    chess.load(fen);
    renderBoard();
});

socket.on("move", function(move) {
    chess.move(move);
    renderBoard();
});

socket.on("gameOver", function(result){
    let message = "";

    if(result.checkmate){
        message = `Checkmate! ⚔️ <br>
        ${result.winner} Wins! 🎉`
    }

    else if(result.draw){
        message = `It's a draw! 🤝`
    }

    showGameResult(message);
});

function showGameResult(message) {
    const resultDiv = document.createElement("div");
    resultDiv.innerHTML = `
        <p>${message}</p>
        <button class="play-again-btn" onclick="window.location.reload()">Play Again</button>
    `;
    resultDiv.classList.add("game-result");
    document.body.appendChild(resultDiv);
}


renderBoard();


