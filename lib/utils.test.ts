import { calculateResults } from './utils';

describe('calculateResults', () => {
  it('should calculate correct results for a typical case', () => {
    const form = {
      inheritanceDate: '2024-01-01',
      divisionDate: '2024-04-01',
      constructionDate: '2000-01-01',
      structure: '鉄骨鉄筋コンクリート造又は鉄筋コンクリート造',
      buildingValue: 30000000,
      buildingArea: 100,
      rentalArea: 20,
      rentalRatio: 80, // %
      landArea: 120,
      roadPrice: 200000,
      landCorrection: 100,
      leaseRatio: 90,
      spouseBirthday: '1960-01-01',
      spouseGender: 'female',
      buildingOwnershipRatio: 100,
      landOwnershipRatio: 100,
    };
    const result = calculateResults(form);
    // 主要な値が期待通りかどうかを確認
    expect(result.spouseAge).toBe(64);
    expect(result.usefulLife).toBe(71);
    expect(result.elapsedYears).toBe(24);
    expect(result.residentialArea).toBeCloseTo(80);
    expect(result.buildingTaxValue).toBeGreaterThan(0);
    expect(result.landValue).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it('should handle zero building area gracefully', () => {
    const form = {
      inheritanceDate: '2024-01-01',
      divisionDate: '2024-04-01',
      constructionDate: '2000-01-01',
      structure: '鉄骨鉄筋コンクリート造又は鉄筋コンクリート造',
      buildingValue: 30000000,
      buildingArea: 0,
      rentalArea: 0,
      rentalRatio: 0,
      landArea: 120,
      roadPrice: 200000,
      landCorrection: 100,
      leaseRatio: 90,
      spouseBirthday: '1960-01-01',
      spouseGender: 'female',
      buildingOwnershipRatio: 100,
      landOwnershipRatio: 100,
    };
    const result = calculateResults(form);
    expect(result.residentialArea).toBe(0);
    expect(result.buildingTaxValue).toBe(30000000);
  });
}); 