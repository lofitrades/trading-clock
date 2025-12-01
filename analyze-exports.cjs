const fs = require('fs');

const files = ['forex-factory', 'mql5', 'fxstreet'];
const today = new Date('2025-12-01');

console.log('\n📊 ANALYZING COMBINED SYNC DATA (Initial Sync + Sync Calendar)\n');
console.log('Expected: 2 years back + 30 days forward\n');

files.forEach(src => {
  try {
    const data = JSON.parse(fs.readFileSync(`data/${src}-events-2025-12-01.json`));
    const dates = data.map(e => new Date(e.date._seconds * 1000));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const daysBack = Math.floor((today - minDate) / (1000 * 60 * 60 * 24));
    const daysForward = Math.floor((maxDate - today) / (1000 * 60 * 60 * 24));
    const span = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24));
    const yearsBack = (daysBack / 365).toFixed(1);
    
    console.log('='.repeat(60));
    console.log(src.toUpperCase());
    console.log('='.repeat(60));
    console.log(`Events: ${data.length}`);
    console.log(`From: ${minDate.toISOString().split('T')[0]}`);
    console.log(`To: ${maxDate.toISOString().split('T')[0]}`);
    console.log(`Days Back: ${daysBack} (~${yearsBack} years)`);
    console.log(`Days Forward: ${daysForward}`);
    console.log(`Total Span: ${span} days (~${(span / 365).toFixed(1)} years)`);
    console.log();
  } catch (e) {
    console.log(`\n${src}: File not found or error - ${e.message}\n`);
  }
});
