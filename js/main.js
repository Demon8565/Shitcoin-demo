const TOKEN_MINT = "5kr3KPg6Nhx2cBvunCuEgnUnJzRRz7C56aKNaFMmpump";

function copyCA(){
  const text = document.getElementById('ca-text').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-btn');
    const original = btn.textContent;
    btn.textContent = 'Copied';
    setTimeout(() => { btn.textContent = original; }, 1500);
  });
}

function formatUsd(n){
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}

function formatPrice(n){
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (n < 0.01) return '$' + n.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
  return '$' + n.toFixed(4);
}

async function loadLiveData(){
  try{
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_MINT}`);
    if (!res.ok) throw new Error('DexScreener request failed: ' + res.status);
    const data = await res.json();
    const pairs = data.pairs || [];
    if (!pairs.length) throw new Error('No pairs returned');

    // Use the pair with the highest liquidity as the primary source
    const pair = pairs.reduce((best, p) =>
      (p.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? p : best
    , pairs[0]);

    const price = parseFloat(pair.priceUsd);
    const change24h = pair.priceChange?.h24;
    const mcap = pair.fdv || pair.marketCap;
    const liquidity = pair.liquidity?.usd;
    const volume24h = pair.volume?.h24;

    setTick('tick-price', formatPrice(price));
    setTick('tick-mcap', formatUsd(mcap));
    setTick('tick-liq', formatUsd(liquidity));
    setTick('tick-vol', formatUsd(volume24h));

    const changeEl = document.getElementById('tick-change');
    if (changeEl && change24h !== undefined && change24h !== null){
      const sign = change24h >= 0 ? '+' : '';
      changeEl.textContent = `${sign}${change24h.toFixed(2)}%`;
      changeEl.classList.remove('up', 'down');
      changeEl.classList.add(change24h >= 0 ? 'up' : 'down');
    }
  } catch (err){
    console.error('Live data unavailable:', err);
    // Leave placeholder dashes in place rather than showing stale numbers
  }
}

function setTick(id, value){
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

document.addEventListener('DOMContentLoaded', () => {
  loadLiveData();
  setInterval(loadLiveData, 30000); // refresh every 30s
});
