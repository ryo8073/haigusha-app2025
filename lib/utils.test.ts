import { calculateResults, getUsefulLife, getPresentValueFactor, getLifeExpectancy } from './utils';

// 耐用年数テーブルのテスト（法定耐用年数×1.5、端数切捨て）
describe('getUsefulLife', () => {
  it('鉄骨鉄筋コンクリート造: 47×1.5=70.5→70', () => {
    expect(getUsefulLife('鉄骨鉄筋コンクリート造又は鉄筋コンクリート造')).toBe(70);
  });

  it('れんが造: 38×1.5=57', () => {
    expect(getUsefulLife('れんが造、石造又はブロック造')).toBe(57);
  });

  it('金属造4mm超: 34×1.5=51', () => {
    expect(getUsefulLife('金属造（骨格材の肉厚4mm超)')).toBe(51);
  });

  it('金属造3-4mm: 27×1.5=40.5→40', () => {
    expect(getUsefulLife('金属造（骨格材の肉厚3mm超～4mm以下)')).toBe(40);
  });

  it('金属造3mm以下: 19×1.5=28.5→28', () => {
    expect(getUsefulLife('金属造（骨格材の肉厚3mm以下)')).toBe(28);
  });

  it('木造: 22×1.5=33', () => {
    expect(getUsefulLife('木造又は合成樹脂造')).toBe(33);
  });

  it('木骨モルタル造: 20×1.5=30', () => {
    expect(getUsefulLife('木骨モルタル造')).toBe(30);
  });

  it('不明な構造は0', () => {
    expect(getUsefulLife('不明')).toBe(0);
  });
});

// 複利現価率のテスト（法定利率年3%）
describe('getPresentValueFactor', () => {
  it('0年以下は1を返す', () => {
    expect(getPresentValueFactor(0)).toBe(1);
  });

  it('1年 = 0.971', () => {
    expect(getPresentValueFactor(1)).toBe(0.971);
  });

  it('10年 = 0.744', () => {
    expect(getPresentValueFactor(10)).toBe(0.744);
  });

  it('70年超は70年の値', () => {
    expect(getPresentValueFactor(100)).toBe(0.126);
  });
});

// 平均余命テーブルのテスト
describe('getLifeExpectancy', () => {
  it('65歳男性の平均余命', () => {
    expect(getLifeExpectancy(65, 'male')).toBe(20);
  });

  it('65歳女性の平均余命', () => {
    expect(getLifeExpectancy(65, 'female')).toBe(25);
  });

  it('18歳未満は18歳の値を使用', () => {
    expect(getLifeExpectancy(10, 'male')).toBe(64);
  });
});

// 計算結果テスト：自用住宅（賃貸なし）のケース
describe('calculateResults - 自用住宅', () => {
  const form = {
    inheritanceDate: '2024-01-15',
    constructionDate: '2000-06-01',
    structure: '鉄骨鉄筋コンクリート造又は鉄筋コンクリート造',
    buildingValue: 20000000,
    buildingArea: 100,
    rentalArea: 0,
    rentalRatio: 0,
    landArea: 200,
    roadPrice: 300000,
    landCorrection: 100,
    leaseRatio: 60,
    spouseBirthday: '1960-03-20',
    spouseGender: 'female',
    buildingOwnershipRatio: 100,
    landOwnershipRatio: 100,
  };

  const result = calculateResults(form);

  it('配偶者年齢が正しい（相続開始日基準）', () => {
    // 1960-03-20生まれ → 2024-01-15時点 = 63歳
    expect(result.spouseAge).toBe(63);
  });

  it('平均余命が正しい', () => {
    // 63歳女性 = 26年（完全生命表より）
    expect(result.lifeExpectancy).toBe(26);
  });

  it('複利現価率が正しい', () => {
    // 26年の複利現価率 = 0.464
    expect(result.pvf).toBe(0.464);
  });

  it('耐用年数が正しい', () => {
    // RC造: 47×1.5 = 70
    expect(result.usefulLife).toBe(70);
  });

  it('経過年数が正しい（6月以上切上げ）', () => {
    // 2000-06-01 → 2024-01-15: 23年7ヶ月14日 → 7ヶ月≧6月 → 24年
    expect(result.elapsedYears).toBe(24);
  });

  it('残存耐用年数が正しい', () => {
    // 70 - 24 = 46
    expect(result.remainingUsefulLife).toBe(46);
  });

  it('居住面積割合が100%', () => {
    expect(result.residentialRatio).toBe(1);
    expect(result.residentialArea).toBe(100);
  });

  it('居住建物の時価が正しい', () => {
    // 20,000,000 × 100% × 100% = 20,000,000
    expect(result.residentialBuildingValue).toBe(20000000);
  });

  it('配偶者居住権（建物）が正しい', () => {
    // A = 20,000,000
    // 配偶者居住権 = A - A × (46-26)/46 × 0.464
    // = 20,000,000 - 20,000,000 × 20/46 × 0.464
    // = 20,000,000 - 20,000,000 × 0.43478... × 0.464
    // = 20,000,000 - 4,034.78... = 20,000,000 - 4,034,782.6...
    // ≈ 20,000,000 - 4,034,783 (rounded differently)
    // Let me compute: 20000000 * 20 / 46 * 0.464 = 20000000 * 0.2017391... = 4034782.6...
    // Math.round(20000000 - 4034782.6...) = Math.round(15965217.4) = 15965217
    expect(result.spouseResidenceRight).toBe(15965217);
  });

  it('居住建物の所有権が正しい', () => {
    // 20,000,000 - 15,965,217 = 4,034,783
    expect(result.residentialBuildingOwnership).toBe(4034783);
  });

  it('賃貸部分は0', () => {
    expect(result.rentalBuildingValue).toBe(0);
    expect(result.rentalLandValue).toBe(0);
  });

  it('土地評価額が正しい', () => {
    // 300,000 × 200 × 100% = 60,000,000
    expect(result.landBaseValue).toBe(60000000);
  });

  it('居住部分の土地の時価が正しい', () => {
    // 60,000,000 × 100% × 100% = 60,000,000
    expect(result.residentialLandValue).toBe(60000000);
  });

  it('敷地利用権が正しい', () => {
    // 60,000,000 × (1 - 0.464) = 60,000,000 × 0.536 = 32,160,000
    expect(result.siteUseRight).toBe(32160000);
  });

  it('敷地の所有権が正しい', () => {
    // 60,000,000 - 32,160,000 = 27,840,000
    expect(result.residentialLandOwnership).toBe(27840000);
  });

  it('合計が正しい', () => {
    // 配偶者居住権等: 15,965,217 + 32,160,000 = 48,125,217
    expect(result.spouseRightTotal).toBe(48125217);
    // 所有権等: 4,034,783 + 27,840,000 = 31,874,783
    expect(result.ownershipTotal).toBe(31874783);
    // 総合計: 48,125,217 + 31,874,783 = 80,000,000
    expect(result.total).toBe(80000000);
  });
});

// 計算結果テスト：賃貸併用住宅のケース
describe('calculateResults - 賃貸併用住宅', () => {
  const form = {
    inheritanceDate: '2024-06-01',
    constructionDate: '2005-01-01',
    structure: '鉄骨鉄筋コンクリート造又は鉄筋コンクリート造',
    buildingValue: 30000000,
    buildingArea: 200,
    rentalArea: 80,
    rentalRatio: 100,
    landArea: 150,
    roadPrice: 200000,
    landCorrection: 100,
    leaseRatio: 70,
    spouseBirthday: '1960-01-01',
    spouseGender: 'female',
    buildingOwnershipRatio: 100,
    landOwnershipRatio: 100,
  };

  const result = calculateResults(form);

  it('面積割合が正しい', () => {
    expect(result.rentalAreaRatio).toBe(0.4);  // 80/200
    expect(result.residentialRatio).toBe(0.6); // 1 - 0.4
    expect(result.residentialArea).toBe(120);  // 200 × 0.6
  });

  it('経過年数が正しい', () => {
    // 2005-01-01 → 2024-06-01: 19年5ヶ月0日 → 5ヶ月<6月 → 19年
    expect(result.elapsedYears).toBe(19);
  });

  it('残存耐用年数が正しい', () => {
    // 70 - 19 = 51
    expect(result.remainingUsefulLife).toBe(51);
  });

  it('配偶者年齢が正しい', () => {
    // 1960-01-01 → 2024-06-01 = 64歳
    expect(result.spouseAge).toBe(64);
  });

  it('居住建物の時価が正しい', () => {
    // 30,000,000 × 60% × 100% = 18,000,000
    expect(result.residentialBuildingValue).toBe(18000000);
  });

  it('賃貸建物の評価額が正しい', () => {
    // 30,000,000 × 40% × (1 - 0.3 × 100%) × 100% = 12,000,000 × 0.7 = 8,400,000
    expect(result.rentalBuildingValue).toBe(8400000);
  });

  it('賃貸土地の評価額（貸家建付地）が正しい', () => {
    // 土地評価額 = 200,000 × 150 × 100% = 30,000,000
    // 賃貸土地 = 30,000,000 × 40% × (1 - 70% × 30% × 100%) × 100%
    //          = 12,000,000 × (1 - 0.21) = 12,000,000 × 0.79 = 9,480,000
    expect(result.rentalLandValue).toBe(9480000);
  });

  it('総合計が正しい', () => {
    expect(result.total).toBe(result.spouseRightTotal + result.ownershipTotal);
  });
});

// エッジケース: 建物面積0
describe('calculateResults - エッジケース', () => {
  it('建物面積0でも安全に計算できる', () => {
    const form = {
      inheritanceDate: '2024-01-01',
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
    // 面積0の場合、賃貸面積割合=0 → 居住割合=100% → 建物評価額がそのまま
    expect(result.residentialBuildingValue).toBe(30000000);
  });

  it('耐用年数超過の場合、配偶者居住権 = 居住建物の時価', () => {
    const form = {
      inheritanceDate: '2024-01-01',
      constructionDate: '1940-01-01',  // 84年前
      structure: '木造又は合成樹脂造',  // 耐用年数33年
      buildingValue: 5000000,
      buildingArea: 80,
      rentalArea: 0,
      rentalRatio: 0,
      landArea: 100,
      roadPrice: 100000,
      landCorrection: 100,
      leaseRatio: 60,
      spouseBirthday: '1960-01-01',
      spouseGender: 'female',
      buildingOwnershipRatio: 100,
      landOwnershipRatio: 100,
    };
    const result = calculateResults(form);
    expect(result.remainingUsefulLife).toBe(0);
    // 耐用年数超過 → 配偶者居住権 = 居住建物の時価
    expect(result.spouseResidenceRight).toBe(result.residentialBuildingValue);
    // 居住建物の所有権 = 0
    expect(result.residentialBuildingOwnership).toBe(0);
  });
});
