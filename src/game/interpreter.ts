/**
 * Python-like Interpreter for The Farmer Was Replaced
 * Supports AST parsing, variable scoping, functions, while/for loops,
 * list/dict operations, line tracking, and yielding step execution for animation.
 */

import {
  Direction,
  Entities,
  Grounds,
  Items,
  Unlocks,
  DirectionType,
  EntityType,
  GroundType,
  ItemType,
  UnlockType,
  TileState,
  DroneState,
  Inventory,
  UnlockLevels,
} from './types';

export interface ExecutionContext {
  getTile: (x: number, y: number) => TileState | undefined;
  getDrone: () => DroneState;
  getWorldSize: () => number;
  getInventory: () => Inventory;
  getUnlocks: () => UnlockLevels;
  isSandbox: boolean;

  // Actions
  onMove: (dir: DirectionType) => boolean;
  onSwap: (dir: DirectionType) => boolean;
  onHarvest: () => { success: boolean; item?: ItemType; amount?: number };
  onPlant: (entity: EntityType) => boolean;
  onTill: () => boolean;
  onUseItem: (item: ItemType, amount?: number) => boolean;
  onTrade: (item: ItemType, amount?: number) => boolean;
  onUnlock: (unlock: UnlockType) => boolean;
  onMeasure: () => number;
  onFlip: () => void;
  onPrint: (message: string) => void;
  onQuickPrint: (message: string) => void;
  onClear: () => void;
  getTime: () => number;
  getCompanion: () => EntityType | null;
}

export type StepResult =
  | { type: 'action'; line: number; actionName: string }
  | { type: 'line'; line: number }
  | { type: 'done' }
  | { type: 'error'; message: string; line: number };

// AST Nodes
interface ASTNode {
  type: string;
  line: number;
}

interface ProgramNode extends ASTNode {
  type: 'Program';
  body: StatementNode[];
}

type StatementNode =
  | ExpressionStatementNode
  | AssignStatementNode
  | IfStatementNode
  | WhileStatementNode
  | ForStatementNode
  | DefStatementNode
  | ReturnStatementNode
  | BreakStatementNode
  | ContinueStatementNode
  | PassStatementNode;

interface ExpressionStatementNode extends ASTNode {
  type: 'ExpressionStatement';
  expression: ExpressionNode;
}

interface AssignStatementNode extends ASTNode {
  type: 'AssignStatement';
  target: string | MemberExpressionNode | IndexExpressionNode;
  operator: '=' | '+=' | '-=' | '*=' | '/=' | '%=';
  value: ExpressionNode;
}

interface IfStatementNode extends ASTNode {
  type: 'IfStatement';
  test: ExpressionNode;
  consequent: StatementNode[];
  alternate?: StatementNode[];
}

interface WhileStatementNode extends ASTNode {
  type: 'WhileStatement';
  test: ExpressionNode;
  body: StatementNode[];
}

interface ForStatementNode extends ASTNode {
  type: 'ForStatement';
  variable: string;
  iterable: ExpressionNode;
  body: StatementNode[];
}

interface DefStatementNode extends ASTNode {
  type: 'DefStatement';
  name: string;
  params: string[];
  body: StatementNode[];
}

interface ReturnStatementNode extends ASTNode {
  type: 'ReturnStatement';
  argument?: ExpressionNode;
}

interface BreakStatementNode extends ASTNode {
  type: 'BreakStatement';
}

interface ContinueStatementNode extends ASTNode {
  type: 'ContinueStatement';
}

interface PassStatementNode extends ASTNode {
  type: 'PassStatement';
}

type ExpressionNode =
  | LiteralNode
  | IdentifierNode
  | BinaryExpressionNode
  | UnaryExpressionNode
  | CallExpressionNode
  | MemberExpressionNode
  | IndexExpressionNode
  | ArrayExpressionNode
  | ObjectExpressionNode;

interface LiteralNode extends ASTNode {
  type: 'Literal';
  value: any;
}

interface IdentifierNode extends ASTNode {
  type: 'Identifier';
  name: string;
}

interface BinaryExpressionNode extends ASTNode {
  type: 'BinaryExpression';
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
}

interface UnaryExpressionNode extends ASTNode {
  type: 'UnaryExpression';
  operator: string;
  argument: ExpressionNode;
}

interface CallExpressionNode extends ASTNode {
  type: 'CallExpression';
  callee: ExpressionNode;
  args: ExpressionNode[];
}

interface MemberExpressionNode extends ASTNode {
  type: 'MemberExpression';
  object: ExpressionNode;
  property: string;
}

interface IndexExpressionNode extends ASTNode {
  type: 'IndexExpression';
  object: ExpressionNode;
  index: ExpressionNode;
}

interface ArrayExpressionNode extends ASTNode {
  type: 'ArrayExpression';
  elements: ExpressionNode[];
}

interface ObjectExpressionNode extends ASTNode {
  type: 'ObjectExpression';
  properties: { key: ExpressionNode; value: ExpressionNode }[];
}

/**
 * Tokenizer & Parser for Python-subset
 */
export class PythonParser {
  private lines: string[] = [];

  public parse(code: string): ProgramNode {
    this.lines = code.split('\n');
    const statements = this.parseBlock(0, 0).statements;
    return {
      type: 'Program',
      line: 1,
      body: statements,
    };
  }

  private getIndentation(line: string): number {
    let count = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === ' ') count += 1;
      else if (line[i] === '\t') count += 4;
      else break;
    }
    return count;
  }

  private stripComments(line: string): string {
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === "'" && !inDouble) inSingle = !inSingle;
      else if (c === '"' && !inSingle) inDouble = !inDouble;
      else if (c === '#' && !inSingle && !inDouble) {
        return line.substring(0, i);
      }
    }
    return line;
  }

  private parseBlock(
    startLineIdx: number,
    baseIndent: number
  ): { statements: StatementNode[]; nextLineIdx: number } {
    const statements: StatementNode[] = [];
    let idx = startLineIdx;

    while (idx < this.lines.length) {
      const rawLine = this.lines[idx];
      const stripped = this.stripComments(rawLine);
      const trimmed = stripped.trim();

      if (!trimmed) {
        idx++;
        continue;
      }

      const indent = this.getIndentation(rawLine);
      if (indent < baseIndent) {
        // Returned to outer block
        break;
      }

      // Parse statement at idx
      const lineNum = idx + 1;

      if (trimmed.startsWith('pass')) {
        statements.push({ type: 'PassStatement', line: lineNum });
        idx++;
      } else if (trimmed.startsWith('break')) {
        statements.push({ type: 'BreakStatement', line: lineNum });
        idx++;
      } else if (trimmed.startsWith('continue')) {
        statements.push({ type: 'ContinueStatement', line: lineNum });
        idx++;
      } else if (trimmed.startsWith('return')) {
        const exprStr = trimmed.slice(6).trim();
        statements.push({
          type: 'ReturnStatement',
          line: lineNum,
          argument: exprStr ? this.parseExpression(exprStr, lineNum) : undefined,
        });
        idx++;
      } else if (trimmed.startsWith('while ') || trimmed.startsWith('while(')) {
        const header = trimmed.replace(/^while\s*|\s*:\s*$/g, '');
        const testExpr = this.parseExpression(header, lineNum);
        idx++;
        // find block indentation
        let childIndent = baseIndent + 1;
        while (idx < this.lines.length && !this.lines[idx].trim()) {
          idx++;
        }
        if (idx < this.lines.length) {
          childIndent = this.getIndentation(this.lines[idx]);
        }
        const inner = this.parseBlock(idx, childIndent);
        statements.push({
          type: 'WhileStatement',
          line: lineNum,
          test: testExpr,
          body: inner.statements,
        });
        idx = inner.nextLineIdx;
      } else if (trimmed.startsWith('for ') || trimmed.startsWith('for(')) {
        // e.g. for x in range(world_size):
        const match = trimmed.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+(.+):\s*$/);
        if (!match) {
          throw new Error(`Line ${lineNum}: SyntaxError in for loop header '${trimmed}'`);
        }
        const varName = match[1];
        const iterableExpr = this.parseExpression(match[2], lineNum);
        idx++;
        let childIndent = baseIndent + 1;
        while (idx < this.lines.length && !this.lines[idx].trim()) {
          idx++;
        }
        if (idx < this.lines.length) {
          childIndent = this.getIndentation(this.lines[idx]);
        }
        const inner = this.parseBlock(idx, childIndent);
        statements.push({
          type: 'ForStatement',
          line: lineNum,
          variable: varName,
          iterable: iterableExpr,
          body: inner.statements,
        });
        idx = inner.nextLineIdx;
      } else if (trimmed.startsWith('if ') || trimmed.startsWith('if(')) {
        const header = trimmed.replace(/^if\s*|\s*:\s*$/g, '');
        const testExpr = this.parseExpression(header, lineNum);
        idx++;
        let childIndent = baseIndent + 1;
        while (idx < this.lines.length && !this.lines[idx].trim()) {
          idx++;
        }
        if (idx < this.lines.length) {
          childIndent = this.getIndentation(this.lines[idx]);
        }
        const ifBlock = this.parseBlock(idx, childIndent);
        idx = ifBlock.nextLineIdx;

        let alternate: StatementNode[] | undefined = undefined;

        // Check for elif or else at current indentation
        if (idx < this.lines.length) {
          const nextTrimmed = this.stripComments(this.lines[idx]).trim();
          const nextIndent = this.getIndentation(this.lines[idx]);

          if (nextIndent === baseIndent) {
            if (nextTrimmed.startsWith('elif ') || nextTrimmed.startsWith('elif(')) {
              // Convert elif into nested if in alternate
              const elifLineNum = idx + 1;
              const elifHeader = nextTrimmed.replace(/^elif\s*|\s*:\s*$/g, '');
              const elifExpr = this.parseExpression(elifHeader, elifLineNum);
              idx++;
              let elifChildIndent = baseIndent + 1;
              while (idx < this.lines.length && !this.lines[idx].trim()) {
                idx++;
              }
              if (idx < this.lines.length) {
                elifChildIndent = this.getIndentation(this.lines[idx]);
              }
              const elifBlock = this.parseBlock(idx, elifChildIndent);
              alternate = [
                {
                  type: 'IfStatement',
                  line: elifLineNum,
                  test: elifExpr,
                  consequent: elifBlock.statements,
                },
              ];
              idx = elifBlock.nextLineIdx;
            } else if (nextTrimmed.startsWith('else:')) {
              idx++;
              let elseChildIndent = baseIndent + 1;
              while (idx < this.lines.length && !this.lines[idx].trim()) {
                idx++;
              }
              if (idx < this.lines.length) {
                elseChildIndent = this.getIndentation(this.lines[idx]);
              }
              const elseBlock = this.parseBlock(idx, elseChildIndent);
              alternate = elseBlock.statements;
              idx = elseBlock.nextLineIdx;
            }
          }
        }

        statements.push({
          type: 'IfStatement',
          line: lineNum,
          test: testExpr,
          consequent: ifBlock.statements,
          alternate,
        });
      } else if (trimmed.startsWith('def ') || trimmed.startsWith('def(')) {
        const match = trimmed.match(/^def\s+([a-zA-Z_]\w*)\s*\((.*?)\)\s*:\s*$/);
        if (!match) {
          throw new Error(`Line ${lineNum}: SyntaxError in def header '${trimmed}'`);
        }
        const funcName = match[1];
        const params = match[2]
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
        idx++;
        let childIndent = baseIndent + 1;
        while (idx < this.lines.length && !this.lines[idx].trim()) {
          idx++;
        }
        if (idx < this.lines.length) {
          childIndent = this.getIndentation(this.lines[idx]);
        }
        const funcBlock = this.parseBlock(idx, childIndent);
        statements.push({
          type: 'DefStatement',
          line: lineNum,
          name: funcName,
          params,
          body: funcBlock.statements,
        });
        idx = funcBlock.nextLineIdx;
      } else {
        // Assignment or Expression
        const assignMatch = trimmed.match(
          /^([a-zA-Z_]\w*(?:\[.*?\])?)\s*(\+=|-=|\*=|\/=|%=|=)\s*(.+)$/
        );
        if (assignMatch && !trimmed.startsWith('==')) {
          const target = assignMatch[1].trim();
          const op = assignMatch[2] as AssignStatementNode['operator'];
          const valStr = assignMatch[3].trim();
          statements.push({
            type: 'AssignStatement',
            line: lineNum,
            target,
            operator: op,
            value: this.parseExpression(valStr, lineNum),
          });
        } else {
          statements.push({
            type: 'ExpressionStatement',
            line: lineNum,
            expression: this.parseExpression(trimmed, lineNum),
          });
        }
        idx++;
      }
    }

    return { statements, nextLineIdx: idx };
  }

  public parseExpression(code: string, line: number): ExpressionNode {
    code = code.trim();
    if (!code) {
      return { type: 'Literal', line, value: null };
    }

    // Check operators in order of precedence:
    // 1. or
    // 2. and
    // 3. not
    // 4. comparisons (==, !=, <=, >=, <, >, in, not in)
    // 5. +, -
    // 6. *, /, //, %
    // 7. unary -, not
    // 8. primary (calls, indexing, literals, identifiers, parentheses)

    const splitLogical = this.findOperatorOutside(code, [' or ']);
    if (splitLogical) {
      return {
        type: 'BinaryExpression',
        line,
        operator: 'or',
        left: this.parseExpression(splitLogical.left, line),
        right: this.parseExpression(splitLogical.right, line),
      };
    }

    const splitAnd = this.findOperatorOutside(code, [' and ']);
    if (splitAnd) {
      return {
        type: 'BinaryExpression',
        line,
        operator: 'and',
        left: this.parseExpression(splitAnd.left, line),
        right: this.parseExpression(splitAnd.right, line),
      };
    }

    if (code.startsWith('not ') || (code.startsWith('not(') && code.endsWith(')'))) {
      const rest = code.startsWith('not ') ? code.slice(4) : code.slice(4, -1);
      return {
        type: 'UnaryExpression',
        line,
        operator: 'not',
        argument: this.parseExpression(rest, line),
      };
    }

    const splitComp = this.findOperatorOutside(code, ['==', '!=', '<=', '>=', '<', '>', ' in ']);
    if (splitComp) {
      return {
        type: 'BinaryExpression',
        line,
        operator: splitComp.op.trim(),
        left: this.parseExpression(splitComp.left, line),
        right: this.parseExpression(splitComp.right, line),
      };
    }

    const splitAddSub = this.findOperatorOutside(code, ['+', '-']);
    if (splitAddSub && splitAddSub.left.trim() !== '') {
      return {
        type: 'BinaryExpression',
        line,
        operator: splitAddSub.op,
        left: this.parseExpression(splitAddSub.left, line),
        right: this.parseExpression(splitAddSub.right, line),
      };
    }

    const splitMulDiv = this.findOperatorOutside(code, ['*', '//', '/', '%']);
    if (splitMulDiv) {
      return {
        type: 'BinaryExpression',
        line,
        operator: splitMulDiv.op,
        left: this.parseExpression(splitMulDiv.left, line),
        right: this.parseExpression(splitMulDiv.right, line),
      };
    }

    // Unary minus
    if (code.startsWith('-') && !code.startsWith('--')) {
      return {
        type: 'UnaryExpression',
        line,
        operator: '-',
        argument: this.parseExpression(code.slice(1), line),
      };
    }

    // Parentheses grouping: (expr)
    if (code.startsWith('(') && code.endsWith(')')) {
      const inside = code.slice(1, -1);
      if (this.isBalanced(inside)) {
        return this.parseExpression(inside, line);
      }
    }

    // List literal: [1, 2, 3]
    if (code.startsWith('[') && code.endsWith(']')) {
      const inside = code.slice(1, -1).trim();
      const items = inside ? this.splitArgs(inside) : [];
      return {
        type: 'ArrayExpression',
        line,
        elements: items.map((it) => this.parseExpression(it, line)),
      };
    }

    // Dict literal: { a: 1, b: 2 }
    if (code.startsWith('{') && code.endsWith('}')) {
      const inside = code.slice(1, -1).trim();
      const pairs = inside ? this.splitArgs(inside) : [];
      const properties: { key: ExpressionNode; value: ExpressionNode }[] = [];
      for (const pair of pairs) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx > 0) {
          properties.push({
            key: this.parseExpression(pair.slice(0, colonIdx).trim(), line),
            value: this.parseExpression(pair.slice(colonIdx + 1).trim(), line),
          });
        }
      }
      return {
        type: 'ObjectExpression',
        line,
        properties,
      };
    }

    // Subscript / index: arr[0]
    if (code.endsWith(']')) {
      let depth = 0;
      let openIdx = -1;
      for (let i = code.length - 1; i >= 0; i--) {
        if (code[i] === ']') depth++;
        else if (code[i] === '[') {
          depth--;
          if (depth === 0) {
            openIdx = i;
            break;
          }
        }
      }
      if (openIdx > 0) {
        const objStr = code.slice(0, openIdx).trim();
        const indexStr = code.slice(openIdx + 1, -1).trim();
        return {
          type: 'IndexExpression',
          line,
          object: this.parseExpression(objStr, line),
          index: this.parseExpression(indexStr, line),
        };
      }
    }

    // Function call: func(...)
    if (code.endsWith(')')) {
      let depth = 0;
      let openIdx = -1;
      for (let i = code.length - 1; i >= 0; i--) {
        if (code[i] === ')') depth++;
        else if (code[i] === '(') {
          depth--;
          if (depth === 0) {
            openIdx = i;
            break;
          }
        }
      }
      if (openIdx > 0) {
        const calleeStr = code.slice(0, openIdx).trim();
        const argsStr = code.slice(openIdx + 1, -1).trim();
        const args = argsStr ? this.splitArgs(argsStr).map((a) => this.parseExpression(a, line)) : [];
        return {
          type: 'CallExpression',
          line,
          callee: this.parseExpression(calleeStr, line),
          args,
        };
      }
    }

    // Member expression: Entities.Carrot, Items.Hay, Grounds.Soil, etc.
    if (code.includes('.')) {
      const parts = code.split('.');
      if (parts.length === 2 && /^[a-zA-Z_]\w*$/.test(parts[0]) && /^[a-zA-Z_]\w*$/.test(parts[1])) {
        return {
          type: 'MemberExpression',
          line,
          object: { type: 'Identifier', line, name: parts[0] },
          property: parts[1],
        };
      }
    }

    // String literals: "abc" or 'abc'
    if (
      (code.startsWith('"') && code.endsWith('"')) ||
      (code.startsWith("'") && code.endsWith("'"))
    ) {
      return {
        type: 'Literal',
        line,
        value: code.slice(1, -1),
      };
    }

    // Number literals
    if (/^-?\d+(\.\d+)?$/.test(code)) {
      return {
        type: 'Literal',
        line,
        value: code.includes('.') ? parseFloat(code) : parseInt(code, 10),
      };
    }

    // Boolean literals
    if (code === 'True') return { type: 'Literal', line, value: true };
    if (code === 'False') return { type: 'Literal', line, value: false };
    if (code === 'None') return { type: 'Literal', line, value: null };

    // Standard Identifiers
    return {
      type: 'Identifier',
      line,
      name: code,
    };
  }

  private splitArgs(argsStr: string): string[] {
    const results: string[] = [];
    let current = '';
    let parenDepth = 0;
    let bracketDepth = 0;
    let braceDepth = 0;
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < argsStr.length; i++) {
      const c = argsStr[i];
      if (c === "'" && !inDouble) inSingle = !inSingle;
      else if (c === '"' && !inSingle) inDouble = !inDouble;
      else if (!inSingle && !inDouble) {
        if (c === '(') parenDepth++;
        else if (c === ')') parenDepth--;
        else if (c === '[') bracketDepth++;
        else if (c === ']') bracketDepth--;
        else if (c === '{') braceDepth++;
        else if (c === '}') braceDepth--;
        else if (c === ',' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
          results.push(current.trim());
          current = '';
          continue;
        }
      }
      current += c;
    }
    if (current.trim()) {
      results.push(current.trim());
    }
    return results;
  }

  private isBalanced(str: string): boolean {
    let depth = 0;
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (c === "'" && !inDouble) inSingle = !inSingle;
      else if (c === '"' && !inSingle) inDouble = !inDouble;
      else if (!inSingle && !inDouble) {
        if (c === '(') depth++;
        else if (c === ')') {
          depth--;
          if (depth < 0) return false;
        }
      }
    }
    return depth === 0;
  }

  private findOperatorOutside(
    code: string,
    ops: string[]
  ): { op: string; left: string; right: string } | null {
    let paren = 0;
    let bracket = 0;
    let brace = 0;
    let inSingle = false;
    let inDouble = false;

    // Scan from right to left to respect left-associativity
    for (let i = code.length - 1; i >= 0; i--) {
      const c = code[i];
      if (c === "'" && !inDouble) inSingle = !inSingle;
      else if (c === '"' && !inSingle) inDouble = !inDouble;
      else if (!inSingle && !inDouble) {
        if (c === ')') paren++;
        else if (c === '(') paren--;
        else if (c === ']') bracket++;
        else if (c === '[') bracket--;
        else if (c === '}') brace++;
        else if (c === '{') brace--;
        else if (paren === 0 && bracket === 0 && brace === 0) {
          for (const op of ops) {
            if (code.startsWith(op, i)) {
              // Ensure word boundary for 'in', 'or', 'and'
              if (op.trim() === 'in' || op.trim() === 'or' || op.trim() === 'and') {
                const prev = i > 0 ? code[i - 1] : ' ';
                const next = i + op.length < code.length ? code[i + op.length] : ' ';
                if (/\w/.test(prev) || /\w/.test(next)) continue;
              }
              return {
                op,
                left: code.substring(0, i),
                right: code.substring(i + op.length),
              };
            }
          }
        }
      }
    }
    return null;
  }
}

/**
 * Stepped Interpreter Engine
 */
export class DroneInterpreter {
  private parser = new PythonParser();
  private ast: ProgramNode | null = null;
  private env: Map<string, any> = new Map();
  private functions: Map<string, DefStatementNode> = new Map();
  private generator: Generator<StepResult, void, unknown> | null = null;
  private maxInstructions = 20000;
  private instructionCount = 0;

  constructor(private ctx: ExecutionContext) {
    this.resetEnvironment();
  }

  public resetEnvironment() {
    this.env.clear();
    this.functions.clear();

    // Built-in constants and Enums
    this.env.set('North', Direction.North);
    this.env.set('East', Direction.East);
    this.env.set('South', Direction.South);
    this.env.set('West', Direction.West);

    this.env.set('Entities', Entities);
    this.env.set('Grounds', Grounds);
    this.env.set('Items', Items);
    this.env.set('Unlocks', Unlocks);

    // Standard Math / Helpers
    this.env.set('range', (...args: number[]) => {
      let start = 0,
        stop = 0,
        step = 1;
      if (args.length === 1) {
        stop = args[0];
      } else if (args.length === 2) {
        start = args[0];
        stop = args[1];
      } else if (args.length >= 3) {
        start = args[0];
        stop = args[1];
        step = args[2] || 1;
      }
      const res: number[] = [];
      if (step > 0) {
        for (let i = start; i < stop; i += step) res.push(i);
      } else {
        for (let i = start; i > stop; i += step) res.push(i);
      }
      return res;
    });

    this.env.set('len', (arg: any) => {
      if (Array.isArray(arg) || typeof arg === 'string') return arg.length;
      if (arg && typeof arg === 'object') return Object.keys(arg).length;
      return 0;
    });

    this.env.set('min', (...args: any[]) => {
      const arr = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      return Math.min(...arr);
    });

    this.env.set('max', (...args: any[]) => {
      const arr = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      return Math.max(...arr);
    });

    this.env.set('abs', (n: number) => Math.abs(n));
    this.env.set('int', (v: any) => parseInt(v, 10) || 0);
    this.env.set('float', (v: any) => parseFloat(v) || 0);
    this.env.set('str', (v: any) => String(v));
    this.env.set('bool', (v: any) => Boolean(v));
  }

  public loadScript(code: string): { success: boolean; error?: string } {
    try {
      this.ast = this.parser.parse(code);
      this.resetEnvironment();
      this.generator = this.runProgram(this.ast);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Syntax Error' };
    }
  }

  public step(): StepResult {
    if (!this.generator) {
      return { type: 'done' };
    }

    try {
      const res = this.generator.next();
      if (res.done) {
        return { type: 'done' };
      }
      return res.value as StepResult;
    } catch (err: any) {
      return {
        type: 'error',
        message: err.message || 'Runtime execution error',
        line: err.line || 1,
      };
    }
  }

  private *runProgram(program: ProgramNode): Generator<StepResult, void, unknown> {
    this.instructionCount = 0;
    for (const stmt of program.body) {
      const result = yield* this.executeStatement(stmt);
      if (result && result.flow === 'return') {
        break;
      }
    }
  }

  private *executeBlock(
    statements: StatementNode[]
  ): Generator<StepResult, { flow?: 'break' | 'continue' | 'return'; val?: any }, unknown> {
    for (const stmt of statements) {
      const res = yield* this.executeStatement(stmt);
      if (res && res.flow) {
        return res;
      }
    }
    return {};
  }

  private *executeStatement(
    stmt: StatementNode
  ): Generator<StepResult, { flow?: 'break' | 'continue' | 'return'; val?: any }, unknown> {
    this.instructionCount++;
    if (this.instructionCount > this.maxInstructions) {
      this.instructionCount = 0;
      // Yield to prevent locking browser
      yield { type: 'line', line: stmt.line };
    }

    switch (stmt.type) {
      case 'PassStatement':
        return {};

      case 'BreakStatement':
        return { flow: 'break' };

      case 'ContinueStatement':
        return { flow: 'continue' };

      case 'ReturnStatement': {
        const val = stmt.argument ? this.evalExpression(stmt.argument) : undefined;
        return { flow: 'return', val };
      }

      case 'DefStatement': {
        this.checkUnlock(Unlocks.Functions, 'Functions (def)', stmt.line);
        this.functions.set(stmt.name, stmt);
        return {};
      }

      case 'AssignStatement': {
        this.checkUnlock(Unlocks.Variables, 'Variables', stmt.line);
        const val = this.evalExpression(stmt.value);
        if (typeof stmt.target === 'string') {
          // Check for index assign like arr[0] = val
          const matchIdx = stmt.target.match(/^([a-zA-Z_]\w*)\[(.*?)\]$/);
          if (matchIdx) {
            const arrName = matchIdx[1];
            const idxVal = this.evalExpression(this.parser.parseExpression(matchIdx[2], stmt.line));
            const arr = this.env.get(arrName);
            if (arr && typeof arr === 'object') {
              if (stmt.operator === '=') arr[idxVal] = val;
              else if (stmt.operator === '+=') arr[idxVal] += val;
              else if (stmt.operator === '-=') arr[idxVal] -= val;
            }
          } else {
            const varName = stmt.target;
            if (stmt.operator === '=') {
              this.env.set(varName, val);
            } else {
              const cur = this.env.get(varName) || 0;
              if (stmt.operator === '+=') this.env.set(varName, cur + val);
              else if (stmt.operator === '-=') this.env.set(varName, cur - val);
              else if (stmt.operator === '*=') this.env.set(varName, cur * val);
              else if (stmt.operator === '/=') this.env.set(varName, cur / val);
              else if (stmt.operator === '%=') this.env.set(varName, cur % val);
            }
          }
        }
        return {};
      }

      case 'IfStatement': {
        const cond = this.evalExpression(stmt.test);
        if (cond) {
          return yield* this.executeBlock(stmt.consequent);
        } else if (stmt.alternate) {
          return yield* this.executeBlock(stmt.alternate);
        }
        return {};
      }

      case 'WhileStatement': {
        this.checkUnlock(Unlocks.Loops, 'While Loops', stmt.line);
        let loopIters = 0;
        while (this.evalExpression(stmt.test)) {
          loopIters++;
          yield { type: 'line', line: stmt.line };

          const res = yield* this.executeBlock(stmt.body);
          if (res.flow === 'break') break;
          if (res.flow === 'return') return res;

          if (loopIters % 1000 === 0) {
            yield { type: 'line', line: stmt.line };
          }
        }
        return {};
      }

      case 'ForStatement': {
        this.checkUnlock(Unlocks.Loops, 'For Loops', stmt.line);
        const iterable = this.evalExpression(stmt.iterable);
        let list: any[] = [];
        if (Array.isArray(iterable)) {
          list = iterable;
        } else if (iterable && typeof iterable === 'object') {
          list = Object.keys(iterable);
        }

        for (const item of list) {
          this.env.set(stmt.variable, item);
          yield { type: 'line', line: stmt.line };

          const res = yield* this.executeBlock(stmt.body);
          if (res.flow === 'break') break;
          if (res.flow === 'return') return res;
        }
        return {};
      }

      case 'ExpressionStatement': {
        // If it's a drone action call, we yield an action step!
        if (stmt.expression.type === 'CallExpression') {
          const callee = stmt.expression.callee;
          const calleeName = callee.type === 'Identifier' ? callee.name : '';

          const actionYield = this.isActionFunction(calleeName);
          if (actionYield) {
            yield { type: 'action', line: stmt.line, actionName: calleeName };
          }
        }

        this.evalExpression(stmt.expression);
        return {};
      }
    }

    return {};
  }

  private isActionFunction(name: string): boolean {
    return [
      'move',
      'swap',
      'harvest',
      'plant',
      'till',
      'use_item',
      'trade',
      'unlock',
      'do_a_flip',
    ].includes(name);
  }

  private checkUnlock(unlock: UnlockType, featureName: string, line: number) {
    if (this.ctx.isSandbox) return;
    const lvls = this.ctx.getUnlocks();
    if (!lvls[unlock] || lvls[unlock] <= 0) {
      const err: any = new Error(
        `Feature '${featureName}' is locked! Research ${unlock} in the Tech Tree to use this code.`
      );
      err.line = line;
      throw err;
    }
  }

  private evalExpression(node: ExpressionNode): any {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'Identifier': {
        if (this.env.has(node.name)) {
          return this.env.get(node.name);
        }
        // Check built-in functions
        const builtin = this.getBuiltinFunction(node.name, node.line);
        if (builtin) return builtin;

        return undefined;
      }

      case 'MemberExpression': {
        const obj = this.evalExpression(node.object);
        if (obj && typeof obj === 'object') {
          return obj[node.property];
        }
        return undefined;
      }

      case 'IndexExpression': {
        const obj = this.evalExpression(node.object);
        const idx = this.evalExpression(node.index);
        if (obj && typeof obj === 'object') {
          return obj[idx];
        }
        return undefined;
      }

      case 'ArrayExpression':
        this.checkUnlock(Unlocks.Lists, 'Lists', node.line);
        return node.elements.map((el) => this.evalExpression(el));

      case 'ObjectExpression':
        this.checkUnlock(Unlocks.Dictionaries, 'Dictionaries', node.line);
        const obj: Record<string, any> = {};
        for (const prop of node.properties) {
          const key = this.evalExpression(prop.key);
          obj[key] = this.evalExpression(prop.value);
        }
        return obj;

      case 'UnaryExpression': {
        const arg = this.evalExpression(node.argument);
        if (node.operator === 'not') return !arg;
        if (node.operator === '-') return -arg;
        return arg;
      }

      case 'BinaryExpression': {
        this.checkUnlock(Unlocks.Operators, 'Operators', node.line);
        const left = this.evalExpression(node.left);
        const right = this.evalExpression(node.right);

        switch (node.operator) {
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            return left / right;
          case '//':
            return Math.floor(left / right);
          case '%':
            return left % right;
          case '==':
            return left === right;
          case '!=':
            return left !== right;
          case '<':
            return left < right;
          case '<=':
            return left <= right;
          case '>':
            return left > right;
          case '>=':
            return left >= right;
          case 'and':
            return left && right;
          case 'or':
            return left || right;
          case 'in':
            if (Array.isArray(right) || typeof right === 'string') return right.includes(left);
            if (right && typeof right === 'object') return left in right;
            return false;
          default:
            return false;
        }
      }

      case 'CallExpression': {
        const callee = this.evalExpression(node.callee);
        const evaluatedArgs = node.args.map((a) => this.evalExpression(a));

        if (typeof callee === 'function') {
          return callee(...evaluatedArgs);
        }

        // Custom function defined by `def`
        if (node.callee.type === 'Identifier') {
          const funcDef = this.functions.get(node.callee.name);
          if (funcDef) {
            // Push scoped variables
            const savedVars: [string, any][] = [];
            funcDef.params.forEach((param, i) => {
              savedVars.push([param, this.env.get(param)]);
              this.env.set(param, evaluatedArgs[i]);
            });

            // Run function body synchronously if called within expression
            let returnVal = undefined;
            for (const stmt of funcDef.body) {
              if (stmt.type === 'ReturnStatement') {
                returnVal = stmt.argument ? this.evalExpression(stmt.argument) : undefined;
                break;
              } else if (stmt.type === 'ExpressionStatement') {
                this.evalExpression(stmt.expression);
              }
            }

            // Restore scoped variables
            for (const [k, v] of savedVars) {
              if (v === undefined) this.env.delete(k);
              else this.env.set(k, v);
            }

            return returnVal;
          }
        }

        return undefined;
      }
    }
  }

  private getBuiltinFunction(name: string, line: number): ((...args: any[]) => any) | null {
    switch (name) {
      // 1. Movement & Navigation & Swap
      case 'move':
        return (dir: DirectionType) => {
          return this.ctx.onMove(dir);
        };

      case 'swap':
        this.checkUnlock(Unlocks.Cacti, 'swap()', line);
        return (dir: DirectionType) => {
          return this.ctx.onSwap(dir);
        };

      // 2. Harvesting
      case 'harvest':
        return () => {
          const res = this.ctx.onHarvest();
          return res.success;
        };

      case 'can_harvest':
        return () => {
          const drone = this.ctx.getDrone();
          const tile = this.ctx.getTile(drone.x, drone.y);
          return !!(tile && tile.entity && tile.growth >= 0.99);
        };

      // 3. Planting & Tilling
      case 'plant':
        this.checkUnlock(Unlocks.Plant, 'plant()', line);
        return (entity: EntityType) => {
          return this.ctx.onPlant(entity);
        };

      case 'till':
        this.checkUnlock(Unlocks.Carrots, 'till()', line);
        return () => {
          return this.ctx.onTill();
        };

      // 4. Sensing & Coordinates
      case 'get_pos_x':
        this.checkUnlock(Unlocks.Senses, 'get_pos_x()', line);
        return () => this.ctx.getDrone().x;

      case 'get_pos_y':
        this.checkUnlock(Unlocks.Senses, 'get_pos_y()', line);
        return () => this.ctx.getDrone().y;

      case 'get_world_size':
        this.checkUnlock(Unlocks.Senses, 'get_world_size()', line);
        return () => this.ctx.getWorldSize();

      case 'get_entity_type':
        this.checkUnlock(Unlocks.Senses, 'get_entity_type()', line);
        return () => {
          const drone = this.ctx.getDrone();
          const tile = this.ctx.getTile(drone.x, drone.y);
          return tile?.entity || null;
        };

      case 'get_ground_type':
        this.checkUnlock(Unlocks.Senses, 'get_ground_type()', line);
        return () => {
          const drone = this.ctx.getDrone();
          const tile = this.ctx.getTile(drone.x, drone.y);
          return tile?.ground || Grounds.Grassland;
        };

      case 'get_water':
        this.checkUnlock(Unlocks.Watering, 'get_water()', line);
        return () => {
          const drone = this.ctx.getDrone();
          const tile = this.ctx.getTile(drone.x, drone.y);
          return tile ? Number(tile.waterLevel.toFixed(2)) : 0;
        };

      case 'measure':
        return () => this.ctx.onMeasure();

      case 'get_companion':
        this.checkUnlock(Unlocks.Polyculture, 'get_companion()', line);
        return () => this.ctx.getCompanion();

      case 'get_time':
        return () => this.ctx.getTime();

      case 'random':
        return () => Math.random();

      case 'num_drones':
        return () => 1;

      // 5. Items, Unlocks & Trade
      case 'use_item':
        return (item: ItemType, amount: number = 1) => {
          return this.ctx.onUseItem(item, amount);
        };

      case 'trade':
        return (item: ItemType, amount: number = 1) => {
          return this.ctx.onTrade(item, amount);
        };

      case 'num_items':
        return (item: ItemType) => {
          return this.ctx.getInventory()[item] || 0;
        };

      case 'unlock':
        return (unlock: UnlockType) => {
          return this.ctx.onUnlock(unlock);
        };

      case 'num_unlocked':
        return (unlock: UnlockType) => {
          return this.ctx.getUnlocks()[unlock] || 0;
        };

      case 'get_cost':
        return (thing: any) => {
          // returns cost dict like { Items.Hay: 10 }
          if (thing === Entities.Carrot) return { [Items.Wood]: 1 };
          if (thing === Entities.Pumpkin) return { [Items.Carrot]: 1 };
          if (thing === Entities.Sunflower) return { [Items.Carrot]: 2 };
          if (thing === Entities.Cactus) return { [Items.Pumpkin]: 2 };
          return {};
        };

      // 6. Drone Tricks & Output
      case 'do_a_flip':
        return () => {
          this.ctx.onFlip();
        };

      case 'print':
        return (...args: any[]) => {
          const str = args
            .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
            .join(' ');
          this.ctx.onPrint(str);
        };

      case 'quick_print':
        return (...args: any[]) => {
          const str = args
            .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
            .join(' ');
          this.ctx.onQuickPrint(str);
        };

      case 'clear':
        return () => {
          this.ctx.onClear();
        };

      default:
        return null;
    }
  }
}
