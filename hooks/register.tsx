import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Phase } from '../types'

const phase = atom({ plugin: 'prompt-master', key: 'phase' } as const, 'idle' as Phase)
const original = atom({ plugin: 'prompt-master', key: 'original' } as const, null as string | null)
const error = atom({ plugin: 'prompt-master', key: 'error' } as const, null as string | null)

const SYSTEM = `You are Prompt Master. You rewrite a user's rough, messy prompt for an AI coding/assistant agent into a clearer, more effective prompt.

Rules:
- Keep the user's intent, scope and every concrete detail (names, files, numbers, constraints). Never invent requirements, tech choices or facts they did not give.
- Fix spelling and grammar; make it specific and unambiguous.
- State the goal first, then relevant context, then requirements/constraints, then what "done" looks like, when the draft supports it.
- Use short bullet points only when there are several distinct requirements; keep simple asks as one or two plain sentences.
- Write in the user's voice (first person, "I want..."), addressed to the assistant.
- Keep it roughly as short as it can be while being clear. No preamble, no explanation, no quotes or code fences around the result.

Output ONLY the rewritten prompt.`

async function rewrite($: EngineInterface, rough: string) {
  const r = await $.model.complete({
    model: 'sonnet',
    system: SYSTEM,
    prompt: `Rough prompt to rewrite:\n<rough>\n${rough}\n</rough>`,
    maxTokens: 2048,
    effort: 'low',
    timeoutMs: 60000,
  })
  return r.isAnswered ? { text: r.text.trim() } : { fail: r.reason }
}

async function run($: EngineInterface, given?: string): Promise<string> {
  if ((await read($, phase)) === 'working') return 'Prompt Master is already working.'
  const rough = (given ?? (await $.prompt.read()).text).trim()
  if (!rough) {
    $.ui.toast('Type a rough prompt first, then press Prompt Master.')
    return 'Nothing to rewrite: the prompt box is empty.'
  }
  await update($, error, () => null)
  await update($, phase, () => 'working' as Phase)
  $.ui.status('✨ Prompt Master: rewriting…')
  const out = await rewrite($, rough)
  $.ui.status(undefined)
  if ('fail' in out) {
    await update($, error, () => String(out.fail))
    await update($, phase, () => 'error' as Phase)
    $.ui.toast(`Prompt Master failed: ${out.fail}`)
    return `Prompt Master failed: ${out.fail}`
  }
  await update($, original, () => rough)
  await $.prompt.fill({ text: out.text, mode: 'replace' })
  await update($, phase, () => 'idle' as Phase)
  $.ui.toast('✨ Prompt rewritten. Review it, then press Enter to send.')
  return 'Rewritten prompt placed in the prompt box. Review it and press Enter to send.'
}

async function undo($: EngineInterface) {
  const prev = await read($, original)
  if (prev === null) return
  await $.prompt.fill({ text: prev, mode: 'replace' })
  await update($, original, () => null)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'prompt-master',
      description: 'Rewrite your rough prompt (or the text after the command) into a better one',
    })
    return next(e)
  })

  on('command.run', { command: 'prompt-master' }, async ($, e) => {
    const text = await run($, e.args.trim() || undefined)
    return { text }
  })

  // Once a prompt is sent, the saved original is no longer needed.
  on('prompt.submit', async ($, e, next) => {
    await update($, original, () => null)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const p = await read($, phase)
    const prev = await read($, original)
    const err = await read($, error)

    return (
      <Box>
        {p === 'working' ? (
          <Text dimColor>✨ Prompt Master is rewriting your prompt…</Text>
        ) : (
          <Button
            key="prompt-master"
            label="✨ Prompt Master"
            hotkey="p"
            variant="primary"
            onPress={() => void run($)}
          />
        )}
        {prev !== null && p !== 'working' ? (
          <Button key="undo" label="Undo" dimColor onPress={() => void undo($)} />
        ) : null}
        {p === 'error' && err ? <Text dimColor> Failed: {err}</Text> : null}
      </Box>
    )
  })
}
