/**
 * Tool execution event system
 * Provides a clean way to listen to tool executions and update UI
 */

export type ToolEventType = 'stimulate_region' | 'save_session' | 'load_session' | 'analyze_patterns'

export interface ToolEvent {
  type: ToolEventType
  toolName: string
  result?: any
  timestamp: number
}

type ToolEventListener = (event: ToolEvent) => void

class ToolEventEmitter {
  private listeners: Map<ToolEventType, Set<ToolEventListener>> = new Map()

  on(type: ToolEventType, listener: ToolEventListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(listener)
    }
  }

  emit(event: ToolEvent) {
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          // Error in tool event listener - silently fail to avoid console spam
        }
      })
    }
  }

  off(type: ToolEventType, listener: ToolEventListener) {
    this.listeners.get(type)?.delete(listener)
  }

  removeAllListeners() {
    this.listeners.clear()
  }
}

export const toolEvents = new ToolEventEmitter()
