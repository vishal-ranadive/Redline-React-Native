export function printTable(title: string, data: any) {
  console.log(`\n===== ${title} =====`);

  const rows: { key: string; value: any; type: string }[] = [];

  function recurse(obj: any, prefix = '') {
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        rows.push({ key: prefix || 'root', value: '[]', type: 'array' });
      } else {
        obj.forEach((item, index) => recurse(item, `${prefix}[${index}]`));
      }
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object') {
          recurse(value, newPrefix);
        } else {
          rows.push({
            key: newPrefix,
            value:
              typeof value === 'string'
                ? value
                : JSON.stringify(value, null, 0),
            type: typeof value,
          });
        }
      });
    } else {
      rows.push({
        key: prefix || 'root',
        value: obj,
        type: typeof obj,
      });
    }
  }

  recurse(data);

  // Manually print the rows for React Native console
  console.log('Key'.padEnd(35) + '│ ' + 'Type'.padEnd(10) + '│ Value');
  console.log('─'.repeat(80));
  rows.forEach((r) => {
    const key = r.key.padEnd(35);
    const type = r.type.padEnd(10);
    const value =
      typeof r.value === 'string' ? r.value : JSON.stringify(r.value);
    console.log(`${key}│ ${type}│ ${value}`);
  });

  console.log('='.repeat(80));
  console.log(`original -${title} ` ,data )
  console.log(`===== End of ${title} =====\n`);
}
