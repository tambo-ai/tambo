# Hero Animation Optimization

This directory contains various optimized versions of the Tambo octopus animation used in the hero section of the website.

# To Do

- [ ] Todo: Ask designers for smaller versions already with tranperency. Try to see if we can get them even smaller.

## The Challenge

The original animation (`Octo-5-transparent.gif`) is 9.4MB, which is too large for efficient web loading. We needed to:

1. Reduce the file size
2. Maintain animation quality
3. Preserve transparency
4. Ensure cross-browser compatibility

## Solutions Explored

We explored multiple approaches for optimizing the animation:

### GIF Optimization

| File                                 | Size  | Reduction | Technique                    | Quality Impact |
| ------------------------------------ | ----- | --------- | ---------------------------- | -------------- |
| `Octo-5-transparent.gif`             | 9.4MB | -         | Original file                | Baseline       |
| `Octo-5-transparent-O3.gif`          | 5.4MB | 43%       | Maximum optimization (`-O3`) | Minimal        |
| `Octo-5-transparent-lossy.gif`       | 4.7MB | 50%       | Lossy + color reduction      | Moderate       |
| `Octo-5-transparent-small.gif`       | 2.5MB | 73%       | Resized to 720x720           | Some noise     |
| `Octo-5-transparent-resize-only.gif` | 2.5MB | 73%       | Only resized                 | Some noise     |
| `Octo-5-transparent-optimal.gif`     | 2.4MB | 74%       | Resize + lossy               | Most noise     |

Commands used:

```bash
# Basic optimization
gifsicle -O3 original.gif -o optimized.gif

# Lossy compression
gifsicle -O3 --colors 128 --lossy=80 original.gif -o lossy.gif

# Resizing
gifsicle -O3 --resize 720x720 original.gif -o small.gif

# Combined optimization
gifsicle -O3 --resize 720x720 --lossy=80 original.gif -o optimal.gif
```

### WebM/VP9 Video Format

| File                                  | Size  | Reduction | Technique                | Notes                 |
| ------------------------------------- | ----- | --------- | ------------------------ | --------------------- |
| `Octo-5-animated-vp9.webm`            | 7.6MB | 19%       | Basic VP9 encoding       | Full quality          |
| `Octo-5-animated-vp9-compressed.webm` | 4.6MB | 51%       | Compressed VP9           | Good quality          |
| `Octo-5-animated-vp9-small.webm`      | 1.1MB | 88%       | Resized + compressed VP9 | Good quality for size |
| `Octo-5-mp4-transparent.webm`         | 3.0MB | 68%       | MP4 conversion           | Different encoding    |
| `Octo-5-mp4-transparent-v2.webm`      | 3.4MB | 64%       | MP4 conversion v2        | Different encoding    |

Commands used:

```bash
# VP9 WebM with transparency
ffmpeg -i original.gif -c:v libvpx-vp9 -pix_fmt yuva420p -lossless 1 output.webm

# Compressed VP9
ffmpeg -i original.gif -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 2M output.webm

# Resized + compressed
ffmpeg -i original.gif -vf "scale=720:-1" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 1M output.webm
```

### WebP Format

| File                      | Size  | Reduction | Technique     | Notes                   |
| ------------------------- | ----- | --------- | ------------- | ----------------------- |
| `Octo-5-transparent.webp` | 1.3MB | 86%       | Static WebP   | Not animated            |
| `Octo-5-animated.webp`    | 6.7MB | 29%       | Animated WebP | Limited browser support |

## Browser Compatibility

The main compatibility challenge is with **animated transparency**:

- **Chrome/Edge/Firefox**: Support WebM with VP9 and alpha channel
- **Safari**: Does not properly support VP9 with transparency (shows a background)

## Implemented Solution

Our solution uses a dual-approach based on browser detection:

1. **For Safari**: Use the resized GIF (`Octo-5-transparent-lossy.gif`, 4.7MB) # We couldn't use the re-sized version because it created too many artifacts.
2. **For Chrome/Firefox/Edge**: Use compressed WebM (`Octo-5-animated-vp9-small.webm`, 1.1MB)

This provides:

- 88% file size reduction for browsers that support WebM
- 4.7MB for Safari users (vs 9.4MB for the original GIF)
- Maintained transparency across all browsers
- Good animation quality

## Future Considerations

1. **AVIF Animation**: The AVIF format supports animation with transparency but has limited browser support and compression tools as of 2024.

2. **Stacked Alpha Approach**: For more consistent cross-browser support, the "stacked alpha" technique described by Jake Archibald could be implemented, but requires additional JavaScript and WebGL for compositing.

3. **HEVC with Alpha**: For Apple devices, HEVC (H.265) with an alpha channel is well-supported but requires specialized encoding software.

## References

- [Jake Archibald's Article on Video Transparency](https://jakearchibald.com/2021/encoding-video-for-the-web/)
- [Gifsicle Documentation](https://www.lcdf.org/gifsicle/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
