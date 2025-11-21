# Layer Placement Guide

## Understanding Placement Behavior

### Position-Only Placements (Keep Original Size)
These placements only set the **position**, keeping the overlay's **original dimensions**:

- `top-left`, `top-center`, `top-right`
- `center-left`, `center`, `center-right`  
- `bottom-left`, `bottom-center`, `bottom-right`

⚠️ **Warning:** If your overlay video is the same size as your base video, it will **cover the entire screen**!

**Example Problem:**
```typescript
layers([
  { media: "base-1920x1080.mp4", placement: "full" },      // 1920x1080
  { media: "overlay-1920x1080.mp4", placement: "bottom-left" } // 1920x1080 - COVERS EVERYTHING!
])
```

### Scaled Placements (Resize to Specific Dimensions)

These placements **resize** the overlay to specific dimensions:

#### Full Screen
- `full` - Scales to entire screen (W x H)

#### Quarter Screen (50% width × 50% height)
- `top-left-quarter` - Top-left, 50% × 50%
- `top-right-quarter` - Top-right, 50% × 50%
- `bottom-left-quarter` - Bottom-left, 50% × 50%
- `bottom-right-quarter` - Bottom-right, 50% × 50%

#### Picture-in-Picture (25% width × 25% height)
- `picture-in-picture` - Bottom-right corner, 25% × 25% with 20px padding

## Solutions for Small Overlays

### Option 1: Use Quarter Presets (Recommended)
```typescript
layers([
  { media: "base.mp4", placement: "full" },
  { media: "overlay.mp4", placement: "bottom-left-quarter" } // ✅ Scales to 25%
])
```

### Option 2: Use Picture-in-Picture
```typescript
layers([
  { media: "base.mp4", placement: "full" },
  { media: "overlay.mp4", placement: "picture-in-picture" } // ✅ Small corner overlay
])
```

### Option 3: Custom Placement with Size
```typescript
layers([
  { media: "base.mp4", placement: "full" },
  { 
    media: "overlay.mp4",
    placement: {
      position: { x: "20", y: "H-h-20" },  // Bottom-left with padding
      width: "W/4",   // 25% of base width
      height: "H/4"   // 25% of base height
    }
  }
])
```

## FFmpeg Expression Reference

- `W` - Base video width
- `H` - Base video height  
- `w` - Overlay video width (after scaling)
- `h` - Overlay video height (after scaling)

### Common Expressions
- `(W-w)/2` - Center horizontally
- `(H-h)/2` - Center vertically
- `W-w` - Align to right edge
- `H-h` - Align to bottom edge
- `W-w-20` - Right edge with 20px padding
- `H-h-20` - Bottom edge with 20px padding

## Complete Examples

### YouTube Tutorial (Webcam PIP)
```typescript
layers([
  { media: "screen-recording.mp4", placement: "full" },
  { media: "webcam.mp4", placement: "picture-in-picture" }
])
```

### Conference Call (4-way split)
```typescript
layers([
  { media: "person1.mp4", placement: "top-left-quarter" },
  { media: "person2.mp4", placement: "top-right-quarter" },
  { media: "person3.mp4", placement: "bottom-left-quarter" },
  { media: "person4.mp4", placement: "bottom-right-quarter" }
])
```

### Logo Overlay (Custom)
```typescript
layers([
  { media: "video.mp4", placement: "full" },
  { 
    media: "logo.png",
    placement: {
      position: { x: "W-w-30", y: "30" },  // Top-right with padding
      width: "200",    // Fixed 200px width
      height: "100"    // Fixed 100px height
    }
  }
])
```

### Green Screen with Size Control
```typescript
layers([
  { media: "background.mp4", placement: "full" },
  { 
    media: "actor.mp4",
    placement: { width: "W*0.6", height: "H*0.8" },  // 60% × 80%
    chromaKey: true,
    chromaKeyColor: "0x00FF00",
    similarity: 0.3,
    blend: 0.1
  }
])
```

## Audio Handling

- Audio is taken from the **first layer** (base layer)
- Overlay layers' audio is **not included**
- To mix audio from multiple sources, use a separate audio mixing operation

## Tips

1. **Always test with actual video dimensions** - What works for 1080p might not work for 4K
2. **Use quarter presets for overlays** - They provide good default sizing
3. **Add padding to avoid edge bleeding** - Use expressions like `W-w-20` instead of `W-w`
4. **Consider aspect ratios** - Scaling might distort if ratios don't match
5. **Use custom placement for precise control** - When presets don't fit your needs
