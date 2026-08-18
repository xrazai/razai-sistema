import type { Migration } from './types'
import { m001_initial_schema } from './001_initial_schema'
import { m002_create_tecidos } from './002_create_tecidos'
import { m003_create_cores } from './003_create_cores'

export const migrations: Migration[] = [
  m001_initial_schema,
  m002_create_tecidos,
  m003_create_cores
]

export * from './types'
