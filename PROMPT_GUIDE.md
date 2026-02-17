# How to Write Better AI Prompts for Projects

Based on lessons learned from building this jigsaw puzzle app.

## Key Principles for Better Prompts:

1. **Start with platform/tech stack** - Be specific upfront
2. **Define core MVP first** - What's the minimum viable product?
3. **Separate must-haves from nice-to-haves** - Use clear sections
4. **Be specific about interactions** - Touch, mouse, drag-and-drop, etc.
5. **Mention target devices early** - Mobile-first changes everything

## Example Improved Prompt:

```
Create a web-based jigsaw puzzle app for iPad/iPhone using HTML5 Canvas.

Core Features:
- Upload image from device photos (no camera capture)
- Select piece count: 30, 40, 50, 60, 70, 80, 90, or 100 pieces
- Drag pieces with touch/mouse from tray to board
- Pieces snap when correctly positioned (adjacent pieces + edges)
- Save/load puzzles via localStorage

Visual Requirements:
- Realistic jigsaw pieces with bezier curves (not simple rectangles)
- Pieces show actual image content (carved from image, not added tabs)
- Flat edges on puzzle borders
- Scrollable piece tray

Technical:
- Fully responsive for iPad/iPhone screens
- Touch-optimized (no accidental zooming)
- Pieces maintain high z-index when dragging
```

## What This Does Better:

**Shorter** - ~150 words vs iterative requests  
**Structured** - Clear sections prevent back-and-forth  
**Specific** - "bezier curves" vs "look realistic"  
**Complete** - Addresses the "carved from image" issue upfront  
**Device-aware** - iPad/iPhone mentioned early affects all decisions

## Pro Tips:

- ✅ Say "carved from image" not "look like puzzle pieces"
- ✅ Specify "no camera capture" if you want photo library
- ✅ Use concrete terms like "localStorage" vs "stored"
- ✅ Mention "z-index" if layering matters
- ❌ Avoid vague words like "refined," "better," "polished"

## Result:

A well-structured prompt like this would have saved ~70% of refinement iterations!
