import type { Migration } from './types'
import { m001_initial_schema } from './001_initial_schema'
import { m002_create_tecidos } from './002_create_tecidos'
import { m003_create_cores } from './003_create_cores'
import { m004_add_sku_to_cores } from './004_add_sku_to_cores'
import { m005_create_vinculos } from './005_create_vinculos'
import { m006_create_vendas_e_pedidos } from './006_create_vendas_e_pedidos'
import { m007_create_agentes } from './007_create_agentes'

export const migrations: Migration[] = [
  m001_initial_schema,
  m002_create_tecidos,
  m003_create_cores,
  m004_add_sku_to_cores,
  m005_create_vinculos,
  m006_create_vendas_e_pedidos,
  m007_create_agentes
]

export * from './types'
