# Prompt Master

Turns your rough, messy prompt into a clear, well-structured one before you send it.

**How to use:** type a rough prompt, then press the **✨ Prompt Master** button above the prompt box (or focus the band and press `p`). The rewritten prompt replaces your draft so you can review or tweak it, then press Enter to send. Didn't like it? Press **Undo** to get your original draft back. You can also run `/prompt-master` (rewrites the box) or `/prompt-master <rough text>`.

It keeps your intent and every concrete detail, fixes spelling and grammar, and never invents requirements. Rewrites use Sonnet through your session's own credentials and count toward your session cost.

## Install

In the Claude desktop app (Code tab): click **+** next to the prompt box → **Plugins** → **Add marketplace** with `deontay200612-png/prompt-master` → **Add plugin**.

At the prompt of a terminal Claude Code session:

```
/plugin install prompt-master --marketplace deontay200612-png/prompt-master
```

From a shell:

```bash
claude plugin install prompt-master --marketplace deontay200612-png/prompt-master
```

This repository is private: installing needs a GitHub credential on your machine (an SSH key, or `gh auth login` then `gh auth setup-git`).
