// app/page.tsx - 配偶者居住権評価計算アプリ
'use client';

import { useState, useCallback } from 'react';
import { calculateResults, formatNumberWithCommas, parseFormattedNumber, getUsefulLife, getLifeExpectancy } from '@/lib/utils';

// 建物構造の選択肢
const STRUCTURE_OPTIONS = [
  '鉄骨鉄筋コンクリート造又は鉄筋コンクリート造',
  'れんが造、石造又はブロック造',
  '金属造（骨格材の肉厚4mm超)',
  '金属造（骨格材の肉厚3mm超～4mm以下)',
  '金属造（骨格材の肉厚3mm以下)',
  '木造又は合成樹脂造',
  '木骨モルタル造',
];

// 借地権割合の選択肢
const LEASE_RATIO_OPTIONS = [
  { label: 'A 90%', value: 90 },
  { label: 'B 80%', value: 80 },
  { label: 'C 70%', value: 70 },
  { label: 'D 60%', value: 60 },
  { label: 'E 50%', value: 50 },
  { label: 'F 40%', value: 40 },
  { label: 'G 30%', value: 30 },
];

// ヘルプテキストコンポーネント
function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-gray-500 leading-relaxed">{children}</p>;
}

// セクションヘッダーコンポーネント
function SectionHeader({ color, title, subtitle }: { color: string; title: string; subtitle?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-800 border-blue-200',
    green: 'text-green-800 border-green-200',
    yellow: 'text-yellow-800 border-yellow-200',
    purple: 'text-purple-800 border-purple-200',
  };
  return (
    <div className={`border-b ${colorMap[color]} pb-2 mb-4`}>
      <h2 className={`text-lg font-semibold ${colorMap[color].split(' ')[0]}`}>{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function Home() {
  const [form, setForm] = useState({
    inheritanceDate: '',
    constructionDate: '',
    structure: '',
    buildingValue: 0,
    buildingArea: 0,
    rentalArea: 0,
    rentalRatio: 0,
    landArea: 0,
    roadPrice: 0,
    landCorrection: 100,
    leaseRatio: 60,
    spouseBirthday: '',
    spouseGender: 'female',
    buildingOwnershipRatio: 100,
    landOwnershipRatio: 100,
  });

  const [displayValues, setDisplayValues] = useState({
    buildingValue: '',
    buildingArea: '',
    rentalArea: '',
    landArea: '',
    roadPrice: '',
  });

  const [results, setResults] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleChange = useCallback((e: any) => {
    const { name, value } = e.target;

    // 計算結果をクリア
    setResults(null);
    setErrors([]);

    if ([
      'rentalRatio', 'landCorrection', 'leaseRatio',
      'buildingOwnershipRatio', 'landOwnershipRatio'
    ].includes(name)) {
      setForm(prev => ({ ...prev, [name]: value }));
    } else if ([
      'buildingValue', 'buildingArea', 'rentalArea', 'landArea', 'roadPrice'
    ].includes(name)) {
      setDisplayValues(prev => ({ ...prev, [name]: value }));
      setForm(prev => ({ ...prev, [name]: parseFormattedNumber(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const validate = useCallback((): string[] => {
    const errs: string[] = [];
    if (!form.inheritanceDate) errs.push('相続開始日を入力してください');
    if (!form.constructionDate) errs.push('新築年月日を入力してください');
    if (!form.structure) errs.push('建物構造を選択してください');
    if (form.buildingValue <= 0) errs.push('建物固定資産税評価額を入力してください');
    if (form.buildingArea <= 0) errs.push('建物延床面積を入力してください');
    if (form.rentalArea > form.buildingArea) errs.push('賃貸部分面積は延床面積以下にしてください');
    if (form.landArea <= 0) errs.push('土地面積を入力してください');
    if (form.roadPrice <= 0) errs.push('路線価を入力してください');
    if (!form.spouseBirthday) errs.push('配偶者の生年月日を入力してください');
    if (form.inheritanceDate && form.constructionDate) {
      if (new Date(form.constructionDate) > new Date(form.inheritanceDate)) {
        errs.push('新築年月日は相続開始日より前にしてください');
      }
    }
    if (form.inheritanceDate && form.spouseBirthday) {
      if (new Date(form.spouseBirthday) > new Date(form.inheritanceDate)) {
        errs.push('配偶者の生年月日は相続開始日より前にしてください');
      }
    }
    return errs;
  }, [form]);

  const handleCalculate = useCallback(() => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setResults(null);
      return;
    }
    setErrors([]);
    const result = calculateResults(form);
    setResults(result);

    // 結果エリアにスクロール
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [form, validate]);

  const handleReset = useCallback(() => {
    setForm({
      inheritanceDate: '',
      constructionDate: '',
      structure: '',
      buildingValue: 0,
      buildingArea: 0,
      rentalArea: 0,
      rentalRatio: 0,
      landArea: 0,
      roadPrice: 0,
      landCorrection: 100,
      leaseRatio: 60,
      spouseBirthday: '',
      spouseGender: 'female',
      buildingOwnershipRatio: 100,
      landOwnershipRatio: 100,
    });
    setDisplayValues({
      buildingValue: '',
      buildingArea: '',
      rentalArea: '',
      landArea: '',
      roadPrice: '',
    });
    setResults(null);
    setErrors([]);
  }, []);

  // 中間計算値（リアルタイム表示用）
  const usefulLife = getUsefulLife(form.structure);
  const residentialArea = form.buildingArea > 0 ? form.buildingArea - form.rentalArea : 0;
  const landValue = form.landArea > 0 && form.roadPrice > 0
    ? Math.round(form.landArea * form.roadPrice * (form.landCorrection / 100))
    : 0;
  const spouseAge = (form.spouseBirthday && form.inheritanceDate) ? (() => {
    const birth = new Date(form.spouseBirthday);
    const ref = new Date(form.inheritanceDate);
    let age = ref.getFullYear() - birth.getFullYear();
    const m = ref.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
    return Math.floor(age);
  })() : null;
  const spouseLife = (spouseAge !== null && form.spouseGender) ? getLifeExpectancy(spouseAge, form.spouseGender) : null;

  const hasRental = form.rentalArea > 0;

  // 入力フィールドの共通スタイル
  const inputBase = "bg-white border-2 shadow-sm rounded-lg px-4 py-3 text-base transition-all w-full outline-none";
  const inputBlue = `${inputBase} border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100`;
  const inputGreen = `${inputBase} border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-100`;
  const inputYellow = `${inputBase} border-yellow-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100`;
  const inputPurple = `${inputBase} border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">配偶者居住権評価計算</h1>
            <p className="text-xs text-gray-500">相続税法第23条の2に基づく評価額の算出</p>
          </div>
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-red-600 border border-gray-300 hover:border-red-300 rounded-lg px-3 py-1.5 transition-colors"
          >
            リセット
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* 基本情報 */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-blue-100">
          <SectionHeader color="blue" title="基本情報" subtitle="相続開始日は全ての評価の基準日となります" />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                相続開始日（被相続人の死亡日）
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                name="inheritanceDate"
                value={form.inheritanceDate}
                onChange={handleChange}
                className={inputBlue}
              />
              <HelpText>配偶者の年齢、建物の経過年数等はこの日を基準に計算します</HelpText>
            </div>
          </div>
        </section>

        {/* 建物情報 */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-green-100">
          <SectionHeader color="green" title="建物情報" subtitle="固定資産税の課税明細書等を参照してください" />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                建物構造<span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="structure"
                value={form.structure}
                onChange={handleChange}
                className={inputGreen}
              >
                <option value="">-- 選択してください --</option>
                {STRUCTURE_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {form.structure && (
                <p className="text-sm text-green-700 mt-1 font-medium">
                  耐用年数（住宅用×1.5）: {usefulLife}年
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                新築年月日<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                name="constructionDate"
                value={form.constructionDate}
                onChange={handleChange}
                className={inputGreen}
              />
              <HelpText>登記簿謄本または固定資産税課税明細書の新築年月日</HelpText>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                建物固定資産税評価額（円）<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="buildingValue"
                value={formatNumberWithCommas(displayValues.buildingValue)}
                onChange={handleChange}
                placeholder="例: 20,000,000"
                className={inputGreen}
              />
              <HelpText>固定資産税の課税明細書に記載の評価額</HelpText>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  建物延床面積（m²）<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="buildingArea"
                  value={displayValues.buildingArea}
                  onChange={handleChange}
                  placeholder="例: 120.50"
                  className={inputGreen}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  賃貸部分面積（m²）
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="rentalArea"
                  value={displayValues.rentalArea}
                  onChange={handleChange}
                  placeholder="0"
                  className={inputGreen}
                />
                <HelpText>賃貸部分がない場合は0</HelpText>
              </div>
            </div>

            {residentialArea > 0 && (
              <div className="bg-green-50 rounded-lg px-4 py-2 text-sm text-green-800">
                居住用面積: <span className="font-semibold">{residentialArea.toFixed(2)} m²</span>
                {hasRental && (
                  <span className="ml-3">
                    （居住割合: {((1 - form.rentalArea / form.buildingArea) * 100).toFixed(1)}%）
                  </span>
                )}
              </div>
            )}

            {hasRental && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  賃貸入居率（%）
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  name="rentalRatio"
                  value={form.rentalRatio}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="1"
                  className={inputGreen}
                />
                <HelpText>相続開始日時点の入居率。借家権割合30%で貸家評価に使用</HelpText>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                被相続人の建物持分割合（%）
              </label>
              <input
                type="number"
                inputMode="decimal"
                name="buildingOwnershipRatio"
                value={form.buildingOwnershipRatio}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className={inputGreen}
              />
              <HelpText>共有の場合のみ変更。単独所有なら100%のまま</HelpText>
            </div>
          </div>
        </section>

        {/* 土地情報 */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-yellow-100">
          <SectionHeader color="yellow" title="土地情報" subtitle="路線価図で路線価と借地権割合を確認してください" />
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  土地面積（m²）<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="landArea"
                  value={displayValues.landArea}
                  onChange={handleChange}
                  placeholder="例: 200.00"
                  className={inputYellow}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  路線価（円/m²）<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="roadPrice"
                  value={formatNumberWithCommas(displayValues.roadPrice)}
                  onChange={handleChange}
                  placeholder="例: 300,000"
                  className={inputYellow}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                借地権割合
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {LEASE_RATIO_OPTIONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-label={`借地権割合: ${item.label}`}
                    onClick={() => handleChange({ target: { name: 'leaseRatio', value: item.value } })}
                    className={`
                      px-2 py-2.5 rounded-lg transition-all text-sm font-semibold border-2 text-center
                      ${form.leaseRatio == item.value
                        ? 'bg-yellow-100 border-yellow-500 shadow-md text-yellow-800'
                        : 'bg-white border-yellow-200 hover:bg-yellow-50 hover:border-yellow-400 text-gray-600'}
                      focus:outline-none focus:ring-2 focus:ring-yellow-200
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <HelpText>路線価図のアルファベット記号に対応。賃貸部分の貸家建付地評価に使用</HelpText>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  土地補正率（%）
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  name="landCorrection"
                  value={form.landCorrection}
                  onChange={handleChange}
                  min="0"
                  max="200"
                  step="0.01"
                  className={inputYellow}
                />
                <HelpText>奥行価格補正等。補正なしは100%</HelpText>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  被相続人の土地持分割合（%）
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  name="landOwnershipRatio"
                  value={form.landOwnershipRatio}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className={inputYellow}
                />
                <HelpText>共有の場合のみ変更。単独所有なら100%</HelpText>
              </div>
            </div>

            {landValue > 0 && (
              <div className="bg-yellow-50 rounded-lg px-4 py-2 text-sm text-yellow-800">
                土地評価額（自用地）: <span className="font-semibold">{formatNumberWithCommas(landValue)}円</span>
              </div>
            )}
          </div>
        </section>

        {/* 配偶者情報 */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-purple-100">
          <SectionHeader color="purple" title="配偶者情報" subtitle="第23回完全生命表（令和2年）に基づく平均余命を使用" />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                生年月日<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                name="spouseBirthday"
                value={form.spouseBirthday}
                onChange={handleChange}
                className={inputPurple}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                {[
                  { value: 'female', label: '女性' },
                  { value: 'male', label: '男性' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={`配偶者の性別: ${option.label}`}
                    onClick={() => handleChange({ target: { name: 'spouseGender', value: option.value } })}
                    className={`
                      px-4 py-3 rounded-lg transition-all text-base font-semibold border-2
                      ${form.spouseGender === option.value
                        ? 'bg-purple-100 border-purple-500 shadow-md text-purple-800'
                        : 'bg-white border-purple-200 hover:bg-purple-50 hover:border-purple-400 text-gray-600'}
                      focus:outline-none focus:ring-2 focus:ring-purple-200
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {spouseAge !== null && (
              <div className="bg-purple-50 rounded-lg px-4 py-2 text-sm text-purple-800 space-y-1">
                <div>相続開始日時点の年齢: <span className="font-semibold">{spouseAge}歳</span></div>
                {spouseLife !== null && (
                  <div>平均余命（存続年数）: <span className="font-semibold">{spouseLife}年</span></div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* エラー表示 */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-red-800 mb-2">入力内容を確認してください</h3>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {/* 計算ボタン */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleCalculate}
            className="
              bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white
              px-10 py-4 rounded-xl shadow-lg
              transition duration-200 ease-in-out
              transform hover:-translate-y-0.5 hover:shadow-xl
              text-lg font-bold
              flex items-center justify-center
              min-w-[260px]
              focus:outline-none focus:ring-4 focus:ring-blue-200
            "
          >
            計算する
          </button>
        </div>

        {/* 計算結果エリア */}
        <section id="result-section" aria-labelledby="result-title" className="pt-2">
          <h2 id="result-title" className="text-xl font-bold text-gray-800 mb-4">計算結果</h2>

          {!results ? (
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center min-h-[160px] text-gray-500">
              <span className="text-lg font-medium mb-1">ここに計算結果が表示されます</span>
              <span className="text-sm">必要事項を入力し「計算する」を押してください</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* メインサマリー: 2カード */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 配偶者居住権等の合計 */}
                <div className="bg-white rounded-xl shadow-md border-l-4 border-purple-500 p-5">
                  <h3 className="text-sm font-semibold text-purple-700 mb-1">配偶者居住権等の価額（合計）</h3>
                  <p className="text-2xl font-bold text-purple-600 mb-3">
                    {results.spouseRightTotal.toLocaleString()} 円
                  </p>
                  <div className="text-sm text-gray-700 space-y-1.5 border-t border-gray-100 pt-2">
                    <div className="flex justify-between">
                      <span>配偶者居住権（建物）</span>
                      <span className="font-medium">{results.spouseResidenceRight.toLocaleString()} 円</span>
                    </div>
                    <div className="flex justify-between">
                      <span>敷地利用権（土地）</span>
                      <span className="font-medium">{results.siteUseRight.toLocaleString()} 円</span>
                    </div>
                  </div>
                </div>

                {/* 所有権等の合計 */}
                <div className="bg-white rounded-xl shadow-md border-l-4 border-blue-500 p-5">
                  <h3 className="text-sm font-semibold text-blue-700 mb-1">所有権等の価額（合計）</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-3">
                    {results.ownershipTotal.toLocaleString()} 円
                  </p>
                  <div className="text-sm text-gray-700 space-y-1.5 border-t border-gray-100 pt-2">
                    <div className="flex justify-between">
                      <span>居住建物の所有権</span>
                      <span className="font-medium">{results.residentialBuildingOwnership.toLocaleString()} 円</span>
                    </div>
                    <div className="flex justify-between">
                      <span>居住建物の敷地の所有権</span>
                      <span className="font-medium">{results.residentialLandOwnership.toLocaleString()} 円</span>
                    </div>
                    {hasRental && (
                      <>
                        <div className="flex justify-between text-gray-500">
                          <span>賃貸部分の建物（貸家）</span>
                          <span className="font-medium">{results.rentalBuildingValue.toLocaleString()} 円</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>賃貸部分の土地（貸家建付地）</span>
                          <span className="font-medium">{results.rentalLandValue.toLocaleString()} 円</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 総合計 */}
              <div className="bg-gray-800 text-white rounded-xl p-4 flex justify-between items-center">
                <span className="text-base font-semibold">評価額の総合計</span>
                <span className="text-2xl font-bold">{results.total.toLocaleString()} 円</span>
              </div>

              {/* 計算過程の詳細 */}
              <details className="bg-white rounded-xl shadow-sm border border-gray-200">
                <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl select-none">
                  計算過程の詳細を表示
                </summary>
                <div className="px-5 pb-5 pt-2 text-sm text-gray-700 space-y-4">
                  {/* 配偶者情報 */}
                  <div>
                    <h4 className="font-semibold text-purple-700 mb-1">配偶者情報</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span>相続開始日時点の年齢</span><span className="text-right">{results.spouseAge}歳</span>
                      <span>平均余命（存続年数）</span><span className="text-right">{results.lifeExpectancy}年</span>
                      <span>複利現価率（年3%）</span><span className="text-right">{results.pvf}</span>
                    </div>
                  </div>

                  {/* 建物情報 */}
                  <div>
                    <h4 className="font-semibold text-green-700 mb-1">建物情報</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span>耐用年数（住宅用×1.5）</span><span className="text-right">{results.usefulLife}年</span>
                      <span>経過年数（6月以上切上げ）</span><span className="text-right">{results.elapsedYears}年</span>
                      <span>残存耐用年数</span><span className="text-right">{results.remainingUsefulLife}年</span>
                      <span>居住面積</span><span className="text-right">{results.residentialArea.toFixed(2)} m²</span>
                      <span>居住面積割合</span><span className="text-right">{(results.residentialRatio * 100).toFixed(2)}%</span>
                      {hasRental && (
                        <>
                          <span>賃貸面積割合</span><span className="text-right">{(results.rentalAreaRatio * 100).toFixed(2)}%</span>
                          <span>賃貸入居率</span><span className="text-right">{(results.occupancyRate * 100).toFixed(1)}%</span>
                        </>
                      )}
                      <span>被相続人の建物持分</span><span className="text-right">{form.buildingOwnershipRatio}%</span>
                    </div>
                  </div>

                  {/* 建物の計算式 */}
                  <div>
                    <h4 className="font-semibold text-green-700 mb-1">建物の計算</h4>
                    <div className="bg-green-50 rounded-lg p-3 space-y-2 text-xs font-mono">
                      <p>居住建物の時価 = {form.buildingValue.toLocaleString()} × {(results.residentialRatio * 100).toFixed(2)}% × {form.buildingOwnershipRatio}% = <strong>{results.residentialBuildingValue.toLocaleString()}円</strong></p>
                      {results.remainingUsefulLife <= 0 || results.lifeExpectancy >= results.remainingUsefulLife ? (
                        <p>配偶者居住権 = 居住建物の時価 = <strong>{results.spouseResidenceRight.toLocaleString()}円</strong>
                          <br/>（{results.remainingUsefulLife <= 0 ? '残存耐用年数≦0のため' : '存続年数≧残存耐用年数のため'}）</p>
                      ) : (
                        <p>配偶者居住権 = {results.residentialBuildingValue.toLocaleString()} - {results.residentialBuildingValue.toLocaleString()} × ({results.remainingUsefulLife}-{results.lifeExpectancy})/{results.remainingUsefulLife} × {results.pvf} = <strong>{results.spouseResidenceRight.toLocaleString()}円</strong></p>
                      )}
                      <p>居住建物の所有権 = {results.residentialBuildingValue.toLocaleString()} - {results.spouseResidenceRight.toLocaleString()} = <strong>{results.residentialBuildingOwnership.toLocaleString()}円</strong></p>
                      {hasRental && (
                        <p>賃貸建物（貸家） = {form.buildingValue.toLocaleString()} × {(results.rentalAreaRatio * 100).toFixed(2)}% × (1-30%×{(results.occupancyRate * 100).toFixed(1)}%) × {form.buildingOwnershipRatio}% = <strong>{results.rentalBuildingValue.toLocaleString()}円</strong></p>
                      )}
                    </div>
                  </div>

                  {/* 土地の計算式 */}
                  <div>
                    <h4 className="font-semibold text-yellow-700 mb-1">土地の計算</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                      <span>土地評価額（自用地）</span><span className="text-right">{results.landBaseValue.toLocaleString()}円</span>
                      <span>被相続人の土地持分</span><span className="text-right">{form.landOwnershipRatio}%</span>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 space-y-2 text-xs font-mono">
                      <p>居住部分の土地 = {results.landBaseValue.toLocaleString()} × {(results.residentialRatio * 100).toFixed(2)}% × {form.landOwnershipRatio}% = <strong>{results.residentialLandValue.toLocaleString()}円</strong></p>
                      <p>敷地利用権 = {results.residentialLandValue.toLocaleString()} × (1 - {results.pvf}) = <strong>{results.siteUseRight.toLocaleString()}円</strong></p>
                      <p>敷地の所有権 = {results.residentialLandValue.toLocaleString()} - {results.siteUseRight.toLocaleString()} = <strong>{results.residentialLandOwnership.toLocaleString()}円</strong></p>
                      {hasRental && (
                        <p>賃貸土地（貸家建付地） = {results.landBaseValue.toLocaleString()} × {(results.rentalAreaRatio * 100).toFixed(2)}% × (1-{form.leaseRatio}%×30%×{(results.occupancyRate * 100).toFixed(1)}%) × {form.landOwnershipRatio}% = <strong>{results.rentalLandValue.toLocaleString()}円</strong></p>
                      )}
                    </div>
                  </div>
                </div>
              </details>

              {/* 注意書き */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
                <p className="font-semibold">ご注意</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>本計算は相続税法第23条の2及び同施行令第5条の8に基づく概算です</li>
                  <li>耐用年数は減価償却資産の耐用年数等に関する省令（住宅用）×1.5で計算</li>
                  <li>平均余命は第23回完全生命表（令和2年）の値を使用</li>
                  <li>複利現価率は法定利率年3%で計算</li>
                  <li>実際の申告では税理士等の専門家にご相談ください</li>
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* フッター */}
      <footer className="mt-12 py-6 border-t border-gray-200 text-center text-xs text-gray-400">
        <p>配偶者居住権評価計算アプリ</p>
        <p className="mt-1">根拠法令: 相続税法第23条の2 / 国税庁タックスアンサーNo.4666</p>
      </footer>
    </main>
  );
}
