declare module 'node:sqlite' {
  export interface StatementResultingChanges {
    changes: number | bigint
    lastInsertRowid: number | bigint
  }

  export class StatementSync {
    run(...params: unknown[]): StatementResultingChanges
    get(...params: unknown[]): Record<string, unknown> | undefined
    all(...params: unknown[]): Record<string, unknown>[]
    iterate(...params: unknown[]): IterableIterator<Record<string, unknown>>
    expandedSQL: string
    sourceSQL: string
  }

  export class DatabaseSync {
    constructor(location: string, options?: { open?: boolean; readOnly?: boolean; enableForeignKeyConstraints?: boolean; enableDoubleQuotedStringLiterals?: boolean })
    open(): void
    close(): void
    prepare(sql: string): StatementSync
    exec(sql: string): void
    function(name: string, fn: (...args: unknown[]) => unknown): void
    loadExtension(path: string): void
  }
}
