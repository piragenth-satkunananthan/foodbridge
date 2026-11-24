import React from 'react';

export default function ImpactSummary({ data }) {
  const { summary: s, ecosystem: e } = data;
  const metrics = [
    ['Estimated meals rescued', s.mealsRescued, 'meals'],
    ['Materials recycled', s.totalKgRecycled, 'kg'],
    ['Organic waste diverted', s.kgOrganicDiverted, 'kg'],
    ['Districts covered', s.districtsCoveredCount, 'districts']
  ];
  return (
    <>
      <div className="impact-metrics">
        {metrics.map(([label, value, unit]) => (
          <div className="impact-metric" key={label}>
            <p>{label}</p><strong>{Number(value).toLocaleString()}</strong><span>{unit}</span>
          </div>
        ))}
      </div>
      {e.completedDonationsCount === 0 && e.completedWasteCount === 0 && (
        <p className="report-note">Impact figures will appear after donations or collections are completed.</p>
      )}
      <div className="report-columns">
        <section className="card">
          <h2 className="card-title">Recycled materials</h2>
          <dl className="report-breakdown">
            {Object.entries(s.kgRecycled).map(([material, kg]) => (
              <div key={material}><dt>{material === 'paper' ? 'Paper and cardboard' : material}</dt><dd>{Number(kg).toLocaleString()} kg</dd></div>
            ))}
          </dl>
        </section>
        <section className="card">
          <h2 className="card-title">Districts covered</h2>
          <p className="report-note">Districts with recorded food deliveries or completed waste collections.</p>
          <p>{s.districtsCovered.length ? s.districtsCovered.join(', ') : 'No completed activity yet.'}</p>
        </section>
      </div>
      <section className="report-method">
        <h2 className="card-title">How these figures are calculated</h2>
        <p>Food totals include donations marked delivered or completed. Waste totals include requests marked recycled or completed. These are recorded outcomes, not independently audited measurements.</p>
        <p>Meal counts use recorded portions or an estimate of 2.5 meals per kilogram. Waste weights use kilograms, grams, or tonnes. Unrecognised quantities are excluded from these estimates.</p>
        <p>Coverage: all recorded activity. Figures are loaded when this view opens or you select Refresh.</p>
      </section>
    </>
  );
}
