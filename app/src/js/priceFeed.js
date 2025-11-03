// getPriceCoinGecko.js
export async function getPriceCoinGecko(id = "bitcoin", vs = "usd") {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=${encodeURIComponent(vs)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko error ${res.status}`);
  const json = await res.json();
  return json[id]?.[vs];
}