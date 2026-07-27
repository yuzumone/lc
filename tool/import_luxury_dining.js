#!/usr/bin/env node

const fs = require('fs');

const input = process.argv[2];
if (!input) {
  console.error('Usage: node tool/import_luxury_dining.js <downloaded-page.html>');
  process.exit(1);
}

const page = fs.readFileSync(input, 'utf8');
const match = page.match(
  /<script type="application\/json" id="wix-warmup-data">([\s\S]*?)<\/script>/,
);
if (!match) {
  throw new Error('wix-warmup-data was not found');
}

const warmup = JSON.parse(match[1]);
const records = Object.values(
  warmup.appsWarmupData.dataBinding.dataStore.recordsByCollectionId
    .benefitspage_contents,
);

function plainText(value) {
  if (typeof value === 'string') {
    return value
      .replace(/<br\s*\/?\s*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const parts = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (typeof node.textData?.text === 'string') {
      parts.push(node.textData.text);
    }
    for (const [key, child] of Object.entries(node)) {
      if (key !== 'textData') visit(child);
    }
  }
  visit(value);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function conciseBenefit(value) {
  const text = plainText(value);
  const match = text.match(
    /^(.{0,260}?(?:無料(?:で|にて)?ご提供いたします(?:（[^）]+）)?。|無料となります。|サービスいたします。|ご用意いたします。))/,
  );
  if (match) return match[1];
  if (text.length <= 220) return text;
  return `${text.slice(0, 219).trim()}…`;
}

function prefectureFor(address, area) {
  const match = address.match(
    /^(北海道|東京都|大阪府|京都府|.{2,3}県)/,
  );
  if (match) return match[1];
  if (/^(品川区|渋谷区)/.test(address)) return '東京都';
  if (/^京都市/.test(address)) return '京都府';
  if (area === '沖縄' || area === '那覇') return '沖縄県';
  throw new Error(`Could not determine prefecture: ${address}`);
}

function regionFor(prefecture) {
  if (prefecture === '北海道') return '北海道';
  if (['東京都', '神奈川県', '埼玉県'].includes(prefecture)) return '関東';
  if (prefecture === '愛知県') return '東海';
  if (['大阪府', '京都府'].includes(prefecture)) return '関西';
  if (prefecture === '福岡県') return '九州';
  if (prefecture === '沖縄県') return '沖縄';
  return 'その他';
}

function quote(value) {
  return JSON.stringify(value);
}

const venues = records
  .filter((record) => typeof record.dining_reference === 'object')
  .map((record) => {
    const reference = record.dining_reference;
    const area = plainText(record.area_category).split('/')[0].trim();
    const address = plainText(record.address);
    const prefecture = prefectureFor(address, area);
    return {
      active: true,
      name: plainText(record.title).replace(/^【\d+】/, '').trim(),
      area,
      prefecture,
      region: regionFor(prefecture),
      benefit: conciseBenefit(reference.benefitsContents),
      hours: plainText(reference.applicationtime) || '会員サイトをご確認ください',
      notice: plainText(reference.listnotices) || null,
    };
  });

const lines = [
  'title: ラグジュアリーダイニング',
  'category: dining',
  'last_checked: 2026-07-23',
  'source: https://www.member.myluxurycard.co.jp/serviceinfo/dining/luxurydining',
  'venues:',
];

for (const venue of venues) {
  lines.push(`  - active: ${venue.active}`);
  lines.push(`    name: ${quote(venue.name)}`);
  lines.push(`    area: ${quote(venue.area)}`);
  lines.push(`    prefecture: ${quote(venue.prefecture)}`);
  lines.push(`    region: ${quote(venue.region)}`);
  lines.push(`    benefit: ${quote(venue.benefit)}`);
  lines.push(`    hours: ${quote(venue.hours)}`);
  if (venue.notice) lines.push(`    notice: ${quote(venue.notice)}`);
}

fs.writeFileSync(
  'data/luxury_dining.yaml',
  `${lines.join('\n')}\n`,
);
console.log(`Imported ${venues.length} dining benefits.`);
