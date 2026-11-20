export type Phase = 'idle' | 'working' | 'error'

declare module 'claude-code' {
  interface PluginState {
    'prompt-master': { phase: Phase; original: string | null; error: string | null }
  }
}
