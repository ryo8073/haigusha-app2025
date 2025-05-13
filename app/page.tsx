// app/page.tsx - 再構成された配偶者居住権計算アプリ（結果表示強化）
'use client';

import { useState, useEffect } from 'react';
import { calculateResults, formatNumberWithCommas, parseFormattedNumber, getUsefulLife, getLifeExpectancy } from '@/lib/utils';
import { LOGGING_CONFIG } from '@/config/logging';

export default function Home() {
  // Add environment variable verification
  useEffect(() => {
    console.log('Environment Variables Check:');
    console.log('Logging Enabled:', LOGGING_CONFIG.ENABLED);
    console.log('GAS URL:', LOGGING_CONFIG.GOOGLE_APPS_SCRIPT_URL);
  }, []);

  const [form, setForm] = useState({
    inheritanceDate: '',
    divisionDate: '',
    constructionDate: '',
    structure: '',
    buildingValue: 0,
    buildingArea: 0,
    rentalArea: 0,
    rentalRatio: 0, // 賃貸入居率
    landArea: 0,
    roadPrice: 0,
    landCorrection: 100, // 初期値を100に設定
    leaseRatio: 90, // 借地権割合の初期値を90に設定
    spouseBirthday: '',
    spouseGender: 'female',
    legalRate: 3,
    buildingOwnershipRatio: 100, // 新規追加：建物の持分割合
    landOwnershipRatio: 100,     // 新規追加：土地の持分割合
  });

  const [displayValues, setDisplayValues] = useState({
    buildingValue: '',
    buildingArea: '',
    rentalArea: '',
    landArea: '',
    roadPrice: '',
  });

  const [results, setResults] = useState<any>(null);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    
    // パーセンテージフィールドの処理
    if ([
      'rentalRatio',
      'landCorrection',
      'leaseRatio',
      'buildingOwnershipRatio',
      'landOwnershipRatio'
    ].includes(name)) {
      // パーセンテージは直接数値として処理
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // 金額・面積フィールドの処理
    else if ([
      'buildingValue',
      'buildingArea',
      'rentalArea',
      'landArea',
      'roadPrice'
    ].includes(name)) {
      // 表示用の値を更新
      setDisplayValues(prev => ({
        ...prev,
        [name]: value
      }));
      
      // フォームの実際の値を更新
      setForm(prev => ({
        ...prev,
        [name]: parseFormattedNumber(value)
      }));
    } else {
      // 非数値フィールドの処理
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCalculate = async () => {
    const result = calculateResults(form);
    setResults(result);

    if (LOGGING_CONFIG.ENABLED && LOGGING_CONFIG.GOOGLE_APPS_SCRIPT_URL) {
      // Prepare data for logging
      const logData = {
        ...form,
        results: result
      };

      console.log('Attempting to log data:', logData);
      console.log('Using URL:', LOGGING_CONFIG.GOOGLE_APPS_SCRIPT_URL);

      try {
        // Make the POST request with no-cors mode
        const response = await fetch(LOGGING_CONFIG.GOOGLE_APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(logData),
        });

        // Since we're using no-cors mode, we won't get a proper response
        // but the request should still go through
        console.log('Request sent successfully');

      } catch (error) {
        console.error('Error logging calculation data:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    } else {
      console.log('Logging is disabled or URL is not configured');
      console.log('ENABLED:', LOGGING_CONFIG.ENABLED);
      console.log('URL:', LOGGING_CONFIG.GOOGLE_APPS_SCRIPT_URL);
    }
  };

  // 追加: 中間計算値
  const usefulLife = getUsefulLife(form.structure);
  const residentialArea = form.buildingArea && form.rentalArea ? form.buildingArea - form.rentalArea : '';
  const landValue = form.landArea && form.roadPrice && form.landCorrection ? Math.round(form.landArea * form.roadPrice * (form.landCorrection / 100)) : '';
  // 年齢・平均余命
  const spouseAge = (form.spouseBirthday && form.divisionDate) ? (() => {
    const birth = new Date(form.spouseBirthday);
    const ref = new Date(form.divisionDate);
    let age = ref.getFullYear() - birth.getFullYear();
    const m = ref.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
    return Math.floor(age);
  })() : '';
  const spouseLife = (spouseAge !== '' && form.spouseGender) ? getLifeExpectancy(Number(spouseAge), form.spouseGender) : '';

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-2xl md:max-w-3xl mx-auto space-y-10 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <h1 className="text-2xl font-bold text-gray-800">配偶者居住権評価計算アプリ</h1>

      <div className="space-y-6">
        {/* 基本情報グループ */}
        <div className="bg-blue-50 p-6 rounded-lg shadow border border-blue-100">
          <h2 className="text-lg font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-4">基本情報</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">相続開始日（被相続人の死亡日）</label>
              <input type="date" name="inheritanceDate" onChange={handleChange} className="bg-white border-2 border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">遺産分割日（評価時点）</label>
              <input type="date" name="divisionDate" onChange={handleChange} className="bg-white border-2 border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none" />
            </div>
          </div>
        </div>

        {/* 建物情報グループ */}
        <div className="bg-green-50 p-6 rounded-lg shadow border border-green-100">
          <h2 className="text-lg font-semibold text-green-800 border-b border-green-200 pb-2 mb-4">建物情報</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">建物構造</label>
              <select name="structure" onChange={handleChange} className="bg-white border-2 border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none">
                <option value="">建物構造を選択</option>
                <option value="鉄骨鉄筋コンクリート造又は鉄筋コンクリート造">鉄骨鉄筋コンクリート造又は鉄筋コンクリート造</option>
                <option value="鉄筋コンクリート造">鉄筋コンクリート造</option>
                <option value="鉄骨鉄筋コンクリート造">鉄骨鉄筋コンクリート造</option>
                <option value="れんが作り、石造またはブロック造">れんが作り、石造またはブロック造</option>
                <option value="コンクリートブロック造">コンクリートブロック造</option>
                <option value="金属造（骨格材の肉厚4mm超)">金属造（骨格材の肉厚4mm超)</option>
                <option value="鉄骨造（重量鉄骨）">鉄骨造（重量鉄骨）</option>
                <option value="金属造（骨格材の肉厚3mm超～4mm以下)">金属造（骨格材の肉厚3mm超～4mm以下)</option>
                <option value="鉄骨造">鉄骨造</option>
                <option value="金属造（骨格材の肉厚3mm以下)">金属造（骨格材の肉厚3mm以下)</option>
                <option value="鉄骨造（軽量鉄骨）">鉄骨造（軽量鉄骨）</option>
                <option value="木造又は合成樹脂造">木造又は合成樹脂造</option>
                <option value="木造">木造</option>
                <option value="木造（軸組工法）">木造（軸組工法）</option>
                <option value="木造（枠組壁工法）">木造（枠組壁工法）</option>
                <option value="木造（プレハブ）">木造（プレハブ）</option>
                <option value="木造（ツーバイフォー）">木造（ツーバイフォー）</option>
                <option value="木造（在来工法）">木造（在来工法）</option>
                <option value="木骨モルタル造">木骨モルタル造</option>
              </select>
              {form.structure && (
                <div className="text-sm text-green-700 mt-1">耐用年数: {usefulLife ? `${usefulLife}年` : '―'}</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">新築年月日</label>
              <input type="date" name="constructionDate" onChange={handleChange} className="bg-white border-2 border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">建物固定資産税評価額 (円)</label>
              <input
                type="text"
                name="buildingValue"
                value={formatNumberWithCommas(displayValues.buildingValue)}
                onChange={handleChange}
                className="bg-white border-2 border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">建物延床面積 (㎡)</label>
              <input
                type="text"
                name="buildingArea"
                value={displayValues.buildingArea}
                onChange={handleChange}
                placeholder="0.00"
                pattern="^[0-9,]*\.?[0-9]{0,2}$"
                className="bg-white border-2 border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none"
              />
              {(form.buildingArea && form.rentalArea !== undefined && form.rentalArea !== null) && (
                <div className="text-sm text-green-700 mt-1">居住用面積: {residentialArea !== '' ? `${residentialArea}㎡` : '―'}</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">賃貸部分面積 (㎡)</label>
              <input
                type="text"
                name="rentalArea"
                value={displayValues.rentalArea}
                onChange={handleChange}
                placeholder="0.00"
                pattern="^[0-9,]*\.?[0-9]{0,2}$"
                className="bg-white border-2 border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">賃貸入居率 (%) <span className="text-sm text-gray-500">※相続開始日時点</span></label>
              <input
                type="number"
                name="rentalRatio"
                value={form.rentalRatio}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="bg-white border-2 border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">被相続人の建物持分割合 (%)</label>
              <input
                type="number"
                name="buildingOwnershipRatio"
                value={form.buildingOwnershipRatio}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="bg-white border-2 border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none"
              />
            </div>
          </div>
        </div>

        {/* 土地情報グループ */}
        <div className="bg-yellow-50 p-6 rounded-lg shadow border border-yellow-100">
          <h2 className="text-lg font-semibold text-yellow-800 border-b border-yellow-200 pb-2 mb-4">土地情報</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">土地面積 (㎡)</label>
              <input
                type="text"
                name="landArea"
                value={displayValues.landArea}
                onChange={handleChange}
                placeholder="0.00"
                pattern="^[0-9,]*\.?[0-9]{0,2}$"
                className="bg-white border-2 border-yellow-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">路線価 (円/㎡)</label>
              <input
                type="text"
                name="roadPrice"
                value={formatNumberWithCommas(displayValues.roadPrice)}
                onChange={handleChange}
                className="bg-white border-2 border-yellow-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">借地権割合 (%)</label>
              <div className="grid grid-cols-7 gap-3">
                {[
                  { label: 'A90%', value: 90 },
                  { label: 'B80%', value: 80 },
                  { label: 'C70%', value: 70 },
                  { label: 'D60%', value: 60 },
                  { label: 'E50%', value: 50 },
                  { label: 'F40%', value: 40 },
                  { label: 'G30%', value: 30 },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-label={`借地権割合: ${item.label}`}
                    onClick={() => handleChange({ target: { name: 'leaseRatio', value: item.value } })}
                    className={`
                      relative px-4 py-3 rounded-xl transition-all duration-200 text-base font-semibold border-2
                      ${form.leaseRatio == item.value
                        ? 'bg-yellow-100 border-yellow-500 shadow-lg scale-105 text-yellow-800'
                        : 'bg-white border-yellow-200 hover:bg-yellow-50 hover:border-yellow-400 text-gray-700'}
                      focus:outline-none focus:ring-4 focus:ring-yellow-200
                    `}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500">※ 選択された割合: {form.leaseRatio}%</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">土地補正率 (%)</label>
              <input
                type="number"
                name="landCorrection"
                value={form.landCorrection}
                onChange={handleChange}
                min="0"
                max="120"
                step="0.01"
                className="bg-white border-2 border-yellow-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none"
              />
              {(form.landArea && form.roadPrice && form.landCorrection) && (
                <div className="text-sm text-yellow-700 mt-1">路線価評価額: {landValue !== '' ? `${formatNumberWithCommas(landValue)}円` : '―'}</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">被相続人の土地持分割合 (%)</label>
              <input
                type="number"
                name="landOwnershipRatio"
                value={form.landOwnershipRatio}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className="bg-white border-2 border-yellow-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none"
              />
            </div>
          </div>
        </div>

        {/* 配偶者情報グループ */}
        <div className="bg-purple-50 p-6 rounded-lg shadow border border-purple-100">
          <h2 className="text-lg font-semibold text-purple-800 border-b border-purple-200 pb-2 mb-4">配偶者情報</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">生年月日</label>
              <input type="date" name="spouseBirthday" onChange={handleChange} className="bg-white border-2 border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 shadow-sm rounded-xl px-4 py-3 text-base placeholder-gray-400 transition-all w-full outline-none" />
              {form.spouseBirthday && form.divisionDate && (
                <div className="text-sm text-purple-700 mt-1">年齢: {spouseAge !== '' ? `${spouseAge}歳` : '―'}</div>
              )}
              {spouseAge !== '' && form.spouseGender && (
                <div className="text-sm text-purple-700 mt-1">平均余命: {spouseLife !== '' ? `${spouseLife}年` : '―'}</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">性別</label>
              <div className="grid grid-cols-2 gap-4 max-w-xs">
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
                      relative px-6 py-4 rounded-xl transition-all duration-200 text-base font-semibold
                      border-2
                      ${form.spouseGender === option.value
                        ? 'bg-purple-100 border-purple-500 shadow-lg scale-105 text-purple-800'
                        : 'bg-white border-purple-200 hover:bg-purple-50 hover:border-purple-400 text-gray-700'}
                      focus:outline-none focus:ring-4 focus:ring-purple-200
                    `}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <button 
          onClick={handleCalculate} 
          className="
            bg-blue-600 hover:bg-blue-700 text-white 
            px-12 py-4 rounded-xl shadow-lg 
            transition duration-200 ease-in-out 
            transform hover:-translate-y-1 hover:shadow-xl
            text-xl font-bold
            flex items-center justify-center mx-auto
            min-w-[300px]
          "
        >
          <span className="mr-2">計算する</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 7h6m0 10h-6m-5-3h14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </button>
        <p className="mt-2 text-sm text-gray-500">計算ボタンを押すと、下記に計算結果が表示されます</p>
      </div>

      {/* --- 計算結果エリア --- */}
      <section aria-labelledby="result-title" className="mt-10">
        <h2 id="result-title" className="text-xl font-bold mb-4">計算結果</h2>
        {!results ? (
          <div className="bg-gray-200/60 border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center min-h-[180px] text-gray-500 text-lg font-medium">
            <span className="mb-2">ここに計算結果が表示されます</span>
            <span className="text-sm text-gray-400">必要事項を入力し「計算する」を押してください</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-6">
            {/* 相続税評価額合計 */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 flex flex-col items-start min-w-0">
              <h3 className="text-base font-semibold text-blue-700 mb-2 whitespace-nowrap">相続税評価額としての評価額合計</h3>
              <p className="text-2xl font-bold text-blue-600 break-words">{results.remainingAssetsTotal.toLocaleString()} 円</p>
              <div className="mt-3 w-full text-sm text-gray-700 space-y-1">
                <div className="flex flex-row justify-between w-full"><span>相続税評価部分の建物の価額：</span><span>{(results.settingBuilding || 0).toLocaleString()} 円</span></div>
                <div className="flex flex-row justify-between w-full"><span>相続税評価部分の土地の価額：</span><span>{(results.landOwner || 0).toLocaleString()} 円</span></div>
              </div>
            </div>
            {/* 配偶者居住権控除額 */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500 flex flex-col items-start min-w-0">
              <h3 className="text-base font-semibold text-purple-700 mb-2 whitespace-nowrap">配偶者居住権として引かれる価額</h3>
              <p className="text-2xl font-bold text-purple-600 break-words">{results.spouseRightTotal.toLocaleString()} 円</p>
              <div className="mt-3 w-full text-sm text-gray-700 space-y-1">
                <div className="flex flex-row justify-between w-full"><span>配偶者居住権の建物部分の価額：</span><span>{(results.buildingRight || 0).toLocaleString()} 円</span></div>
                <div className="flex flex-row justify-between w-full"><span>配偶者居住権の土地部分の価額：</span><span>{(results.landUse || 0).toLocaleString()} 円</span></div>
              </div>
            </div>
            {/* 詳細情報 */}
            <div className="bg-white p-6 rounded-xl shadow col-span-1 md:col-span-2 mt-4">
              <h3 className="font-semibold text-lg mb-2">詳細情報</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700 text-sm">
                <li>配偶者年齢：{results.spouseAge || 0} 歳</li>
                <li>平均余命：{results.life || 0} 年</li>
                <li>複利原価率：{results.pvf || 0}</li>
                <li>経過年数：{results.elapsedYears || 0} 年</li>
                <li>耐用年数：{results.usefulLife || 0} 年</li>
                <li>居住面積：{(results.residentialArea || 0).toLocaleString()} ㎡</li>
                <li>居住面積割合：{((results.residentialRatio || 0) * 100).toFixed(2)}%</li>
                <li>賃貸面積割合：{((results.rentalAreaRatio || 0) * 100).toFixed(2)}%</li>
                <li>賃貸入居率：{((results.rentalRatio || 0) * 100).toFixed(2)}%</li>
                <li>建物評価額：{(results.buildingTaxValue || 0).toLocaleString()} 円</li>
                <li>被相続人の建物持分割合：{form.buildingOwnershipRatio}%</li>
                <li>土地評価額：{(results.landValue || 0).toLocaleString()} 円</li>
                <li>被相続人の土地持分割合：{form.landOwnershipRatio}%</li>
                {results.landReduction > 0 && (
                  <li>土地評価減額：{(results.landReduction || 0).toLocaleString()} 円</li>
                )}
              </ul>
              <div className="text-right font-semibold text-lg mt-4">総合計：{(results.total || 0).toLocaleString()} 円</div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
