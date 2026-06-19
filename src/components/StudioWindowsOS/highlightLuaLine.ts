export type LuaTokenKind =
  | 'plain'
  | 'comment'
  | 'keyword'
  | 'string'
  | 'number'
  | 'builtin'
  | 'type'
  | 'property'
  | 'operator'

export type LuaToken = {
  kind: LuaTokenKind
  text: string
}

const KEYWORDS = new Set([
  'and',
  'break',
  'do',
  'else',
  'elseif',
  'end',
  'false',
  'for',
  'function',
  'if',
  'in',
  'local',
  'nil',
  'not',
  'or',
  'repeat',
  'return',
  'then',
  'true',
  'until',
  'while',
])

const BUILTINS = new Set([
  'game',
  'script',
  'workspace',
  'RunService',
  'UserInputService',
  'print',
  'wait',
  'typeof',
  'pairs',
  'ipairs',
  'require',
  'Connect',
  'InputBegan',
  'Heartbeat',
  'KeyCode',
  'UserInputState',
  'PrimaryPart',
  'AssemblyLinearVelocity',
  'Position',
])

const TYPES = new Set(['Enum', 'Vector3', 'CFrame', 'Color3', 'UDim2', 'Instance'])

function classifyWord(word: string, afterDot: boolean): LuaTokenKind {
  if (KEYWORDS.has(word)) return 'keyword'
  if (afterDot) return 'property'
  if (TYPES.has(word)) return 'type'
  if (BUILTINS.has(word)) return 'builtin'
  return 'plain'
}

/** Lightweight Lua highlighter — VS Code Dark+ token classes for prototype script tabs. */
export function highlightLuaLine(line: string): LuaToken[] {
  const tokens: LuaToken[] = []
  let index = 0
  let afterDot = false

  while (index < line.length) {
    const char = line[index]

    if (char === '-' && line[index + 1] === '-') {
      tokens.push({ kind: 'comment', text: line.slice(index) })
      break
    }

    if (char === '"' || char === "'") {
      let end = index + 1
      while (end < line.length) {
        if (line[end] === '\\') {
          end += 2
          continue
        }
        if (line[end] === char) {
          end += 1
          break
        }
        end += 1
      }
      tokens.push({ kind: 'string', text: line.slice(index, end) })
      index = end
      afterDot = false
      continue
    }

    if (/\s/.test(char)) {
      let end = index
      while (end < line.length && /\s/.test(line[end])) end += 1
      tokens.push({ kind: 'plain', text: line.slice(index, end) })
      index = end
      afterDot = false
      continue
    }

    if (/[A-Za-z_]/.test(char)) {
      let end = index
      while (end < line.length && /[\w]/.test(line[end])) end += 1
      const word = line.slice(index, end)
      tokens.push({ kind: classifyWord(word, afterDot), text: word })
      index = end
      afterDot = false
      continue
    }

    if (/\d/.test(char)) {
      let end = index
      while (end < line.length && /[\d.]/.test(line[end])) end += 1
      tokens.push({ kind: 'number', text: line.slice(index, end) })
      index = end
      afterDot = false
      continue
    }

    tokens.push({ kind: 'operator', text: char })
    afterDot = char === '.'
    index += 1
  }

  return tokens.length > 0 ? tokens : [{ kind: 'plain', text: line }]
}
