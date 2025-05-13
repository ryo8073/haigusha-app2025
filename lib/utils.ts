import { LIFE_EXPECTANCY_TABLE } from './life_expectancy';
import { PRESENT_VALUE_FACTORS } from './present_value';

// 数値のフォーマット用ユーティリティ関数
export function formatNumberWithCommas(value: number | string): string {
  if (value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '';
  
  // 小数点以下の処理
  const parts = num.toString().split('.');
  // 整数部分にカンマを追加
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // 小数点以下が存在する場合は2桁に制限
  if (parts[1]) {
    parts[1] = parts[1].slice(0, 2);
  }
  return parts.join('.');
}

export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  // カンマを除去して数値に変換
  const num = parseFloat(value.replace(/,/g, ''));
  // 小数点以下2桁に制限して返す
  return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
}

const STRUCTURE_YEARS: { [key: string]: number } = {
  '鉄骨鉄筋コンクリート造又は鉄筋コンクリート造': 71,
  'れんが作り、石造またはブロック造': 57,
  '金属造（骨格材の肉厚4mm超)': 51,
  '金属造（骨格材の肉厚3mm超～4mm以下)': 41,
  '金属造（骨格材の肉厚3mm以下)': 29,
  '木造又は合成樹脂造': 33,
  '木骨モルタル造': 30,
};

export function getUsefulLife(structure: string): number {
  return STRUCTURE_YEARS[structure] || 0;
}

export function getLifeExpectancy(age: number, gender: string): number {
  const integerAge = Math.floor(age);
  if (integerAge < 18) return LIFE_EXPECTANCY_TABLE[18][gender === 'male' ? '男' : '女'];
  if (integerAge > 112) return LIFE_EXPECTANCY_TABLE[112][gender === 'male' ? '男' : '女'];
  return LIFE_EXPECTANCY_TABLE[integerAge][gender === 'male' ? '男' : '女'];
}

export function getPresentValueFactor(years: number): number {
  if (years < 1) return PRESENT_VALUE_FACTORS[1];
  if (years > 70) return PRESENT_VALUE_FACTORS[70];
  return PRESENT_VALUE_FACTORS[years];
}

function calcAge(birthday: string, referenceDate: string): number {
  const birth = new Date(birthday);
  const ref = new Date(referenceDate);
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }
  return Math.floor(age); // 満年齢（小数点以下切捨て）
}

function calcElapsedYears(start: string, end: string): number {
  // Excel: =ROUND(ROUND(DATEDIF(新築年月日,遺産分割日,"M")-1,0)/12,0)
  const d1 = new Date(start);
  const d2 = new Date(end);
  // 月数差
  const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  // Excel式に合わせて-1して四捨五入、さらに12で割って四捨五入
  return Math.round(Math.round(months - 1) / 12);
}

export function calculateResults(form: any) {
  const {
    inheritanceDate,
    divisionDate,
    constructionDate,
    structure,
    buildingValue,
    buildingArea,
    rentalArea,
    rentalRatio, // 賃貸入居率（%）
    landArea,
    roadPrice,
    landCorrection,
    leaseRatio,
    spouseBirthday,
    spouseGender,
    buildingOwnershipRatio = 100, // デフォルト値として100%
    landOwnershipRatio = 100,     // デフォルト値として100%
  } = form;

  // 面積関係の計算
  const rentalAreaRatio = buildingArea > 0 ? rentalArea / buildingArea : 0; // 賃貸面積割合
  const residentialRatio = 1 - rentalAreaRatio; // 居住面積割合
  const residentialArea = buildingArea * residentialRatio; // 居住用面積

  // 建物の評価額計算
  // 賃貸部分がある場合の建物評価額の減額
  // 賃貸面積割合と被相続人の持分割合を考慮
  const occupancyRate = rentalRatio / 100; // 賃貸入居率を小数に変換（土地評価減額で使用）
  const buildingTaxValue = Math.round(buildingValue * (1 - rentalAreaRatio * 0.3) * buildingOwnershipRatio / 100);

  // 建物の経過年数と耐用年数
  const elapsedYears = calcElapsedYears(constructionDate, divisionDate);
  const usefulLife = getUsefulLife(structure);

  // 配偶者の年齢と平均余命から複利現価率を算出
  const spouseAge = calcAge(spouseBirthday, divisionDate);
  const life = getLifeExpectancy(spouseAge, spouseGender);
  const pvf = getPresentValueFactor(life);

  // 配偶者居住権の計算
  // Step 1: 建物の固定資産税評価額に居住部分の割合と被相続人の持分割合を乗じる
  const baseValue = Math.round(buildingValue * residentialRatio * (buildingOwnershipRatio / 100));

  // Step 2: 残存耐用年数を計算
  const remainingYears = Math.max(0, usefulLife - elapsedYears);

  // Step 3: 配偶者居住権の価額を計算
  let buildingRight = 0;
  if (remainingYears > 0) {
    const remainingRatio = Math.min(1, life / remainingYears); // 1を超えないようにする
    buildingRight = Math.round(baseValue * (1 - ((1 - remainingRatio) * pvf)));
  } else {
    buildingRight = baseValue; // 耐用年数経過後は居住部分の価額をそのまま使用
  }

  // 建物の残存価額（所有権）の計算
  const settingBuilding = Math.round(buildingTaxValue - buildingRight);

  // 土地の評価額計算
  const landValue = Math.round(roadPrice * landArea * (landCorrection / 100));

  // 敷地利用権の計算
  // 被相続人の建物と土地の持分割合のうち、低い方を使用
  const lowerOwnershipRatio = Math.min(buildingOwnershipRatio, landOwnershipRatio);
  const landUse = Math.round(
    landValue * 
    residentialRatio * 
    (lowerOwnershipRatio / 100) * 
    (1 - pvf)
  );

  // 貸家建付地としての評価減の計算
  const rentalLandRatio = (leaseRatio / 100) * 0.3;
  
  // 評価減の額 = 土地評価額 * (借地権割合 * 0.3) * 賃貸面積割合 * 入居率 
  const landReduction = Math.round(landValue * rentalLandRatio * rentalAreaRatio * occupancyRate);

  // 土地所有権の価額 = 土地評価額 - 評価減の額 - 敷地利用権
  const landOwner = Math.round(landValue * lowerOwnershipRatio / 100 - landReduction - landUse);


  // 配偶者居住権等の価額の合計
  const spouseRightTotal = Math.round(buildingRight + landUse);
  // 残余財産の価額の合計
  const remainingAssetsTotal = Math.round(settingBuilding + landOwner);
  // 総合計
  const total = Math.round(spouseRightTotal + remainingAssetsTotal);

  return {
    spouseAge,
    life,
    pvf,
    elapsedYears,
    usefulLife,
    residentialArea,
    residentialRatio,
    rentalAreaRatio,
    rentalRatio: occupancyRate,
    buildingTaxValue,
    buildingRight,
    settingBuilding,
    landValue,
    landUse,
    landReduction,
    landOwner,
    spouseRightTotal,
    remainingAssetsTotal,
    total,
    // デバッグ用の追加情報
    remainingYears,
    baseValue
  };
}
