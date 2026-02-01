/**
 * Utility functions for working with Canvas and CSS variables
 */

/**
 * Gets the computed CSS value of a CSS variable
 */
export function getCSSVariable(variableName: string, element?: HTMLElement): string {
  const el = element || document.documentElement
  return getComputedStyle(el).getPropertyValue(variableName).trim()
}

/**
 * Gets a color value that can be used in Canvas API
 * Handles CSS variables that resolve to oklch, rgb, hsl, etc.
 * Canvas doesn't support oklch, so we convert it to rgb/rgba
 */
export function getCanvasColor(cssVar: string, element?: HTMLElement): string {
  // Extract alpha if present (e.g., "hsl(var(--primary) / 0.5)")
  const alphaMatch = cssVar.match(/\s*\/\s*([\d.]+)\s*$/)
  const alpha = alphaMatch ? alphaMatch[1] : null
  const baseColor = alphaMatch ? cssVar.substring(0, alphaMatch.index).trim() : cssVar.trim()
  
  // Check if it contains a CSS variable
  const varMatch = baseColor.match(/var\(--([^)]+)\)/)
  
  if (varMatch) {
    // Get the actual computed color value (could be oklch, rgb, hsl, etc.)
    const varName = varMatch[1]
    let computedValue = getCSSVariable(`--${varName}`, element)
    
    if (!computedValue) {
      // Fallback to a default color if variable not found
      return alpha ? `rgba(128, 128, 128, ${alpha})` : 'rgb(128, 128, 128)'
    }
    
    // Trim whitespace
    computedValue = computedValue.trim()
    
    // Canvas doesn't support oklch, so convert it to rgb/rgba
    if (computedValue.startsWith('oklch(')) {
      try {
        // Ensure document.body exists
        if (typeof document !== 'undefined' && document.body) {
          const tempEl = document.createElement('div')
          tempEl.style.color = computedValue
          tempEl.style.position = 'absolute'
          tempEl.style.visibility = 'hidden'
          tempEl.style.pointerEvents = 'none'
          document.body.appendChild(tempEl)
          const rgb = getComputedStyle(tempEl).color
          document.body.removeChild(tempEl)
          
          // Apply alpha if needed
          if (alpha && rgb.startsWith('rgb(')) {
            return rgb.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
          }
          return rgb || 'rgb(128, 128, 128)'
        }
        // Fallback if document.body doesn't exist
        return alpha ? `rgba(128, 128, 128, ${alpha})` : 'rgb(128, 128, 128)'
      } catch (e) {
        // Fallback if conversion fails
        return alpha ? `rgba(128, 128, 128, ${alpha})` : 'rgb(128, 128, 128)'
      }
    }
    
    // If there's an alpha value, convert to rgba/hsla
    if (alpha) {
      if (computedValue.startsWith('hsl(')) {
        return computedValue.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`)
      } else if (computedValue.startsWith('rgb(')) {
        return computedValue.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
      }
    }
    
    // Return the computed value as-is (rgb, hsl, etc. are supported by Canvas)
    // But make sure it's not oklch (should have been handled above, but double-check)
    if (computedValue.startsWith('oklch(')) {
      try {
        const tempEl = document.createElement('div')
        tempEl.style.color = computedValue
        document.body.appendChild(tempEl)
        const rgb = getComputedStyle(tempEl).color
        document.body.removeChild(tempEl)
        return rgb
      } catch (e) {
        return 'rgb(128, 128, 128)'
      }
    }
    
    return computedValue
  }
  
  // No CSS variable, return as-is (might already be a valid color)
  return cssVar
}
