import React, { useState } from 'react';

interface UploadResult {
  inserted: number;
  skipped: number;
  errors: { index: number; error: string }[];
}

function parseCSV(text: string) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = values[i];
    });
    return obj;
  });
}

const MarketDataUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [benchmark, setBenchmark] = useState<any>(null);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchForm, setBenchForm] = useState({
    region: '',
    projectType: '',
    costPerSF: '',
    effectiveDate: '',
  });
  const [winProb, setWinProb] = useState<number | null>(null);
  const [winProbError, setWinProbError] = useState<string | null>(null);
  const [winProbLoading, setWinProbLoading] = useState(false);
  const [winForm, setWinForm] = useState({
    costPerSF: '',
    riskScore: '',
    marketPercentile: '',
    projectType: '',
    region: '',
  });
  const [packages, setPackages] = useState<any[] | null>(null);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [pkgForm, setPkgForm] = useState({
    baseCost: '',
    marketAverage: '',
    marketPercentile: '',
    winProbability: '',
    minMargin: '8',
    maxMargin: '20',
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const text = await f.text();
    let parsed: any[] = [];
    try {
      if (f.name.endsWith('.csv')) {
        parsed = parseCSV(text);
      } else if (f.name.endsWith('.json')) {
        parsed = JSON.parse(text);
      } else {
        setError('Unsupported file type. Please upload CSV or JSON.');
        return;
      }
      setData(parsed);
    } catch (err) {
      setError('Failed to parse file.');
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/market-data/cost-per-sf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Upload failed');
      setResult({
        inserted: json.inserted,
        skipped: json.skipped,
        errors: json.errors,
      });
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBenchInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setBenchForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    setBenchmark(null);
    setBenchmarkError(null);
    setBenchmarkLoading(true);
    try {
      const res = await fetch('/api/market-data/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: benchForm.region,
          projectType: benchForm.projectType || undefined,
          costPerSF: Number(benchForm.costPerSF),
          effectiveDate: benchForm.effectiveDate || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Benchmark failed');
      setBenchmark(json.result);
    } catch (err: any) {
      setBenchmarkError(err.message || 'Benchmark failed');
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const handleWinInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setWinForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleWinProb = async (e: React.FormEvent) => {
    e.preventDefault();
    setWinProb(null);
    setWinProbError(null);
    setWinProbLoading(true);
    try {
      const res = await fetch('/api/proposals/win-probability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costPerSF: Number(winForm.costPerSF),
          riskScore: Number(winForm.riskScore),
          marketPercentile: Number(winForm.marketPercentile),
          projectType: winForm.projectType || undefined,
          region: winForm.region || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success)
        throw new Error(json.error || 'Win probability calculation failed');
      setWinProb(json.winProbability);
    } catch (err: any) {
      setWinProbError(err.message || 'Win probability calculation failed');
    } finally {
      setWinProbLoading(false);
    }
  };

  const handlePkgInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setPkgForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handlePackages = async (e: React.FormEvent) => {
    e.preventDefault();
    setPackages(null);
    setPackagesError(null);
    setPackagesLoading(true);
    try {
      const res = await fetch('/api/proposals/recommend-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseCost: Number(pkgForm.baseCost),
          marketAverage: Number(pkgForm.marketAverage),
          marketPercentile: Number(pkgForm.marketPercentile),
          winProbability: Number(pkgForm.winProbability),
          minMargin: Number(pkgForm.minMargin),
          maxMargin: Number(pkgForm.maxMargin),
        }),
      });
      const json = await res.json();
      if (!json.success)
        throw new Error(json.error || 'Package recommendation failed');
      setPackages(json.packages);
    } catch (err: any) {
      setPackagesError(err.message || 'Package recommendation failed');
    } finally {
      setPackagesLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-2">Upload Cost/SF Market Data</h2>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
        <p className="mb-1">
          Upload historical cost per square foot (Cost/SF) data for market
          benchmarking. You can upload a CSV or JSON file.
        </p>
        <p className="mb-1 font-semibold">Expected CSV headers:</p>
        <pre className="bg-blue-100 rounded p-2 text-xs mb-1">
          region,value,effectiveDate,unit,source,notes
        </pre>
        <p className="mb-1">
          • <b>region</b>: e.g., Northeast, Midwest, South, West
          <br />• <b>value</b>: Cost per SF (number)
          <br />• <b>effectiveDate</b>: Date in YYYY-MM-DD format
          <br />• <b>unit</b>: (optional, default: SF)
          <br />• <b>source</b>: (optional, e.g., RSMeans 2024)
          <br />• <b>notes</b>: (optional, e.g., project type)
        </p>
        <a
          href="data:text/csv,region,value,effectiveDate,unit,source,notes%0ANortheast,45.0,2024-01-01,SF,RSMeans 2024,Commercial glazing%0AMidwest,42.5,2024-01-01,SF,RSMeans 2024,Commercial glazing"
          download="cost_sf_template.csv"
          className="text-blue-700 underline"
        >
          Download CSV template
        </a>
      </div>
      <input
        type="file"
        accept=".csv,.json"
        onChange={handleFileChange}
        className="mb-2"
      />
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {data.length > 0 && (
        <div className="mb-2">
          <div className="font-semibold">Preview ({data.length} records):</div>
          <pre className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-auto">
            {JSON.stringify(data.slice(0, 5), null, 2)}
            {data.length > 5 ? '\n...more' : ''}
          </pre>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
      {result && (
        <div className="mt-2 text-green-700">
          <div>Inserted: {result.inserted}</div>
          <div>Skipped: {result.skipped}</div>
          {result.errors.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer">
                Errors ({result.errors.length})
              </summary>
              <ul className="list-disc ml-6 text-red-600">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.index + 1}: {e.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      {/* Benchmarking UI */}
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded">
        <h3 className="text-md font-bold mb-2 text-green-900">
          Benchmark Project Cost/SF
        </h3>
        <form onSubmit={handleBenchmark} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              name="region"
              value={benchForm.region}
              onChange={handleBenchInput}
              placeholder="Region (e.g. Northeast)"
              className="border p-2 rounded flex-1"
              required
            />
            <input
              name="projectType"
              value={benchForm.projectType}
              onChange={handleBenchInput}
              placeholder="Project Type (optional)"
              className="border p-2 rounded flex-1"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              name="costPerSF"
              value={benchForm.costPerSF}
              onChange={handleBenchInput}
              placeholder="Your Cost/SF"
              type="number"
              step="0.01"
              className="border p-2 rounded flex-1"
              required
            />
            <input
              name="effectiveDate"
              value={benchForm.effectiveDate}
              onChange={handleBenchInput}
              placeholder="Effective Date (YYYY-MM-DD, optional)"
              className="border p-2 rounded flex-1"
              type="date"
            />
          </div>
          <button
            type="submit"
            disabled={benchmarkLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {benchmarkLoading ? 'Benchmarking...' : 'Benchmark'}
          </button>
        </form>
        {benchmarkError && (
          <div className="text-red-600 mt-2">{benchmarkError}</div>
        )}
        {benchmark && (
          <div className="mt-4 text-green-900 text-sm">
            <div>
              <b>Market Average:</b> ${benchmark.marketAverage.toFixed(2)}
            </div>
            <div>
              <b>Market Median:</b> ${benchmark.marketMedian.toFixed(2)}
            </div>
            <div>
              <b>Std Dev:</b> ${benchmark.marketStdDev.toFixed(2)}
            </div>
            <div>
              <b>Percentile:</b> {benchmark.percentile.toFixed(1)}%
            </div>
            <div>
              <b>Variance from Avg:</b>{' '}
              {benchmark.varianceFromAverage.toFixed(1)}%
            </div>
            <div>
              <b>Category:</b>{' '}
              <span className="font-semibold">
                {benchmark.category.toUpperCase()}
              </span>
            </div>
            <div>
              <b>Confidence:</b> {(benchmark.confidence * 100).toFixed(0)}%
            </div>
            <div>
              <b>Sample Size:</b> {benchmark.sampleSize} (Recent:{' '}
              {benchmark.recentSampleSize})
            </div>
            {benchmark.notes.length > 0 && (
              <ul className="mt-2 list-disc ml-6 text-green-700">
                {benchmark.notes.map((n: string, i: number) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {/* Win Probability UI */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="text-md font-bold mb-2 text-yellow-900">
          Estimate Win Probability
        </h3>
        <form onSubmit={handleWinProb} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              name="costPerSF"
              value={winForm.costPerSF}
              onChange={handleWinInput}
              placeholder="Cost/SF"
              type="number"
              step="0.01"
              className="border p-2 rounded flex-1"
              required
            />
            <input
              name="riskScore"
              value={winForm.riskScore}
              onChange={handleWinInput}
              placeholder="Risk Score"
              type="number"
              step="0.01"
              className="border p-2 rounded flex-1"
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              name="marketPercentile"
              value={winForm.marketPercentile}
              onChange={handleWinInput}
              placeholder="Market Percentile (0-100)"
              type="number"
              step="0.1"
              className="border p-2 rounded flex-1"
              required
            />
            <input
              name="projectType"
              value={winForm.projectType}
              onChange={handleWinInput}
              placeholder="Project Type (optional)"
              className="border p-2 rounded flex-1"
            />
            <input
              name="region"
              value={winForm.region}
              onChange={handleWinInput}
              placeholder="Region (optional)"
              className="border p-2 rounded flex-1"
            />
          </div>
          <button
            type="submit"
            disabled={winProbLoading}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            {winProbLoading ? 'Calculating...' : 'Estimate'}
          </button>
        </form>
        {winProbError && (
          <div className="text-red-600 mt-2">{winProbError}</div>
        )}
        {winProb !== null && (
          <div className="mt-4 text-yellow-900 text-sm">
            <b>Estimated Win Probability:</b> {winProb.toFixed(1)}%
          </div>
        )}
      </div>
      {/* Package Recommendation UI */}
      <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded">
        <h3 className="text-md font-bold mb-2 text-purple-900">
          Recommend Pricing Packages
        </h3>
        <form onSubmit={handlePackages} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              name="baseCost"
              value={pkgForm.baseCost}
              onChange={handlePkgInput}
              placeholder="Base Cost"
              type="number"
              step="0.01"
              className="border p-2 rounded flex-1"
              required
            />
            <input
              name="marketAverage"
              value={pkgForm.marketAverage}
              onChange={handlePkgInput}
              placeholder="Market Average"
              type="number"
              step="0.01"
              className="border p-2 rounded flex-1"
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              name="marketPercentile"
              value={pkgForm.marketPercentile}
              onChange={handlePkgInput}
              placeholder="Market Percentile (0-100)"
              type="number"
              step="0.1"
              className="border p-2 rounded flex-1"
              required
            />
            <input
              name="winProbability"
              value={pkgForm.winProbability}
              onChange={handlePkgInput}
              placeholder="Win Probability (0-100)"
              type="number"
              step="0.1"
              className="border p-2 rounded flex-1"
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              name="minMargin"
              value={pkgForm.minMargin}
              onChange={handlePkgInput}
              placeholder="Min Margin (%)"
              type="number"
              step="0.1"
              className="border p-2 rounded flex-1"
              required
            />
            <input
              name="maxMargin"
              value={pkgForm.maxMargin}
              onChange={handlePkgInput}
              placeholder="Max Margin (%)"
              type="number"
              step="0.1"
              className="border p-2 rounded flex-1"
              required
            />
          </div>
          <button
            type="submit"
            disabled={packagesLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {packagesLoading ? 'Recommending...' : 'Recommend'}
          </button>
        </form>
        {packagesError && (
          <div className="text-red-600 mt-2">{packagesError}</div>
        )}
        {packages && (
          <div className="mt-4 text-purple-900 text-sm">
            <b>Recommended Packages:</b>
            <ul className="mt-2 space-y-2">
              {packages.map((pkg, i) => (
                <li
                  key={i}
                  className="border border-purple-300 rounded p-2 bg-white"
                >
                  <div className="font-semibold">{pkg.label}</div>
                  <div>
                    Price: <b>${pkg.price.toLocaleString()}</b>
                  </div>
                  <div>Margin: {pkg.margin}%</div>
                  <div>
                    Estimated Win Probability: {pkg.estimatedWinProbability}%
                  </div>
                  <ul className="list-disc ml-6 text-purple-700">
                    {pkg.notes.map((n: string, j: number) => (
                      <li key={j}>{n}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketDataUpload;
