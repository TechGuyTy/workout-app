import { describe, it, expect } from 'vitest'
import {
  calculate1RM,
  calculate1RMBrzycki,
  calculate1RMLombardi,
  convertWeight,
  formatDate,
  getRPEValue,
  validateWeight,
  validateReps,
  validateRPE,
} from './utils'

describe('Utility Functions', () => {
  describe('1RM Calculations', () => {
    it('should calculate 1RM using Epley formula', () => {
      expect(calculate1RM(100, 5)).toBe(117)
      expect(calculate1RM(200, 10)).toBe(267)
      expect(calculate1RM(135, 1)).toBe(135)
    })

    it('should calculate 1RM using Brzycki formula', () => {
      expect(calculate1RMBrzycki(100, 5)).toBe(113)
      expect(calculate1RMBrzycki(200, 10)).toBe(267)
      expect(calculate1RMBrzycki(135, 1)).toBe(135)
    })

    it('should calculate 1RM using Lombardi formula', () => {
      expect(calculate1RMLombardi(100, 5)).toBe(115)
      expect(calculate1RMLombardi(200, 10)).toBe(251)
      expect(calculate1RMLombardi(135, 1)).toBe(135)
    })

    it('should handle edge cases', () => {
      expect(calculate1RM(0, 5)).toBe(0)
      expect(calculate1RM(100, 0)).toBe(0)
    })
  })

  describe('Weight Conversion', () => {
    it('should convert lbs to kg', () => {
      expect(convertWeight(100, 'lbs', 'kg')).toBe(45.36)
      expect(convertWeight(225, 'lbs', 'kg')).toBe(102.06)
    })

    it('should convert kg to lbs', () => {
      expect(convertWeight(45.36, 'kg', 'lbs')).toBe(100)
      expect(convertWeight(102.06, 'kg', 'lbs')).toBe(225)
    })

    it('should return same value for same units', () => {
      expect(convertWeight(100, 'lbs', 'lbs')).toBe(100)
      expect(convertWeight(45.36, 'kg', 'kg')).toBe(45.36)
    })
  })

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toMatch(/Jan 15/)
    })

    it('should handle string dates', () => {
      expect(formatDate('2024-01-15')).toMatch(/Jan 15/)
    })
  })

  describe('RPE Functions', () => {
    it('should return correct RPE descriptions', () => {
      expect(getRPEValue(1)).toBe('Very Light')
      expect(getRPEValue(5)).toBe('Moderate')
      expect(getRPEValue(10)).toBe('Maximum')
      expect(getRPEValue(99)).toBe('Unknown')
    })
  })

  describe('Validation Functions', () => {
    it('should validate weight correctly', () => {
      expect(validateWeight(100)).toBe(true)
      expect(validateWeight(0)).toBe(true)
      expect(validateWeight(-10)).toBe(false)
      expect(validateWeight(10000)).toBe(false)
    })

    it('should validate reps correctly', () => {
      expect(validateReps(10)).toBe(true)
      expect(validateReps(0)).toBe(true)
      expect(validateReps(-5)).toBe(false)
      expect(validateReps(1000)).toBe(false)
    })

    it('should validate RPE correctly', () => {
      expect(validateRPE(5)).toBe(true)
      expect(validateRPE(1)).toBe(true)
      expect(validateRPE(10)).toBe(true)
      expect(validateRPE(0)).toBe(false)
      expect(validateRPE(11)).toBe(false)
    })
  })
})
