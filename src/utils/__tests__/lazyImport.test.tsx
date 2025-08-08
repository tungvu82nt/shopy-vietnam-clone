import React from 'react'
import { describe, it, expect } from 'vitest'
import { lazyImport } from '../lazyImport'

describe('lazyImport', () => {
  it('returns object with own enumerable property', () => {
    const factory = () => Promise.resolve({ Dummy: () => React.createElement('div') })
    const imported = lazyImport(factory, 'Dummy')
    expect(Object.keys(imported)).toContain('Dummy')
    expect(imported.Dummy).toBeDefined()
  })
})
