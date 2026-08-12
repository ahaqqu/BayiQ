export interface PreparedStatement {
  bind(...args: unknown[]): PreparedStatement;
  run(): Promise<unknown>;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results?: T[] }>;
}

export interface DatabaseStore {
  prepare(sql: string): PreparedStatement;
}

export type D1Like = {
  prepare(sql: string): PreparedStatement;
};

export function createD1DatabaseStore(db: D1Like): DatabaseStore {
  return {
    prepare(sql) {
      return db.prepare(sql);
    },
  };
}

type Verb = "run" | "first" | "all";
export type StatementHandler = Partial<Record<Verb, (binds: unknown[]) => unknown>>;

const norm = (sql: string): string => sql.replace(/\s+/g, " ").trim();

export function createMemoryDatabaseStore(
  handlers: Record<string, StatementHandler> = {},
): DatabaseStore {
  const table: Record<string, StatementHandler> = {};
  for (const [sql, handler] of Object.entries(handlers)) {
    table[norm(sql)] = handler;
  }

  function dispatch(sql: string, verb: Verb, binds: unknown[]): unknown {
    const handler = table[norm(sql)]?.[verb];
    if (!handler) {
      throw new Error(`memory-db: no ${verb} handler for: ${norm(sql)}`);
    }
    return handler(binds);
  }

  return {
    prepare(sql: string) {
      const binds: unknown[] = [];
      const stmt: PreparedStatement = {
        bind(...args: unknown[]) {
          binds.push(...args);
          return stmt;
        },
        async run() {
          const out = dispatch(sql, "run", binds);
          return out ?? { success: true };
        },
        async first<T>() {
          return dispatch(sql, "first", binds) as T | null;
        },
        async all<T>() {
          return { results: dispatch(sql, "all", binds) as T[] };
        },
      };
      return stmt;
    },
  };
}