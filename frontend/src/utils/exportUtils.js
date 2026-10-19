/**
 * Utility functions for exporting ESG data, impact metrics, and organization rosters
 */

export function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;

  const separator = ',';
  const keys = Object.keys(rows[0]);
  
  const csvContent = [
    keys.join(separator),
    ...rows.map((row) =>
      keys
        .map((k) => {
          let cell = row[k] === null || row[k] === undefined ? '' : row[k];
          cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
          cell = cell.replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        })
        .join(separator)
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportImpactMetricsCSV(summary, ecosystem) {
  const rows = [
    { Metric: 'Report Generation Timestamp', Value: new Date().toISOString(), Unit: 'ISO 8601' },
    { Metric: 'Total Meals Rescued', Value: summary?.mealsRescued || 0, Unit: 'Meals' },
    { Metric: 'Estimated CO2e Avoided', Value: Math.round((summary?.mealsRescued || 0) * 0.4 * 2.5), Unit: 'kg CO2e' },
    { Metric: 'Water Footprint Conserved', Value: Math.round((summary?.mealsRescued || 0) * 0.4 * 850), Unit: 'Liters' },
    { Metric: 'Total Recycled Materials', Value: summary?.totalKgRecycled || 0, Unit: 'kg' },
    { Metric: 'Recycled Plastic', Value: summary?.kgRecycled?.plastic || 0, Unit: 'kg' },
    { Metric: 'Recycled Glass', Value: summary?.kgRecycled?.glass || 0, Unit: 'kg' },
    { Metric: 'Recycled Paper', Value: summary?.kgRecycled?.paper || 0, Unit: 'kg' },
    { Metric: 'Recycled Metal', Value: summary?.kgRecycled?.metal || 0, Unit: 'kg' },
    { Metric: 'Organic Waste Diverted', Value: summary?.kgOrganicDiverted || 0, Unit: 'kg' },
    { Metric: 'Active Districts Covered', Value: summary?.districtsCoveredCount || 0, Unit: 'Districts' },
    { Metric: 'Verified Charities & NGOs', Value: ecosystem?.verifiedNGOs || 0, Unit: 'Organizations' },
    { Metric: 'Verified Recycling Facilities', Value: ecosystem?.verifiedRecyclers || 0, Unit: 'Facilities' },
    { Metric: 'Active Volunteers Registered', Value: ecosystem?.activeVolunteers || 0, Unit: 'Volunteers' }
  ];

  downloadCSV('FoodBridge_ESG_Impact_Report', rows);
}

export function exportOrganizationsCSV(organizations) {
  if (!organizations || !organizations.length) return;

  const rows = organizations.map((org) => ({
    OrganizationName: org.name || 'N/A',
    Category: org.type || 'N/A',
    District: org.district || 'N/A',
    RegistrationNumber: org.registrationInfo || 'N/A',
    VerificationStatus: org.verificationStatus || 'pending',
    Remarks: org.verificationRemarks || 'None',
    PrimaryContactEmail: org.linkedUser?.email || 'N/A',
    CreatedAt: org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'
  }));

  downloadCSV('FoodBridge_Organizations_Roster', rows);
}
