# 🧩 Jigsaw Puzzle Web App

An interactive jigsaw puzzle game that runs entirely in your browser. Perfect for iPad and mobile devices!

## Features

✨ **Upload Your Own Images** - Use photos from your device or take new ones with your camera  
📚 **Puzzle Library** - All uploaded images are saved and can be replayed anytime  
🎯 **Adjustable Difficulty** - Choose from 30 to 100 puzzle pieces  
🧲 **Smart Snapping** - Pieces snap together when they fit and to board edges/corners  
📱 **Touch Optimized** - Designed for iPad and touch devices  
🔒 **100% Private** - All processing happens locally in your browser  
🚫 **No Server Required** - Works completely offline after initial load  
💰 **Zero Cost** - No API calls or external services

## How to Use

1. Open `index.html` in your browser (Safari recommended for iPad)
2. Your previously uploaded puzzles will appear in the library
3. Either:
   - Click "Play" on a saved puzzle to replay it
   - Click "Choose Your Picture" and select a new image (automatically saved to library)
4. Select the number of puzzle pieces you want (30-100)
5. Click "Start Puzzle"
6. Drag pieces from the right tray to the puzzle board on the left
7. **Pieces automatically snap together** when you place adjacent pieces near each other
8. **Edge and corner pieces snap to the board edges** when placed near them
9. When a piece is placed in its final correct position, it locks with a green glow
10. Complete the puzzle to see the victory message!

## Advanced Features

### Puzzle Library
- Every image you upload is automatically saved to your browser's localStorage
- Access your saved puzzles anytime from the library at the top
- Delete puzzles you no longer want
- Works offline - puzzles persist even after closing the browser

### Smart Snapping System
- **Adjacent Piece Snapping**: When you drag a piece near another piece that it fits with, they automatically snap together and move as a group
- **Edge Snapping**: Edge pieces snap to the board edges when dragged near them
- **Corner Snapping**: Corner pieces snap to board corners for easy starting
- **Group Movement**: Connected pieces move together as a single unit
- Adjustable snap tolerance makes it easy to connect pieces without being too precise

## Files

- `index.html` - Main HTML structure
- `styles.css` - All styling and responsive design
- `app.js` - Game logic and interactivity
- `jigsaw-puzzle.html` - Original single-file version (standalone)

## Technical Details

- **Pure JavaScript** - No frameworks or libraries required
- **HTML5 Canvas** - Used for image slicing and piece generation
- **Touch & Mouse Support** - Works with both touch and mouse inputs
- **Responsive Design** - Adapts to different screen sizes
- **Smart Snapping** - Pieces snap to grid when placed correctly

## Browser Compatibility

- ✅ Safari (iOS/iPadOS) - Recommended
- ✅ Chrome (Desktop/Mobile)
- ✅ Firefox (Desktop/Mobile)
- ✅ Edge (Desktop)

## Development

No build process required! Just open the files in your favorite code editor and start customizing.

## License

Free to use and modify as you wish!
