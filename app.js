// Global state
let selectedImage = null;
let selectedPieceCount = 40;
let currentPuzzle = null;
let pieceGroups = []; // Track connected pieces

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializePieceSelection();
    initializeImageUpload();
    initializeButtons();
    loadSavedPuzzles();
    displayPuzzleLibrary();
});

// Piece count selection handler
function initializePieceSelection() {
    document.querySelectorAll('.piece-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.piece-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedPieceCount = parseInt(option.dataset.pieces);
        });
    });
}

// Image upload handler
function initializeImageUpload() {
    document.getElementById('imageInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                selectedImage = event.target.result;
                document.getElementById('startBtn').disabled = false;
                // Save to library
                savePuzzleToLibrary(selectedImage);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Save puzzle image to localStorage
function savePuzzleToLibrary(imageData) {
    const puzzles = getSavedPuzzles();
    const puzzleId = 'puzzle_' + Date.now();
    puzzles.push({
        id: puzzleId,
        image: imageData,
        timestamp: new Date().toISOString(),
        name: `Puzzle ${puzzles.length + 1}`
    });
    localStorage.setItem('jigsawPuzzles', JSON.stringify(puzzles));
    displayPuzzleLibrary();
}

// Get saved puzzles from localStorage
function getSavedPuzzles() {
    try {
        const puzzles = localStorage.getItem('jigsawPuzzles');
        return puzzles ? JSON.parse(puzzles) : [];
    } catch (e) {
        return [];
    }
}

// Load saved puzzles on startup
function loadSavedPuzzles() {
    const puzzles = getSavedPuzzles();
    console.log(`Loaded ${puzzles.length} saved puzzles`);
}

// Display puzzle library
function displayPuzzleLibrary() {
    const puzzles = getSavedPuzzles();
    let libraryContainer = document.getElementById('puzzleLibrary');
    
    if (!libraryContainer) {
        // Create library container if it doesn't exist
        libraryContainer = document.createElement('div');
        libraryContainer.id = 'puzzleLibrary';
        libraryContainer.className = 'puzzle-library';
        const setupPanel = document.getElementById('setupPanel');
        setupPanel.insertBefore(libraryContainer, setupPanel.firstChild);
    }
    
    if (puzzles.length === 0) {
        libraryContainer.innerHTML = '<p class="library-empty">No saved puzzles yet. Upload an image to start!</p>';
        return;
    }
    
    libraryContainer.innerHTML = '<h3>Your Puzzle Library</h3><div class="library-grid"></div>';
    const grid = libraryContainer.querySelector('.library-grid');
    
    puzzles.forEach((puzzle, index) => {
        const item = document.createElement('div');
        item.className = 'library-item';
        item.innerHTML = `
            <img src="${puzzle.image}" alt="${puzzle.name}">
            <div class="library-item-actions">
                <button class="btn-small" onclick="loadPuzzleFromLibrary('${puzzle.id}')">Play</button>
                <button class="btn-small btn-delete" onclick="deletePuzzleFromLibrary('${puzzle.id}')">Delete</button>
            </div>
        `;
        grid.appendChild(item);
    });
}

// Load puzzle from library
window.loadPuzzleFromLibrary = function(puzzleId) {
    const puzzles = getSavedPuzzles();
    const puzzle = puzzles.find(p => p.id === puzzleId);
    if (puzzle) {
        selectedImage = puzzle.image;
        document.getElementById('startBtn').disabled = false;
    }
};

// Delete puzzle from library
window.deletePuzzleFromLibrary = function(puzzleId) {
    let puzzles = getSavedPuzzles();
    puzzles = puzzles.filter(p => p.id !== puzzleId);
    localStorage.setItem('jigsawPuzzles', JSON.stringify(puzzles));
    displayPuzzleLibrary();
};

// Button event handlers
function initializeButtons() {
    document.getElementById('startBtn').addEventListener('click', () => {
        if (selectedImage) {
            startPuzzle(selectedImage, selectedPieceCount);
        }
    });

    document.getElementById('newPuzzleBtn').addEventListener('click', resetPuzzle);
}

// Start a new puzzle game
function startPuzzle(imageSrc, pieceCount) {
    document.getElementById('setupPanel').style.display = 'none';
    document.getElementById('gameArea').classList.add('active');
    document.getElementById('successMessage').classList.remove('show');

    const img = new Image();
    img.onload = () => {
        createPuzzle(img, pieceCount);
    };
    img.src = imageSrc;
}

// Reset to setup screen
function resetPuzzle() {
    document.getElementById('gameArea').classList.remove('active');
    document.getElementById('setupPanel').style.display = 'flex';
    document.getElementById('successMessage').classList.remove('show');
    document.getElementById('imageInput').value = '';
    document.getElementById('startBtn').disabled = true;
    selectedImage = null;
}

// Create puzzle pieces and layout
function createPuzzle(img, totalPieces) {
    const puzzleBoard = document.getElementById('puzzleBoard');
    const piecesTray = document.getElementById('piecesTray');
    puzzleBoard.innerHTML = '';
    piecesTray.innerHTML = '';

    // Calculate optimal grid dimensions based on image aspect ratio
    const { cols, rows, actualPieces } = calculateGridDimensions(img, totalPieces);

    // Update UI with actual piece count
    document.getElementById('totalCount').textContent = actualPieces;
    document.getElementById('placedCount').textContent = '0';

    // Set board dimensions
    const { boardWidth, boardHeight, pieceWidth, pieceHeight } = calculateBoardDimensions(
        puzzleBoard, img, cols, rows
    );

    puzzleBoard.style.width = boardWidth + 'px';
    puzzleBoard.style.height = boardHeight + 'px';

    // Create and slice image into pieces
    const pieces = createPuzzlePieces(img, cols, rows, pieceWidth, pieceHeight);

    // Shuffle and place pieces in tray
    shuffleArray(pieces);
    layoutPiecesInTray(pieces, piecesTray, pieceWidth, pieceHeight);

    // Initialize puzzle state
    currentPuzzle = {
        totalPieces: actualPieces,
        placedPieces: 0,
        pieceWidth,
        pieceHeight,
        cols,
        rows
    };

    // Initialize piece groups (each piece starts in its own group)
    pieceGroups = pieces.map(piece => ({
        pieces: [piece],
        leader: piece
    }));

    // Make all pieces draggable
    pieces.forEach(piece => makeDraggable(piece, puzzleBoard, piecesTray, pieceWidth, pieceHeight));
}

// Calculate optimal grid layout
function calculateGridDimensions(img, totalPieces) {
    const aspectRatio = img.width / img.height;
    let cols = Math.round(Math.sqrt(totalPieces * aspectRatio));
    let rows = Math.round(totalPieces / cols);

    // Adjust to get exact piece count
    while (cols * rows < totalPieces) {
        if (cols * aspectRatio < rows) cols++;
        else rows++;
    }
    while (cols * rows > totalPieces) {
        if (cols * aspectRatio > rows) cols--;
        else rows--;
    }

    return { cols, rows, actualPieces: cols * rows };
}

// Calculate board and piece dimensions
function calculateBoardDimensions(puzzleBoard, img, cols, rows) {
    const aspectRatio = img.width / img.height;
    const boardWidth = Math.min(puzzleBoard.parentElement.clientWidth - 40, 600);
    const boardHeight = boardWidth / aspectRatio;
    const pieceWidth = boardWidth / cols;
    const pieceHeight = boardHeight / rows;

    return { boardWidth, boardHeight, pieceWidth, pieceHeight };
}

// Create individual puzzle pieces with jigsaw shapes
function createPuzzlePieces(img, cols, rows, pieceWidth, pieceHeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const pieces = [];
    const pieceImgWidth = img.width / cols;
    const pieceImgHeight = img.height / rows;

    // Generate tab pattern for each piece (true = tab out, false = tab in)
    const tabsRight = [];
    const tabsBottom = [];
    
    for (let row = 0; row < rows; row++) {
        tabsRight[row] = [];
        for (let col = 0; col < cols; col++) {
            tabsRight[row][col] = Math.random() > 0.5;
        }
    }
    
    for (let row = 0; row < rows; row++) {
        tabsBottom[row] = [];
        for (let col = 0; col < cols; col++) {
            tabsBottom[row][col] = Math.random() > 0.5;
        }
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Determine if edges are on puzzle boundary (should be flat)
            const isTopEdge = row === 0;
            const isRightEdge = col === cols - 1;
            const isBottomEdge = row === rows - 1;
            const isLeftEdge = col === 0;
            
            // Determine tabs for interior edges only
            const hasTabTop = row > 0 ? !tabsBottom[row - 1][col] : null;
            const hasTabRight = col < cols - 1 ? tabsRight[row][col] : null;
            const hasTabBottom = row < rows - 1 ? tabsBottom[row][col] : null;
            const hasTabLeft = col > 0 ? !tabsRight[row][col - 1] : null;

            const pieceCanvas = document.createElement('canvas');
            const tabSize = pieceImgWidth * 0.2;
            
            // Calculate canvas size - no extra space on boundary edges
            const extraLeft = isLeftEdge ? 0 : tabSize;
            const extraRight = isRightEdge ? 0 : tabSize;
            const extraTop = isTopEdge ? 0 : tabSize;
            const extraBottom = isBottomEdge ? 0 : tabSize;
            
            // Use higher resolution for smoother edges
            const scale = 2;
            pieceCanvas.width = (pieceImgWidth + extraLeft + extraRight) * scale;
            pieceCanvas.height = (pieceImgHeight + extraTop + extraBottom) * scale;
            const pieceCtx = pieceCanvas.getContext('2d', { alpha: true });
            pieceCtx.scale(scale, scale);
            
            // Enable anti-aliasing for smoother edges
            pieceCtx.imageSmoothingEnabled = true;
            pieceCtx.imageSmoothingQuality = 'high';

            // Clear canvas with transparency
            pieceCtx.clearRect(0, 0, pieceCanvas.width, pieceCanvas.height);

            // Create the jigsaw path
            pieceCtx.save();
            pieceCtx.beginPath();
            createJigsawPath(
                pieceCtx, extraLeft, extraTop, pieceImgWidth, pieceImgHeight,
                hasTabTop, hasTabRight, hasTabBottom, hasTabLeft, tabSize,
                isTopEdge, isRightEdge, isBottomEdge, isLeftEdge
            );
            pieceCtx.closePath();
            
            // Clip to the jigsaw shape
            pieceCtx.clip();

            // Draw the image portion with the tabs offset
            pieceCtx.drawImage(
                canvas,
                col * pieceImgWidth, row * pieceImgHeight,
                pieceImgWidth, pieceImgHeight,
                extraLeft, extraTop,
                pieceImgWidth, pieceImgHeight
            );
            
            pieceCtx.restore();

            // Add inner shadow for depth
            pieceCtx.save();
            pieceCtx.beginPath();
            createJigsawPath(
                pieceCtx, extraLeft, extraTop, pieceImgWidth, pieceImgHeight,
                hasTabTop, hasTabRight, hasTabBottom, hasTabLeft, tabSize,
                isTopEdge, isRightEdge, isBottomEdge, isLeftEdge
            );
            pieceCtx.closePath();
            pieceCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            pieceCtx.shadowBlur = 3;
            pieceCtx.shadowOffsetX = 0;
            pieceCtx.shadowOffsetY = 0;
            pieceCtx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            pieceCtx.lineWidth = 1.5;
            pieceCtx.stroke();
            pieceCtx.restore();

            // Add subtle highlight on edges for realism
            pieceCtx.save();
            pieceCtx.beginPath();
            createJigsawPath(
                pieceCtx, extraLeft, extraTop, pieceImgWidth, pieceImgHeight,
                hasTabTop, hasTabRight, hasTabBottom, hasTabLeft, tabSize,
                isTopEdge, isRightEdge, isBottomEdge, isLeftEdge
            );
            pieceCtx.closePath();
            pieceCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            pieceCtx.lineWidth = 1;
            pieceCtx.stroke();
            pieceCtx.restore();

            // Create DOM element for piece
            const piece = createPieceElement(
                pieceCanvas, pieceWidth, pieceHeight, col, row, extraLeft, extraTop
            );

            pieces.push(piece);
        }
    }

    return pieces;
}

// Create jigsaw puzzle piece path with refined curves
function createJigsawPath(ctx, x, y, width, height, tabTop, tabRight, tabBottom, tabLeft, tabSize, 
                         isTopEdge = false, isRightEdge = false, isBottomEdge = false, isLeftEdge = false) {
    const neckRatio = 0.12; // Smoother neck transition
    const tabDepth = tabSize * 0.95;
    const curveIntensity = 0.45; // Control point for bezier curves
    
    ctx.moveTo(x, y);

    // Top edge with smooth transitions
    if (isTopEdge) {
        // Flat edge - no tab
        ctx.lineTo(x + width, y);
    } else if (tabTop) {
        ctx.lineTo(x + width * 0.28, y);
        // Tab out (knob)
        ctx.bezierCurveTo(
            x + width * (0.28 + neckRatio), y,
            x + width * (0.28 + neckRatio), y - tabDepth * 0.4,
            x + width * 0.38, y - tabDepth * 0.7
        );
        ctx.bezierCurveTo(
            x + width * curveIntensity, y - tabDepth,
            x + width * (1 - curveIntensity), y - tabDepth,
            x + width * 0.62, y - tabDepth * 0.7
        );
        ctx.bezierCurveTo(
            x + width * (0.72 - neckRatio), y - tabDepth * 0.4,
            x + width * (0.72 - neckRatio), y,
            x + width * 0.72, y
        );
        ctx.lineTo(x + width, y);
    } else {
        ctx.lineTo(x + width * 0.28, y);
        // Tab in (socket)
        ctx.bezierCurveTo(
            x + width * (0.28 + neckRatio), y,
            x + width * (0.28 + neckRatio), y + tabDepth * 0.4,
            x + width * 0.38, y + tabDepth * 0.7
        );
        ctx.bezierCurveTo(
            x + width * curveIntensity, y + tabDepth,
            x + width * (1 - curveIntensity), y + tabDepth,
            x + width * 0.62, y + tabDepth * 0.7
        );
        ctx.bezierCurveTo(
            x + width * (0.72 - neckRatio), y + tabDepth * 0.4,
            x + width * (0.72 - neckRatio), y,
            x + width * 0.72, y
        );
        ctx.lineTo(x + width, y);
    }

    // Right edge
    if (isRightEdge) {
        // Flat edge - no tab
        ctx.lineTo(x + width, y + height);
    } else if (tabRight) {
        ctx.lineTo(x + width, y + height * 0.28);
        ctx.bezierCurveTo(
            x + width, y + height * (0.28 + neckRatio),
            x + width + tabDepth * 0.4, y + height * (0.28 + neckRatio),
            x + width + tabDepth * 0.7, y + height * 0.38
        );
        ctx.bezierCurveTo(
            x + width + tabDepth, y + height * curveIntensity,
            x + width + tabDepth, y + height * (1 - curveIntensity),
            x + width + tabDepth * 0.7, y + height * 0.62
        );
        ctx.bezierCurveTo(
            x + width + tabDepth * 0.4, y + height * (0.72 - neckRatio),
            x + width, y + height * (0.72 - neckRatio),
            x + width, y + height * 0.72
        );
        ctx.lineTo(x + width, y + height);
    } else {
        ctx.lineTo(x + width, y + height * 0.28);
        ctx.bezierCurveTo(
            x + width, y + height * (0.28 + neckRatio),
            x + width - tabDepth * 0.4, y + height * (0.28 + neckRatio),
            x + width - tabDepth * 0.7, y + height * 0.38
        );
        ctx.bezierCurveTo(
            x + width - tabDepth, y + height * curveIntensity,
            x + width - tabDepth, y + height * (1 - curveIntensity),
            x + width - tabDepth * 0.7, y + height * 0.62
        );
        ctx.bezierCurveTo(
            x + width - tabDepth * 0.4, y + height * (0.72 - neckRatio),
            x + width, y + height * (0.72 - neckRatio),
            x + width, y + height * 0.72
        );
        ctx.lineTo(x + width, y + height);
    }

    // Bottom edge
    if (isBottomEdge) {
        // Flat edge - no tab
        ctx.lineTo(x, y + height);
    } else if (tabBottom) {
        ctx.lineTo(x + width * 0.72, y + height);
        ctx.bezierCurveTo(
            x + width * (0.72 - neckRatio), y + height,
            x + width * (0.72 - neckRatio), y + height + tabDepth * 0.4,
            x + width * 0.62, y + height + tabDepth * 0.7
        );
        ctx.bezierCurveTo(
            x + width * (1 - curveIntensity), y + height + tabDepth,
            x + width * curveIntensity, y + height + tabDepth,
            x + width * 0.38, y + height + tabDepth * 0.7
        );
        ctx.bezierCurveTo(
            x + width * (0.28 + neckRatio), y + height + tabDepth * 0.4,
            x + width * (0.28 + neckRatio), y + height,
            x + width * 0.28, y + height
        );
        ctx.lineTo(x, y + height);
    } else {
        ctx.lineTo(x + width * 0.72, y + height);
        ctx.bezierCurveTo(
            x + width * (0.72 - neckRatio), y + height,
            x + width * (0.72 - neckRatio), y + height - tabDepth * 0.4,
            x + width * 0.62, y + height - tabDepth * 0.7
        );
        ctx.bezierCurveTo(
            x + width * (1 - curveIntensity), y + height - tabDepth,
            x + width * curveIntensity, y + height - tabDepth,
            x + width * 0.38, y + height - tabDepth * 0.7
        );
        ctx.bezierCurveTo(
            x + width * (0.28 + neckRatio), y + height - tabDepth * 0.4,
            x + width * (0.28 + neckRatio), y + height,
            x + width * 0.28, y + height
        );
        ctx.lineTo(x, y + height);
    }

    // Left edge
    if (isLeftEdge) {
        // Flat edge - no tab
        ctx.lineTo(x, y);
    } else if (tabLeft) {
        ctx.lineTo(x, y + height * 0.72);
        ctx.bezierCurveTo(
            x, y + height * (0.72 - neckRatio),
            x - tabDepth * 0.4, y + height * (0.72 - neckRatio),
            x - tabDepth * 0.7, y + height * 0.62
        );
        ctx.bezierCurveTo(
            x - tabDepth, y + height * (1 - curveIntensity),
            x - tabDepth, y + height * curveIntensity,
            x - tabDepth * 0.7, y + height * 0.38
        );
        ctx.bezierCurveTo(
            x - tabDepth * 0.4, y + height * (0.28 + neckRatio),
            x, y + height * (0.28 + neckRatio),
            x, y + height * 0.28
        );
        ctx.lineTo(x, y);
    } else {
        ctx.lineTo(x, y + height * 0.72);
        ctx.bezierCurveTo(
            x, y + height * (0.72 - neckRatio),
            x + tabDepth * 0.4, y + height * (0.72 - neckRatio),
            x + tabDepth * 0.7, y + height * 0.62
        );
        ctx.bezierCurveTo(
            x + tabDepth, y + height * (1 - curveIntensity),
            x + tabDepth, y + height * curveIntensity,
            x + tabDepth * 0.7, y + height * 0.38
        );
        ctx.bezierCurveTo(
            x + tabDepth * 0.4, y + height * (0.28 + neckRatio),
            x, y + height * (0.28 + neckRatio),
            x, y + height * 0.28
        );
        ctx.lineTo(x, y);
    }
}

// Create a puzzle piece DOM element
function createPieceElement(pieceCanvas, pieceWidth, pieceHeight, col, row, offsetLeft = 0, offsetTop = 0) {
    const piece = document.createElement('div');
    piece.className = 'puzzle-piece';
    
    // Use actual canvas dimensions (accounting for 2x scale)
    const scale = 2;
    const actualWidth = pieceCanvas.width / scale;
    const actualHeight = pieceCanvas.height / scale;
    
    piece.style.width = actualWidth + 'px';
    piece.style.height = actualHeight + 'px';
    piece.style.backgroundImage = `url(${pieceCanvas.toDataURL()})`;
    piece.style.backgroundSize = 'contain';
    piece.style.backgroundRepeat = 'no-repeat';
    piece.dataset.correctX = col * pieceWidth;
    piece.dataset.correctY = row * pieceHeight;
    piece.dataset.col = col;
    piece.dataset.row = row;
    piece.dataset.offsetLeft = offsetLeft;
    piece.dataset.offsetTop = offsetTop;
    // Keep tabSize for backward compatibility (use the left offset as a default)
    piece.dataset.tabSize = offsetLeft;

    return piece;
}

// Layout pieces in the tray
function layoutPiecesInTray(pieces, tray, pieceWidth, pieceHeight) {
    const trayPadding = 15; // Match CSS padding
    const trayWidth = tray.clientWidth - (trayPadding * 2);
    const tabSize = pieceWidth * 0.2;
    const actualPieceWidth = pieceWidth + tabSize * 2;
    const gap = 8;
    const piecesPerRow = Math.floor((trayWidth + gap) / (actualPieceWidth + gap));

    pieces.forEach((piece, index) => {
        const trayRow = Math.floor(index / piecesPerRow);
        const trayCol = index % piecesPerRow;

        piece.style.left = (trayCol * (actualPieceWidth + gap)) + 'px';
        piece.style.top = (trayRow * (actualPieceWidth + gap)) + 'px';

        tray.appendChild(piece);
    });
}

// Shuffle array in place
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Make a piece draggable (supports both touch and mouse)
function makeDraggable(piece, board, tray, pieceWidth, pieceHeight) {
    let isDragging = false;
    let currentX, currentY;
    let initialX, initialY;
    let xOffset = 0, yOffset = 0;
    let draggedGroup = null;

    const dragStart = (e) => {
        if (piece.classList.contains('correct')) return;

        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === piece) {
            isDragging = true;
            piece.style.zIndex = 9999;
            
            // Find the group containing this piece
            draggedGroup = findPieceGroup(piece);
            if (draggedGroup) {
                draggedGroup.pieces.forEach(p => p.style.zIndex = 9999);
            }
        }
    };

    const drag = (e) => {
        if (isDragging) {
            e.preventDefault();

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            // Move all pieces in the group together
            if (draggedGroup) {
                draggedGroup.pieces.forEach(p => {
                    p.style.transform = `translate(${currentX}px, ${currentY}px)`;
                });
            } else {
                piece.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }
    };

    const dragEnd = (e) => {
        if (isDragging) {
            isDragging = false;
            piece.style.zIndex = 10;
            if (draggedGroup) {
                draggedGroup.pieces.forEach(p => p.style.zIndex = 10);
            }

            // Get drop position
            let clientX, clientY;
            if (e.type === 'touchend') {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            handlePieceDrop(piece, clientX, clientY, board, pieceWidth, pieceHeight, draggedGroup);
            
            // Reset transform offsets
            xOffset = 0;
            yOffset = 0;
            draggedGroup = null;
        }
    };

    // Attach event listeners
    piece.addEventListener('touchstart', dragStart, { passive: false });
    piece.addEventListener('touchmove', drag, { passive: false });
    piece.addEventListener('touchend', dragEnd, { passive: false });
    piece.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
}

// Find which group a piece belongs to
function findPieceGroup(piece) {
    return pieceGroups.find(group => group.pieces.includes(piece));
}

// Handle piece drop logic
function handlePieceDrop(piece, clientX, clientY, board, pieceWidth, pieceHeight, draggedGroup = null) {
    const boardRect = board.getBoundingClientRect();
    const isOverBoard = clientX >= boardRect.left && clientX <= boardRect.right &&
                       clientY >= boardRect.top && clientY <= boardRect.bottom;

    const offsetLeft = parseFloat(piece.dataset.offsetLeft || 0);
    const offsetTop = parseFloat(piece.dataset.offsetTop || 0);
    const group = draggedGroup || findPieceGroup(piece);

    if (isOverBoard) {
        // Calculate position relative to board
        const x = clientX - boardRect.left - pieceWidth / 2;
        const y = clientY - boardRect.top - pieceHeight / 2;

        // Move piece(s) to board if not already there
        if (group) {
            group.pieces.forEach(p => {
                if (p.parentElement !== board) {
                    board.appendChild(p);
                }
            });
        }

        // Snap to grid
        const snapX = Math.round(x / pieceWidth) * pieceWidth;
        const snapY = Math.round(y / pieceHeight) * pieceHeight;

        // Position the leader piece
        piece.style.left = Math.max(0, Math.min(snapX - offsetLeft, boardRect.width - pieceWidth)) + 'px';
        piece.style.top = Math.max(0, Math.min(snapY - offsetTop, boardRect.height - pieceHeight)) + 'px';
        piece.style.transform = 'none';

        // Position other pieces in the group relative to leader
        if (group && group.pieces.length > 1) {
            const leaderCol = parseInt(piece.dataset.col);
            const leaderRow = parseInt(piece.dataset.row);
            const leaderX = parseFloat(piece.style.left);
            const leaderY = parseFloat(piece.style.top);

            group.pieces.forEach(p => {
                if (p !== piece) {
                    const pCol = parseInt(p.dataset.col);
                    const pRow = parseInt(p.dataset.row);
                    const offsetX = (pCol - leaderCol) * pieceWidth;
                    const offsetY = (pRow - leaderRow) * pieceHeight;
                    p.style.left = (leaderX + offsetX) + 'px';
                    p.style.top = (leaderY + offsetY) + 'px';
                    p.style.transform = 'none';
                }
            });
        }

        // Check for snapping to adjacent pieces
        checkAndSnapToAdjacentPieces(piece, board, pieceWidth, pieceHeight);

        // Check for snapping to edges/corners
        checkAndSnapToEdges(piece, board, boardRect, pieceWidth, pieceHeight);

        // Check if in correct position
        checkCorrectPosition(piece, board);
    } else {
        // Return to original position
        if (group) {
            group.pieces.forEach(p => p.style.transform = 'none');
        } else {
            piece.style.transform = 'none';
        }
    }
}

// Check if piece should snap to adjacent pieces
function checkAndSnapToAdjacentPieces(piece, board, pieceWidth, pieceHeight) {
    const col = parseInt(piece.dataset.col);
    const row = parseInt(piece.dataset.row);
    const pieceLeft = parseFloat(piece.style.left);
    const pieceTop = parseFloat(piece.style.top);
    const snapTolerance = pieceWidth * 0.25;

    const allPieces = Array.from(board.querySelectorAll('.puzzle-piece'));
    const currentGroup = findPieceGroup(piece);

    allPieces.forEach(otherPiece => {
        if (otherPiece === piece || currentGroup.pieces.includes(otherPiece)) return;

        const otherCol = parseInt(otherPiece.dataset.col);
        const otherRow = parseInt(otherPiece.dataset.row);
        const otherLeft = parseFloat(otherPiece.style.left);
        const otherTop = parseFloat(otherPiece.style.top);

        // Check if pieces are adjacent in the grid
        const colDiff = Math.abs(col - otherCol);
        const rowDiff = Math.abs(row - otherRow);
        const isAdjacent = (colDiff === 1 && rowDiff === 0) || (colDiff === 0 && rowDiff === 1);

        if (!isAdjacent) return;

        // Calculate expected relative position
        const expectedOffsetX = (otherCol - col) * pieceWidth;
        const expectedOffsetY = (otherRow - row) * pieceHeight;
        const actualOffsetX = otherLeft - pieceLeft;
        const actualOffsetY = otherTop - pieceTop;

        // Check if pieces are close enough to snap
        const distX = Math.abs(actualOffsetX - expectedOffsetX);
        const distY = Math.abs(actualOffsetY - expectedOffsetY);

        if (distX < snapTolerance && distY < snapTolerance) {
            // Snap pieces together
            snapPiecesTogether(piece, otherPiece, pieceWidth, pieceHeight);
        }
    });
}

// Snap two pieces together
function snapPiecesTogether(piece1, piece2, pieceWidth, pieceHeight) {
    const group1 = findPieceGroup(piece1);
    const group2 = findPieceGroup(piece2);

    if (group1 === group2) return; // Already in same group

    // Calculate correct relative positions
    const col1 = parseInt(piece1.dataset.col);
    const row1 = parseInt(piece1.dataset.row);
    const col2 = parseInt(piece2.dataset.col);
    const row2 = parseInt(piece2.dataset.row);
    
    const piece1Left = parseFloat(piece1.style.left);
    const piece1Top = parseFloat(piece1.style.top);
    
    // Position piece2's group relative to piece1
    const expectedOffsetX = (col2 - col1) * pieceWidth;
    const expectedOffsetY = (row2 - row1) * pieceHeight;
    
    const piece2NewLeft = piece1Left + expectedOffsetX;
    const piece2NewTop = piece1Top + expectedOffsetY;
    
    const currentPiece2Left = parseFloat(piece2.style.left);
    const currentPiece2Top = parseFloat(piece2.style.top);
    
    const adjustX = piece2NewLeft - currentPiece2Left;
    const adjustY = piece2NewTop - currentPiece2Top;
    
    // Move all pieces in group2
    group2.pieces.forEach(p => {
        const currentLeft = parseFloat(p.style.left);
        const currentTop = parseFloat(p.style.top);
        p.style.left = (currentLeft + adjustX) + 'px';
        p.style.top = (currentTop + adjustY) + 'px';
    });

    // Merge groups
    group1.pieces = [...group1.pieces, ...group2.pieces];
    pieceGroups = pieceGroups.filter(g => g !== group2);
}

// Check if piece should snap to board edges
function checkAndSnapToEdges(piece, board, boardRect, pieceWidth, pieceHeight) {
    const col = parseInt(piece.dataset.col);
    const row = parseInt(piece.dataset.row);
    const offsetLeft = parseFloat(piece.dataset.offsetLeft || 0);
    const offsetTop = parseFloat(piece.dataset.offsetTop || 0);
    
    const isLeftEdge = col === 0;
    const isRightEdge = col === currentPuzzle.cols - 1;
    const isTopEdge = row === 0;
    const isBottomEdge = row === currentPuzzle.rows - 1;
    
    if (!isLeftEdge && !isRightEdge && !isTopEdge && !isBottomEdge) return;
    
    const pieceLeft = parseFloat(piece.style.left);
    const pieceTop = parseFloat(piece.style.top);
    const edgeSnapTolerance = pieceWidth * 0.3;
    
    let snapped = false;
    
    // Snap to left edge (left edge pieces have no offset on left side)
    if (isLeftEdge && Math.abs(pieceLeft - 0) < edgeSnapTolerance) {
        piece.style.left = '0px';
        snapped = true;
    }
    
    // Snap to top edge (top edge pieces have no offset on top side)
    if (isTopEdge && Math.abs(pieceTop - 0) < edgeSnapTolerance) {
        piece.style.top = '0px';
        snapped = true;
    }
    
    // Snap to right edge
    if (isRightEdge) {
        const rightEdgeX = boardRect.width - pieceWidth - offsetLeft;
        if (Math.abs(pieceLeft - rightEdgeX) < edgeSnapTolerance) {
            piece.style.left = rightEdgeX + 'px';
            snapped = true;
        }
    }
    
    // Snap to bottom edge
    if (isBottomEdge) {
        const bottomEdgeY = boardRect.height - pieceHeight - offsetTop;
        if (Math.abs(pieceTop - bottomEdgeY) < edgeSnapTolerance) {
            piece.style.top = bottomEdgeY + 'px';
            snapped = true;
        }
    }
}

// Check if piece is in correct position
function checkCorrectPosition(piece, board) {
    const correctX = parseFloat(piece.dataset.correctX);
    const correctY = parseFloat(piece.dataset.correctY);
    const offsetLeft = parseFloat(piece.dataset.offsetLeft || 0);
    const offsetTop = parseFloat(piece.dataset.offsetTop || 0);
    const pieceLeft = parseFloat(piece.style.left);
    const pieceTop = parseFloat(piece.style.top);
    const tolerance = currentPuzzle.pieceWidth * 0.15;

    if (Math.abs(pieceLeft - (correctX - offsetLeft)) < tolerance && 
        Math.abs(pieceTop - (correctY - offsetTop)) < tolerance) {
        
        if (!piece.classList.contains('correct')) {
            placePieceCorrectly(piece, correctX - offsetLeft, correctY - offsetTop, board);
        }
    }
}

// Place piece in correct position
function placePieceCorrectly(piece, correctX, correctY, board) {
    if (piece.parentElement !== board) {
        board.appendChild(piece);
    }
    piece.style.left = correctX + 'px';
    piece.style.top = correctY + 'px';
    piece.style.transform = 'none';
    piece.classList.add('correct');

    // Update progress
    currentPuzzle.placedPieces++;
    document.getElementById('placedCount').textContent = currentPuzzle.placedPieces;

    // Check if puzzle is complete
    if (currentPuzzle.placedPieces === currentPuzzle.totalPieces) {
        setTimeout(() => {
            document.getElementById('successMessage').classList.add('show');
        }, 300);
    }
}

// Place piece on board (not in correct position)
function placePieceOnBoard(piece, snapX, snapY, board, boardRect, pieceWidth, pieceHeight) {
    if (piece.parentElement !== board) {
        board.appendChild(piece);
    }
    piece.style.left = Math.max(0, Math.min(snapX, boardRect.width - pieceWidth)) + 'px';
    piece.style.top = Math.max(0, Math.min(snapY, boardRect.height - pieceHeight)) + 'px';
    piece.style.transform = 'none';
}
