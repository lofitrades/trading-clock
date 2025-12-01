const fs = require('fs');

const sources = ['mql5', 'forex-factory', 'fxstreet'];
const today = new Date('2025-12-01');

console.log('\n📊 ECONOMIC EVENTS DATA SOURCE COMPARISON\n');
console.log('='.repeat(80));

sources.forEach(src => {
  const data = JSON.parse(fs.readFileSync(`data/${src}-events-2025-12-01.json`));
  
  // Date analysis
  const dates = data.map(e => new Date(e.date._seconds * 1000));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const daysBack = Math.round((today - minDate) / (1000 * 60 * 60 * 24));
  const daysForward = Math.round((maxDate - today) / (1000 * 60 * 60 * 24));
  const totalSpan = Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24));
  
  // Field analysis
  const withCategory = data.filter(e => e.category && e.category !== 'null' && e.category !== null).length;
  const withStrength = data.filter(e => e.strength && e.strength !== 'null' && e.strength !== null).length;
  const withCurrency = data.filter(e => e.currency && e.currency !== 'null' && e.currency !== null).length;
  const withForecast = data.filter(e => e.forecast && e.forecast !== 'null' && e.forecast !== null).length;
  const withPrevious = data.filter(e => e.previous && e.previous !== 'null' && e.previous !== null).length;
  const withActual = data.filter(e => e.actual && e.actual !== 'null' && e.actual !== null).length;
  
  // Unique values
  const categories = new Set(data.map(e => e.category).filter(c => c && c !== 'null' && c !== null));
  const currencies = new Set(data.map(e => e.currency).filter(c => c && c !== 'null' && c !== null));
  const strengths = new Set(data.map(e => e.strength).filter(c => c && c !== 'null' && c !== null));
  
  console.log(`\n${src.toUpperCase().replace('-', ' ')}`);
  console.log('-'.repeat(80));
  console.log(`Total Events:        ${data.length.toLocaleString()}`);
  console.log(`Date Range:          ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
  console.log(`Days Back:           ${daysBack} days`);
  console.log(`Days Forward:        ${daysForward} days`);
  console.log(`Total Span:          ${totalSpan} days (~${Math.round(totalSpan/30)} months)`);
  console.log(`\nField Coverage:`);
  console.log(`  Category:          ${withCategory.toLocaleString()} (${Math.round(withCategory/data.length*100)}%) - ${categories.size} unique`);
  console.log(`  Strength/Impact:   ${withStrength.toLocaleString()} (${Math.round(withStrength/data.length*100)}%) - ${strengths.size} unique`);
  console.log(`  Currency:          ${withCurrency.toLocaleString()} (${Math.round(withCurrency/data.length*100)}%) - ${currencies.size} unique`);
  console.log(`  Forecast:          ${withForecast.toLocaleString()} (${Math.round(withForecast/data.length*100)}%)`);
  console.log(`  Previous:          ${withPrevious.toLocaleString()} (${Math.round(withPrevious/data.length*100)}%)`);
  console.log(`  Actual:            ${withActual.toLocaleString()} (${Math.round(withActual/data.length*100)}%)`);
  
  if (categories.size > 0 && categories.size < 20) {
    console.log(`\nCategories: ${Array.from(categories).sort().join(', ')}`);
  }
  
  if (strengths.size > 0) {
    console.log(`Strength Values: ${Array.from(strengths).sort().join(', ')}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ Analysis complete!\n');
