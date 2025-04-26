// app/page.tsx - 再構成された配偶者居住権計算アプリ（結果表示強化）
'use client';

import { useState } from 'react';
import { calculateResults, formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils';
import { LOGGING_CONFIG } from '@/config/logging';

export default function Home() {
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
        const response = await fetch(LOGGING_CONFIG.GOOGLE_APPS_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logData),
        });

        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);

        if (!response.ok) {
          console.error('Failed to log calculation data:', response.statusText);
        }
      } catch (error) {
        console.error('Error logging calculation data:', error);
      }
    } else {
      console.log('Logging is disabled or URL is not configured');
      console.log('ENABLED:', LOGGING_CONFIG.ENABLED);
      console.log('URL:', LOGGING_CONFIG.GOOGLE_APPS_SCRIPT_URL);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto space-y-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800">配偶者居住権評価計算アプリ</h1>

      <div className="space-y-6">
        {/* 基本情報グループ */}
        <div className="bg-blue-50 p-6 rounded-lg shadow border border-blue-100">
          <h2 className="text-lg font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-4">基本情報</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">相続開始日（被相続人の死亡日）</label>
              <input type="date" name="inheritanceDate" onChange={handleChange} className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-200 focus:border-blue-300" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">遺産分割日（評価時点）</label>
              <input type="date" name="divisionDate" onChange={handleChange} className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-200 focus:border-blue-300" />
            </div>
          </div>
        </div>

        {/* 建物情報グループ */}
        <div className="bg-green-50 p-6 rounded-lg shadow border border-green-100">
          <h2 className="text-lg font-semibold text-green-800 border-b border-green-200 pb-2 mb-4">建物情報</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">建物構造</label>
              <select name="structure" onChange={handleChange} className="border p-2 rounded w-full focus:ring-2 focus:ring-green-200 focus:border-green-300">
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
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">新築年月日</label>
              <input type="date" name="constructionDate" onChange={handleChange} className="border p-2 rounded w-full focus:ring-2 focus:ring-green-200 focus:border-green-300" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">建物固定資産税評価額 (円)</label>
              <input
                type="text"
                name="buildingValue"
                value={formatNumberWithCommas(displayValues.buildingValue)}
                onChange={handleChange}
                className="border p-2 rounded w-full focus:ring-2 focus:ring-green-200 focus:border-green-300"
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
                className="border p-2 rounded w-full focus:ring-2 focus:ring-green-200 focus:border-green-300"
              />
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
                className="border p-2 rounded w-full focus:ring-2 focus:ring-green-200 focus:border-green-300"
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
                className="border p-2 rounded w-full focus:ring-2 focus:ring-green-200 focus:border-green-300"
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
                className="border p-2 rounded w-full focus:ring-2 focus:ring-green-200 focus:border-green-300"
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
                className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-200 focus:border-yellow-300"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">路線価 (円/㎡)</label>
              <input
                type="text"
                name="roadPrice"
                value={formatNumberWithCommas(displayValues.roadPrice)}
                onChange={handleChange}
                className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-200 focus:border-yellow-300"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">借地権割合 (%)</label>
              <div className="grid grid-cols-7 gap-3">
                {[90, 80, 70, 60, 50, 40, 30].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => handleChange({ target: { name: 'leaseRatio', value: ratio } })}
                    className={`
                      relative p-3 rounded-lg transition-all duration-200
                      ${form.leaseRatio === ratio
                        ? 'bg-yellow-500 text-white shadow-lg transform scale-105'
                        : 'bg-white hover:bg-yellow-50 border border-yellow-200'}
                      flex flex-col items-center justify-center
                      focus:outline-none focus:ring-2 focus:ring-yellow-400
                    `}
                  >
                    <span className="text-lg font-semibold">{ratio}</span>
                    <span className="text-xs">%</span>
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
                className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-200 focus:border-yellow-300"
              />
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
                className="border p-2 rounded w-full focus:ring-2 focus:ring-yellow-200 focus:border-yellow-300"
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
              <input type="date" name="spouseBirthday" onChange={handleChange} className="border p-2 rounded w-full focus:ring-2 focus:ring-purple-200 focus:border-purple-300" />
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
                    onClick={() => handleChange({ target: { name: 'spouseGender', value: option.value } })}
                    className={`
                      relative p-4 rounded-lg transition-all duration-200
                      ${form.spouseGender === option.value
                        ? 'bg-purple-500 text-white shadow-lg transform scale-105'
                        : 'bg-white hover:bg-purple-50 border border-purple-200'}
                      flex flex-col items-center justify-center
                      focus:outline-none focus:ring-2 focus:ring-purple-400
                    `}
                  >
                    <span className="text-lg font-semibold">{option.label}</span>
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

      {results && (
        <div className="bg-gray-100 p-6 mt-6 rounded shadow space-y-4">
          <h2 className="text-xl font-bold mb-4">計算結果</h2>

          {/* 新規追加：主要評価額の表示 */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">相続税評価額としての評価額合計</h3>
              <p className="text-2xl font-bold text-blue-600">
                {results.remainingAssetsTotal.toLocaleString()} 円
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">配偶者居住権として引かれる価額</h3>
              <p className="text-2xl font-bold text-purple-600">
                {results.spouseRightTotal.toLocaleString()} 円
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold text-lg mb-2">配偶者居住権を控除した残余資産の評価</h3>
              <p>設定建物：{(results.settingBuilding || 0).toLocaleString()} 円</p>
              <p>設定敷地（所有権）：{(results.landOwner || 0).toLocaleString()} 円</p>
              <p className="font-semibold mt-2">残余資産合計：{(results.remainingAssetsTotal || 0).toLocaleString()} 円</p>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold text-lg mb-2">配偶者居住権に係る建物および敷地利用権の評価</h3>
              <p>建物：{(results.buildingRight || 0).toLocaleString()} 円</p>
              <p>敷地利用権：{(results.landUse || 0).toLocaleString()} 円</p>
              <p className="font-semibold mt-2">配偶者居住権合計：{(results.spouseRightTotal || 0).toLocaleString()} 円</p>
            </div>

            <div className="bg-white p-4 rounded shadow col-span-2">
              <h3 className="font-semibold text-lg mb-2">中間計算情報</h3>
              <p>配偶者年齢：{results.spouseAge || 0} 歳（満年齢）</p>
              <p>平均余命：{results.life || 0} 年</p>
              <p>複利原価率：{results.pvf || 0}</p>
              <p>経過年数：{results.elapsedYears || 0} 年</p>
              <p>耐用年数：{results.usefulLife || 0} 年</p>
              <p>居住面積：{(results.residentialArea || 0).toLocaleString()} ㎡</p>
              <p>居住面積割合：{((results.residentialRatio || 0) * 100).toFixed(2)}%</p>
              <p>賃貸面積割合：{((results.rentalAreaRatio || 0) * 100).toFixed(2)}%</p>
              <p>賃貸入居率：{((results.rentalRatio || 0) * 100).toFixed(2)}%</p>
              <p>建物評価額：{(results.buildingTaxValue || 0).toLocaleString()} 円</p>
              <p>被相続人の建物持分割合：{form.buildingOwnershipRatio}%</p>
              <p>土地評価額：{(results.landValue || 0).toLocaleString()} 円</p>
              <p>被相続人の土地持分割合：{form.landOwnershipRatio}%</p>
              {results.landReduction > 0 && (
                <p>土地評価減額：{(results.landReduction || 0).toLocaleString()} 円</p>
              )}
            </div>
          </div>

          <div className="text-right font-semibold text-lg">総合計：{(results.total || 0).toLocaleString()} 円</div>
        </div>
      )}
    </main>
  );
}
