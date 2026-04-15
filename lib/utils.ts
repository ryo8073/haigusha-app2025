import { LIFE_EXPECTANCY_TABLE } from './life_expectancy';
import { PRESENT_VALUE_FACTORS } from './present_value';

// 数値のフォーマット用ユーティリティ関数
export function formatNumberWithCommas(value: number | string): string {
  if (value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '';

  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (parts[1]) {
    parts[1] = parts[1].slice(0, 2);
  }
  return parts.join('.');
}

export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  const num = parseFloat(value.replace(/,/g, ''));
  return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
}

// 耐用年数テーブル
// 減価償却資産の耐用年数等に関する省令（住宅用）× 1.5
// 端数処理: 1年未満の端数は切り捨て（相続税法施行令第5条の8第1項）
//
// 法定耐用年数(住宅用) → ×1.5 → 端数切捨て
// RC造:     47年 × 1.5 = 70.5 → 70年
// れんが造:  38年 × 1.5 = 57.0 → 57年
// 金属4mm超: 34年 × 1.5 = 51.0 → 51年
// 金属3-4mm: 27年 × 1.5 = 40.5 → 40年
// 金属3mm以下:19年 × 1.5 = 28.5 → 28年
// 木造:     22年 × 1.5 = 33.0 → 33年
// 木骨モルタル:20年 × 1.5 = 30.0 → 30年
const STRUCTURE_YEARS: { [key: string]: number } = {
  '鉄骨鉄筋コンクリート造又は鉄筋コンクリート造': 70,
  'れんが造、石造又はブロック造': 57,
  '金属造（骨格材の肉厚4mm超)': 51,
  '金属造（骨格材の肉厚3mm超～4mm以下)': 40,
  '金属造（骨格材の肉厚3mm以下)': 28,
  '木造又は合成樹脂造': 33,
  '木骨モルタル造': 30,
};

export function getUsefulLife(structure: string): number {
  return STRUCTURE_YEARS[structure] || 0;
}

// 平均余命の取得（完全生命表より、6月以上切上げ済みの値）
export function getLifeExpectancy(age: number, gender: string): number {
  const integerAge = Math.floor(age);
  const clampedAge = Math.max(18, Math.min(114, integerAge));
  return LIFE_EXPECTANCY_TABLE[clampedAge][gender === 'male' ? '男' : '女'];
}

// 複利現価率の取得（法定利率年3%）
export function getPresentValueFactor(years: number): number {
  if (years < 1) return 1;
  if (years > 70) return PRESENT_VALUE_FACTORS[70];
  return PRESENT_VALUE_FACTORS[years];
}

// 満年齢の計算
function calcAge(birthday: string, referenceDate: string): number {
  const birth = new Date(birthday);
  const ref = new Date(referenceDate);
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }
  return Math.floor(age);
}

// 経過年数の計算
// 相続税法施行令第5条の8: 6月以上の端数は1年に切上げ、6月未満は切捨て
function calcElapsedYears(start: string, end: string): number {
  const d1 = new Date(start);
  const d2 = new Date(end);

  let years = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth() - d1.getMonth();
  const days = d2.getDate() - d1.getDate();

  if (days < 0) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  // 6月以上の端数は1年に切上げ、6月未満は切捨て
  return months >= 6 ? years + 1 : years;
}

// 配偶者居住権の評価計算
// 根拠法令:
//   相続税法第23条の2（配偶者居住権の評価）
//   相続税法施行令第5条の8
//   国税庁タックスアンサーNo.4666
export function calculateResults(form: any) {
  const {
    inheritanceDate,       // 相続開始日（評価基準日）
    constructionDate,      // 新築年月日
    structure,             // 建物構造
    buildingValue,         // 建物固定資産税評価額
    buildingArea,          // 建物延床面積
    rentalArea,            // 賃貸部分面積
    rentalRatio,           // 賃貸入居率（%）
    landArea,              // 土地面積
    roadPrice,             // 路線価
    landCorrection,        // 土地補正率（%）
    leaseRatio,            // 借地権割合（%）
    spouseBirthday,        // 配偶者生年月日
    spouseGender,          // 配偶者性別
    buildingOwnershipRatio = 100,  // 被相続人の建物持分割合（%）
    landOwnershipRatio = 100,      // 被相続人の土地持分割合（%）
  } = form;

  // ========================================
  // 1. 面積・割合の計算
  // ========================================
  const rentalAreaRatio = buildingArea > 0 ? rentalArea / buildingArea : 0;
  const residentialRatio = 1 - rentalAreaRatio;
  const residentialArea = buildingArea * residentialRatio;
  const occupancyRate = rentalRatio / 100;

  // ========================================
  // 2. 建物の耐用年数・経過年数
  // ========================================
  // 耐用年数 = 法定耐用年数(住宅用) × 1.5（端数切捨て）- テーブル参照
  const usefulLife = getUsefulLife(structure);

  // 経過年数 = 新築→相続開始日（6月以上切上げ）
  const elapsedYears = calcElapsedYears(constructionDate, inheritanceDate);

  // 残存耐用年数 = 耐用年数 - 経過年数（0以上）
  const remainingUsefulLife = Math.max(0, usefulLife - elapsedYears);

  // ========================================
  // 3. 配偶者の年齢・平均余命・複利現価率
  // ========================================
  // 配偶者の年齢（相続開始日時点の満年齢）
  const spouseAge = calcAge(spouseBirthday, inheritanceDate);

  // 平均余命（完全生命表より、6月以上切上げ済み）= 存続年数
  const lifeExpectancy = getLifeExpectancy(spouseAge, spouseGender);

  // 複利現価率（存続年数に応じた法定利率3%の複利現価率）
  const pvf = getPresentValueFactor(lifeExpectancy);

  // ========================================
  // 4. 配偶者居住権の価額（建物部分）
  // ========================================
  // 居住建物の時価 = 固定資産税評価額 × 居住面積割合 × 建物持分割合
  const residentialBuildingValue = Math.round(
    buildingValue * residentialRatio * (buildingOwnershipRatio / 100)
  );

  // 配偶者居住権の価額（建物）
  // = 居住建物の時価 - 居住建物の時価 × (残存耐用年数-存続年数)/残存耐用年数 × 複利現価率
  //
  // 特殊ケース:
  //   残存耐用年数 ≤ 0 → 配偶者居住権 = 居住建物の時価
  //   存続年数 ≥ 残存耐用年数 → 配偶者居住権 = 居住建物の時価
  let spouseResidenceRight = 0;
  if (remainingUsefulLife <= 0 || lifeExpectancy >= remainingUsefulLife) {
    spouseResidenceRight = residentialBuildingValue;
  } else {
    spouseResidenceRight = Math.round(
      residentialBuildingValue -
      residentialBuildingValue * (remainingUsefulLife - lifeExpectancy) / remainingUsefulLife * pvf
    );
  }

  // 居住建物の所有権の価額 = 居住建物の時価 - 配偶者居住権の価額
  const residentialBuildingOwnership = residentialBuildingValue - spouseResidenceRight;

  // ========================================
  // 5. 賃貸部分の建物評価額（貸家評価）
  // ========================================
  // 貸家の価額 = 固定資産税評価額 × 賃貸面積割合 × (1 - 借家権割合×入居率) × 持分割合
  // 借家権割合 = 30%（全国一律）
  const rentalBuildingValue = Math.round(
    buildingValue * rentalAreaRatio * (1 - 0.3 * occupancyRate) * (buildingOwnershipRatio / 100)
  );

  // ========================================
  // 6. 土地の評価
  // ========================================
  // 土地の自用地評価額 = 路線価 × 面積 × 補正率
  const landBaseValue = Math.round(roadPrice * landArea * (landCorrection / 100));

  // 居住部分の土地の時価 = 土地評価額 × 居住面積割合 × 土地持分割合
  const residentialLandValue = Math.round(
    landBaseValue * residentialRatio * (landOwnershipRatio / 100)
  );

  // ========================================
  // 7. 敷地利用権の価額
  // ========================================
  // 敷地利用権 = 居住部分の土地の時価 - 居住部分の土地の時価 × 複利現価率
  //            = 居住部分の土地の時価 × (1 - 複利現価率)
  const siteUseRight = Math.round(residentialLandValue * (1 - pvf));

  // 居住建物の敷地の所有権 = 居住部分の土地の時価 - 敷地利用権
  const residentialLandOwnership = residentialLandValue - siteUseRight;

  // ========================================
  // 8. 賃貸部分の土地評価額（貸家建付地）
  // ========================================
  // 貸家建付地 = 土地評価額 × 賃貸面積割合 × (1 - 借地権割合×借家権割合×入居率) × 土地持分割合
  const rentalLandValue = Math.round(
    landBaseValue * rentalAreaRatio *
    (1 - (leaseRatio / 100) * 0.3 * occupancyRate) *
    (landOwnershipRatio / 100)
  );

  // ========================================
  // 9. 合計
  // ========================================
  // 配偶者居住権等の合計 = 配偶者居住権(建物) + 敷地利用権
  const spouseRightTotal = spouseResidenceRight + siteUseRight;

  // 所有権等の合計 = 居住建物所有権 + 敷地所有権 + 賃貸建物 + 賃貸土地
  const ownershipTotal = residentialBuildingOwnership + residentialLandOwnership
    + rentalBuildingValue + rentalLandValue;

  // 総合計
  const total = spouseRightTotal + ownershipTotal;

  return {
    // 配偶者情報
    spouseAge,
    lifeExpectancy,
    pvf,

    // 建物情報
    elapsedYears,
    usefulLife,
    remainingUsefulLife,

    // 面積情報
    residentialArea,
    residentialRatio,
    rentalAreaRatio,
    occupancyRate,

    // 建物計算結果
    residentialBuildingValue,
    spouseResidenceRight,
    residentialBuildingOwnership,
    rentalBuildingValue,

    // 土地計算結果
    landBaseValue,
    residentialLandValue,
    siteUseRight,
    residentialLandOwnership,
    rentalLandValue,

    // 合計
    spouseRightTotal,
    ownershipTotal,
    total,
  };
}
