const templateHeadings = new Set([
  'Tên món',
  'Giới thiệu',
  'Nguyên liệu',
  'Các bước thực hiện',
  'Mẹo khi nấu',
  'Thời gian chuẩn bị và nấu',
  'Nguyên liệu chính',
  'Cách làm',
  'Mẹo tiết kiệm thời gian',
  'Mẹo muốn chia sẻ',
  'Chuẩn bị',
  'Cách thực hiện',
  'Lưu ý',
  'Câu chuyện của món',
  'Điểm đặc biệt',
  'Lời nhắn',
]);

/** Empty template labels are editor hints, not publishable content. */
export function filledDescription(value: string) {
  return value.split('\n').filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    const separator = trimmed.indexOf(':');
    if (separator < 0 || !templateHeadings.has(trimmed.slice(0, separator).trim())) return true;
    return trimmed.slice(separator + 1).trim().length > 0;
  }).join('\n').trim();
}

export function composeVideoBody(title: string, description: string) {
  return [title.trim(), filledDescription(description)].filter(Boolean).join('\n\n');
}
