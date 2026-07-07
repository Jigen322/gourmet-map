'use client'

// 選択肢をチップ風のチェックボックスとして表示する共通パーツ
// value: 選択中の配列, onChange: 新しい配列を渡す関数
export default function CheckboxGroup({ options, value, onChange, name }) {
  function toggle(option) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  return (
    <div className="checkbox-group">
      {options.map((option) => {
        const checked = value.includes(option)
        return (
          <label key={option} className={`checkbox-chip ${checked ? 'checked' : ''}`}>
            <input
              type="checkbox"
              name={name}
              checked={checked}
              onChange={() => toggle(option)}
            />
            {option}
          </label>
        )
      })}
    </div>
  )
}
