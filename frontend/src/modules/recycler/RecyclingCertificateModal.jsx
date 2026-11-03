import React from 'react';
import {
  X, Award, ShieldCheck, Printer, CheckCircle2,
  Leaf, Download, Share2, Building2
} from 'lucide-react';

export default function RecyclingCertificateModal({ isOpen, onClose, certificate, batch }) {
  if (!isOpen || (!certificate && !batch)) return null;

  const data = certificate || {
    certificateId: `FB-REC-${(batch?._id || '0000').slice(-6).toUpperCase()}`,
    issueDate: batch?.updatedAt ? new Date(batch.updatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
    facilityName: batch?.matchedCollector?.name || 'Authorized Recycling Partner',
    facilityLicense: batch?.matchedCollector?.registrationInfo || 'LIC-REC-2026',
    facilityDistrict: batch?.matchedCollector?.district || batch?.district || 'Colombo',
    donorName: batch?.donor?.name || 'Verified FoodBridge Donor',
    wasteCategory: batch?.wasteCategory || 'plastic',
    wasteCategoryLabel: batch?.wasteCategory ? batch.wasteCategory.toUpperCase() : 'CIRCULAR MATERIAL',
    netWeightDivertedKg: batch?.impact?.weightKg || 85,
    co2eMitigatedKg: batch?.impact?.co2eSavedKg || 153,
    treeSeedlingsEquivalent: batch?.impact?.treeEquivalents || 7,
    circularPathway: batch?.pathwayTitle || 'Industrial Circular Reprocessing',
    batchYieldPercent: 98.5,
    complianceStandard: 'ISO 14001 Circular Standards & UN SDG 12 Compliant'
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '16px',
          padding: 0,
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #cbd5e1'
        }}
      >
        {/* Certificate Action Bar (Hidden on print) */}
        <div
          className="no-print"
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="#059669" />
            <span style={{ fontSize: '13px', fontWeight: '650', color: '#0f172a' }}>
              ESG Landfill Diversion Certificate
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              className="btn btn-outline"
              style={{ fontSize: '12.5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="btn-icon"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
            >
              <X size={18} color="#64748b" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Sheet */}
        <div
          id="recycling-certificate"
          style={{
            padding: '36px 40px',
            background: '#ffffff',
            position: 'relative',
            fontFamily: 'inherit'
          }}
        >
          {/* Border Frame */}
          <div
            style={{
              border: '2px solid #059669',
              borderRadius: '12px',
              padding: '28px',
              position: 'relative'
            }}
          >
            {/* Corner Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '800', fontSize: '18px', letterSpacing: '0.5px' }}>
                  <span>FOODBRIDGE™</span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>CIRCULAR NETWORK</span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  Verified Environmental, Social & Governance (ESG) Audit Certificate
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #10b981',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>OFFICIALLY CERTIFIED</span>
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: '10.5px', color: '#64748b' }}>
                  REF: <strong>{data.certificateId}</strong>
                </p>
              </div>
            </div>

            {/* Certificate Title */}
            <div style={{ textAlign: 'center', margin: '20px 0 28px 0' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Certificate of Circular Waste Diversion
              </h2>
              <p style={{ fontSize: '13px', color: '#475569', maxWidth: '480px', margin: '0 auto', lineHeight: '1.45' }}>
                This certifies that the following post-commercial surplus material was diverted from municipal landfills and safely remanufactured through licensed industrial recycling operations.
              </p>
            </div>

            {/* Key Metric Highlights */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                  Net Weight Diverted
                </span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                  {data.netWeightDivertedKg} <span style={{ fontSize: '13px', fontWeight: '600' }}>kg</span>
                </div>
              </div>

              <div style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                  CO₂e Emissions Mitigated
                </span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                  {data.co2eMitigatedKg} <span style={{ fontSize: '13px', fontWeight: '600' }}>kg CO₂e</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                  Tree Seedlings Offset
                </span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                  ~{data.treeSeedlingsEquivalent} <span style={{ fontSize: '13px', fontWeight: '600' }}>trees</span>
                </div>
              </div>
            </div>

            {/* Detailed Ledger Breakdown */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                fontSize: '12.5px',
                color: '#334155',
                marginBottom: '24px',
                background: '#ffffff',
                border: '1px solid #f1f5f9',
                borderRadius: '8px',
                padding: '14px'
              }}
            >
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Material Stream</span>
                <strong>{data.wasteCategoryLabel}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Issue Date</span>
                <strong>{new Date(data.issueDate).toLocaleDateString()}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Source Donor</span>
                <strong>{data.donorName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Processing Facility</span>
                <strong>{data.facilityName} ({data.facilityDistrict})</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Circular Remanufacturing Pathway</span>
                <strong>{data.circularPathway}</strong>
              </div>
            </div>

            {/* Verification & Sign-off Stamp */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: '16px',
                borderTop: '1px dashed #cbd5e1'
              }}
            >
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#64748b' }}>
                  Facility Registration: <strong>{data.facilityLicense}</strong>
                </p>
                <p style={{ margin: 0, fontSize: '10.5px', color: '#94a3b8' }}>
                  {data.complianceStandard}
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    borderBottom: '1px solid #0f172a',
                    width: '140px',
                    marginBottom: '4px',
                    height: '24px',
                    fontFamily: 'cursive',
                    color: '#0369a1',
                    fontSize: '14px'
                  }}
                >
                  Fathima Amna
                </div>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
                  Authorized Circular Auditor
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
