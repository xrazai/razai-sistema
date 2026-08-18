import type { Migration } from './types'
import { m001_initial_schema } from './001_initial_schema'
import { m002_create_tecidos } from './002_create_tecidos'

export const migrations: Migration[] = [
  m001_initial_schema,
  m002_create_tecidos
]

export * from './types'
