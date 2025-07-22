import React, { useEffect, useState } from 'react';

const HistoricalReportDashboard: React.FC = () => {
  const [proposalStats, setProposalStats] = useState<any>(null);
  const [marketTrends, setMarketTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pRes, mRes] = await Promise.all([
          fetch('/api/reports/proposals'),
          fetch('/api/reports/market-trends'),
        ]);
        const pJson = await pRes.json();
        const mJson = await mRes.json();
        if (!pJson.success)
          throw new Error(pJson.error || 'Proposal stats error');
        if (!mJson.success)
          throw new Error(mJson.error || 'Market trends error');
        setProposalStats(pJson.stats);
        setMarketTrends(mJson.trends);
      } catch (err: any) {
        setError(err.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-indigo-50 p-6 rounded shadow max-w-3xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4 text-indigo-900">
        Historical Comparison & Reporting Dashboard
      </h2>
      {loading && <div className="text-gray-600">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && proposalStats && marketTrends && (
        <>
          <div className="mb-6">
            <h3 className="text-md font-semibold text-indigo-800 mb-2">
              Proposal Stats by Year
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs bg-white rounded">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="px-2 py-1">Year</th>
                    <th className="px-2 py-1">Win Rate</th>
                    <th className="px-2 py-1">Avg Cost/SF</th>
                    <th className="px-2 py-1">Avg Margin (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(proposalStats.winRates).map(year => (
                    <tr key={year} className="border-b">
                      <td className="px-2 py-1 font-semibold">{year}</td>
                      <td className="px-2 py-1">
                        {(proposalStats.winRates[year] * 100).toFixed(1)}%
                      </td>
                      <td className="px-2 py-1">
                        ${proposalStats.avgCostPerSF[year].toFixed(2)}
                      </td>
                      <td className="px-2 py-1">
                        {proposalStats.avgMargin[year].toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-md font-semibold text-indigo-800 mb-2">
              Market Cost/SF Trends by Year
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs bg-white rounded">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="px-2 py-1">Year</th>
                    <th className="px-2 py-1">Avg Cost/SF</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(marketTrends.trends).map(year => (
                    <tr key={year} className="border-b">
                      <td className="px-2 py-1 font-semibold">{year}</td>
                      <td className="px-2 py-1">
                        ${marketTrends.trends[year].toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HistoricalReportDashboard;
