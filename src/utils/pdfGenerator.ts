// src/utils/pdfGenerator.ts
import { Platform, PermissionsAndroid, Share } from 'react-native';
import { requestStoragePermission } from './permissions';
import { GEAR_IMAGE_URLS } from '../constants/gearImages';

/**
 * Redline logo URL and website
 */
const REDLINE_LOGO_URL = 'https://res.cloudinary.com/dwwykeft2/image/upload/v1765457898/RedLine/wqoaomsleu1egppnvjo6.png';
const REDLINE_WEBSITE = 'www.redlinegearcleaning.com';

/**
 * Generate HTML content from template and data
 */
export const generateReportHTML = (
  ppeData: any,
  analyticsData: any,
  leadData: any
): string => {
  // Extract data with fallbacks
  const firestation = ppeData?.firestation || {};
  const franchise = ppeData?.franchise || {};
  const rosters = ppeData?.roster || [];
  const assignedTechnicians = ppeData?.assigned_technicians || [];
  const meu = ppeData?.meu || {};

  // Parse address if available
  const address = firestation?.location || '';
  const addressParts = address.split(',').map((part: string) => part.trim());
  const street = addressParts[0] || '';
  const city = addressParts[1] || '';
  const state = addressParts[2] || '';
  const zip = addressParts[3] || '';

  // Format inspection date
  const inspectionDate = firestation?.inspectionDate || 
    (leadData?.schedule_date ? new Date(leadData.schedule_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '');

  // Format report date
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get analytics data with fallbacks
  const analytics = analyticsData || {};
  
  // Helper to escape HTML
  const escapeHtml = (text: any): string => {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Helper to get gear image path (for PDF, we'll use base64 or file paths)
  // Note: For PDF generation, images need to be base64 encoded or use absolute paths
  const getGearImageSrc = (gearType: string): string => {
    // Map gear types to image file names
    const imageMap: { [key: string]: string } = {
      'jacket': 'jacket.jpg',
      'pants': 'pants.jpg',
      'helmet': 'helmet.jpg',
      'hood': 'hood.jpg',
      'gloves': 'gloves.jpg',
      'boots': 'boots.jpg',
      'other': 'jacket.jpg', // fallback
    };
    
    const imageName = imageMap[gearType.toLowerCase()] || 'jacket.jpg';
    // For PDF generation, we'll need to use base64 or absolute paths
    // This is a placeholder - in production, convert images to base64
    return `file:///android_asset/${imageName}`;
  };

  // Generate roster sections HTML
  const generateRosterSections = (): string => {
    if (!rosters || rosters.length === 0) {
      return `
        <div class="roster-section">
          <div class="roster-header">
            <span class="roster-name-label">No Rosters Available</span>
          </div>
          <table class="gears-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Serial Number</th>
                <th>Manufacturer</th>
                <th>Date of Mfg.</th>
                <th>Status</th>
                <th>Service Type</th>
                <th>HydroTest Performed</th>
                <th>HydroTest Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="8" class="no-gears">No roster data available</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    return rosters.map((roster: any) => {
      const gears = roster.gears || [];
      const operationType = roster.operation_type ? 
        `<span class="operation-badge">${escapeHtml(roster.operation_type)}</span>` : '';

      const gearsRows = gears.length > 0 
        ? gears.map((gear: any) => `
          <tr>
            <td>${escapeHtml(gear.name || gear.gear_name || '')}</td>
            <td>${escapeHtml(gear.serial_number || '')}</td>
            <td>${escapeHtml(gear.manufacturer || gear.manufacturer_name || 'N/A')}</td>
            <td>${escapeHtml(gear.date_of_mfg || gear.manufacturing_date || gear.date_of_manufacture || 'N/A')}</td>
            <td>${escapeHtml(gear.gear_status || gear.status || '')}</td>
            <td>${escapeHtml(gear.service_type || gear.serviceType || '')}</td>
            <td>${escapeHtml(gear.hydrotest_performed || gear.hydrotestPerformed || gear.hydro_test_performed || 'N/A')}</td>
            <td>${escapeHtml(gear.hydrotest_status || gear.hydrotestStatus || gear.hydro_test_status || 'N/A')}</td>
          </tr>
        `).join('')
        : `
          <tr>
            <td colspan="8" class="no-gears">No gears assigned to this roster member</td>
          </tr>
        `;

      return `
        <div class="roster-section">
          <div class="roster-header">
            <span class="roster-name-label">Roster Name:</span>
            <span class="text-bold">${escapeHtml(roster.name || '')}</span>
            ${operationType}
          </div>
          <table class="gears-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Serial Number</th>
                <th>Manufacturer</th>
                <th>Date of Mfg.</th>
                <th>Status</th>
                <th>Service Type</th>
                <th>HydroTest Performed</th>
                <th>HydroTest Status</th>
              </tr>
            </thead>
            <tbody>
              ${gearsRows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  };

  // Get technician names
  const technicianNames = assignedTechnicians
    .map((tech: any) => tech.name)
    .join(', ') || 'N/A';

  // HTML Template
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roster Gear Assignment Report</title>
    <style>
        /* Import Professional Font */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* Global Reset & Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', Arial, sans-serif;
            background: #ffffff;
            color: #1a202c;
            line-height: 1.4;
            font-size: 10pt;
        }

        /* A4 Page Container */
        .page-container {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            padding: 12mm;
        }

        /* Header Section */
        .report-header {
            text-align: center;
            border-bottom: 3px solid #ed2c2a;
        }


        .report-logo {
            width: 300px;               /* whatever width you want */
            height: 80px;               /* whatever height looks good */
            margin: 0 auto 10px auto;
            overflow: hidden;           /* hide the extra top/bottom */
            position: relative;
        }

        .report-logo::before {
            content: "";
            position: absolute;
            top: -38px;                 /* ↑ shift image up (crop top) */
            left: 0;
            width: 100%;
            height: 200%;               /* enlarge so we can slide it */
            background-image: url('https://res.cloudinary.com/dwwykeft2/image/upload/v1765457898/RedLine/wqoaomsleu1egppnvjo6.png');
            background-size: 300px auto; /* keep original ratio */
            background-repeat: no-repeat;
            background-position: center center;
        }

        .report-title {
            font-size: 12pt;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 8px;
        }

        .report-subtitle {
            font-size: 11pt;
            color: #718096;
            font-weight: 500;
        }

        /* Section Title */
        .section-title {
            font-size: 11pt;
            font-weight: 700;
            color: #ed2c2a;
            margin: 10px 0 6px 0;
            padding: 4px 0;
            border-bottom: 1.5px solid #e2e8f0;
        }

        /* Details Table */
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: white;
        }

        .details-table td {
            padding: 8px 12px;
            border: 1px solid #cbd5e0;
            font-size: 10pt;
        }

        .details-table td:first-child {
            width: 180px;
            background: #fff5f5;
            font-weight: 600;
            color: #2d3748;
        }

        .details-table td:nth-child(2) {
            background: white;
            color: #1a202c;
        }

        /* Roster Section */
        .roster-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }

        .roster-header {
            background: #fee2e2;
            padding: 10px 12px;
            border-left: 4px solid #ed2c2a;
            margin: 15px 0 10px 0;
            font-weight: 600;
            font-size: 11pt;
            color: #1a202c;
        }

        .roster-name-label {
            color: #991b1b;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-right: 8px;
        }

        /* Gears Table */
        .gears-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .gears-table thead {
            background: linear-gradient(135deg, #ed2c2a 0%, #dc2626 100%);
        }

        .gears-table thead th {
            padding: 10px 8px;
            text-align: left;
            font-size: 9pt;
            font-weight: 700;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border: 1px solid #dc2626;
        }

        .gears-table tbody td {
            padding: 9px 8px;
            font-size: 9.5pt;
            color: #2d3748;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
        }

        .gears-table tbody tr:nth-child(even) {
            background: #fef2f2;
        }

        /* Empty State */
        .no-gears {
            text-align: center;
            padding: 20px;
            color: #a0aec0;
            font-style: italic;
            background: #fef2f2;
            border: 1px dashed #fca5a5;
            border-radius: 6px;
        }

        /* Footer */
        .report-footer {
            margin-top: 40px;
            padding-top: 0;
            text-align: center;
        }

        .footer-divider {
            width: 100%;
            height: 1px;
            background: #1a202c;
            margin: 0 0 10px 0;
        }

        .footer-link {
            color: #ed2c2a;
            text-decoration: none;
            font-weight: 600;
            font-size: 10pt;
        }

        /* Utilities */
        .text-bold {
            font-weight: 700;
        }

        /* Operation Type Badge */
        .operation-badge {
            display: inline-block;
            padding: 3px 8px;
            background: #fee2e2;
            color: #991b1b;
            border-radius: 4px;
            font-size: 8pt;
            font-weight: 600;
            margin-left: 10px;
            text-transform: uppercase;
        }

        /* Summary Row Containers */
        .summary-row-container {
            padding: 8px;
            border-radius: 8px;
            border: 2px solid;
            margin-bottom: 8px;
            margin-top: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            page-break-inside: avoid;
        }

        .row-title {
            font-size: 10pt;
            font-weight: 700;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding-bottom: 4px;
            border-bottom: 1px solid;
        }

        /* Summary Cards Rows - 3 Column Layout */
        .summary-row {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            justify-content: space-between;
        }

        .summary-card {
            width: calc((100% - 12px) / 3);
            min-width: 0;
            background: white;
            border: 1.5px solid #e2e8f0;
            border-radius: 6px;
            padding: 6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            min-height: 70px;
            margin-bottom: 4px;
        }

        .summary-card .card-icon {
            font-size: 20pt;
            line-height: 1;
            margin-bottom: 2px;
        }

        .summary-card .gear-image {
            width: 32px;
            height: 32px;
            object-fit: contain;
            margin-bottom: 2px;
            border-radius: 16px;
        }

        .summary-card .card-content {
            width: 100%;
        }

        .summary-card .card-value {
            font-size: 16pt;
            font-weight: 700;
            line-height: 1.1;
            margin: 2px 0 1px 0;
        }

        .summary-card .card-label {
            font-size: 7pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-weight: 600;
            margin-top: 1px;
            line-height: 1.1;
        }

        /* Primary Cards (Red Theme) */
        .summary-card.primary-card {
            border-color: #ed2c2a;
            background: #fff5f5;
        }

        .summary-card.primary-card .card-value {
            color: #ed2c2a;
        }

        .summary-card.primary-card .card-label {
            color: #991b1b;
        }

        /* Status Cards */
        .summary-card.status-pass {
            border-color: #10b981;
            background: #d1fae5;
        }

        .summary-card.status-pass .card-value {
            color: #059669;
        }

        .summary-card.status-pass .card-label {
            color: #065f46;
        }

        .summary-card.status-fail {
            border-color: #ef4444;
            background: #fee2e2;
        }

        .summary-card.status-fail .card-value {
            color: #dc2626;
        }

        .summary-card.status-fail .card-label {
            color: #991b1b;
        }

        .summary-card.status-oos {
            border-color: #6b7280;
            background: #f3f4f6;
        }

        .summary-card.status-oos .card-value {
            color: #4b5563;
        }

        .summary-card.status-oos .card-label {
            color: #374151;
        }

        .summary-card.status-expired {
            border-color: #f97316;
            background: #fed7aa;
        }

        .summary-card.status-expired .card-value {
            color: #ea580c;
        }

        .summary-card.status-expired .card-label {
            color: #c2410c;
        }

        .summary-card.status-action {
            border-color: #eab308;
            background: #fef3c7;
        }

        .summary-card.status-action .card-value {
            color: #ca8a04;
        }

        .summary-card.status-action .card-label {
            color: #854d0e;
        }

        /* Gear Type Cards (Red Theme) */
        .summary-card.gear-type {
            border-color: #ed2c2a;
            background: #ffffff;
        }

        .summary-card.gear-type .card-value {
            color: #ed2c2a;
        }

        .summary-card.gear-type .card-label {
            color: #991b1b;
        }

        /* Page Break Classes */
        .page-break-after {
            page-break-after: always;
        }

        .page-break-before {
            page-break-before: always;
        }

        @media print {
            body {
                background: white;
            }

             @page {
        margin-top: 20px;   /* ← gives the space you want */
        margin-bottom: 0;
        margin-left: 0;
        margin-right: 0;
    }
            
            .page-container {
                width: 100%;
                margin: 0;
                padding: 8mm;
            }

            .roster-section {
                page-break-inside: avoid;
            }

            .details-table {
                page-break-inside: avoid;
            }

            .summary-row {
                page-break-inside: avoid;
            }
            
            .summary-card {
                width: calc((100% - 12px) / 3);
                min-width: 0;
                max-width: none;
            }

            .page-break-after {
                page-break-after: always;
            }

            .page-break-before {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="page-container">
        <!-- Header -->
        <div class="report-header">
            <div class="report-logo" aria-label="Redline Logo"></div>
            <h1 class="report-title">PPE INSPECTION REPORT</h1>
            <p class="report-subtitle">Appointment Information</p>
        </div>

        <!-- Appointment Details Section -->
        <h2 class="section-title">Appointment Details</h2>
        <table class="details-table">
            <tr>
                <td>Franchise Name</td>
                <td>${franchise?.logo || franchise?.image ? `<img src="${escapeHtml(franchise.logo || franchise.image)}" style="max-width: 40px; max-height: 40px; vertical-align: middle; margin-right: 8px;" />` : ''}${escapeHtml(franchise?.name || ppeData?.franchise_name || leadData?.franchies?.name || 'N/A')}</td>
            </tr>
            <tr>
                <td>MEU</td>
                <td>${escapeHtml(meu?.name || leadData?.lead?.meu || 'N/A')}</td>
            </tr>
            <tr>
                <td>Department Name</td>
                <td>${escapeHtml(firestation?.name || 'N/A')}</td>
            </tr>
            <tr>
                <td>Street</td>
                <td>${escapeHtml(street)}</td>
            </tr>
            <tr>
                <td>City</td>
                <td>${escapeHtml(city)}</td>
            </tr>
            <tr>
                <td>State</td>
                <td>${escapeHtml(state)}</td>
            </tr>
            <tr>
                <td>Zip</td>
                <td>${escapeHtml(zip)}</td>
            </tr>
            <tr>
                <td>Contact Name (Chief)</td>
                <td>${escapeHtml(firestation?.contact || 'N/A')}</td>
            </tr>
            <tr>
                <td>Phone</td>
                <td>${escapeHtml(firestation?.contact || 'N/A')}</td>
            </tr>
            <tr>
                <td>Email</td>
                <td>${escapeHtml(firestation?.email || 'N/A')}</td>
            </tr>
            <tr>
                <td>Inspection Date</td>
                <td>${escapeHtml(inspectionDate)}</td>
            </tr>
            <tr>
                <td>Assigned Technicians</td>
                <td>${escapeHtml(technicianNames)}</td>
            </tr>
        </table>

        <!-- Summary Statistics Cards -->
        <h2 class="section-title" style="margin-top: 8px;">Inspection Summary</h2>
        
        <!-- First Row Container - Primary Stats -->
        <div class="summary-row-container" style="background-color: #fff5f5; border-color: #ed2c2a;">
            <div class="row-title" style="color: #ed2c2a; border-bottom-color: rgba(237, 44, 42, 0.3);">
                Overview & Status
            </div>
            <div class="summary-row">
            <div class="summary-card primary-card">
                <div class="card-icon">👥</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml(analytics['Total_fireFighters_Serviced'] || analytics['Total fireFighters Serviced'] || analytics.total_firefighters_serviced || 0)}</div>
                    <div class="card-label">Total Firefighters</div>
                </div>
            </div>

            <div class="summary-card primary-card">
                <div class="card-icon">🧰</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml(analytics['Total_Number_of_Gears'] || analytics['Total Number of Gears'] || analytics.total_gears || 0)}</div>
                    <div class="card-label">Total Gears</div>
                </div>
            </div>

            <div class="summary-card status-pass">
                <div class="card-icon">✓</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml(analytics['Total_Gear_Passed'] || analytics['Total Gear Passed'] || analytics.total_passed || 0)}</div>
                    <div class="card-label">Passed</div>
                </div>
            </div>

            <div class="summary-card status-fail">
                <div class="card-icon">✗</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml(analytics['Total_Gear_Fail'] || analytics['Total Gear Fail'] || analytics.total_failed || 0)}</div>
                    <div class="card-label">Failed</div>
                </div>
            </div>

            <div class="summary-card status-oos">
                <div class="card-icon">⊗</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml(analytics['Total_Gear_OOS'] || analytics['Total Gear OOS'] || analytics.total_oos || 0)}</div>
                    <div class="card-label">Out of Service</div>
                </div>
            </div>

            <div class="summary-card status-expired">
                <div class="card-icon">⏰</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml(analytics['Total_Gear_Expired'] || analytics['Total Gear Expired'] || analytics.total_expired || 0)}</div>
                    <div class="card-label">Expired</div>
                </div>
            </div>

            <div class="summary-card status-action">
                <div class="card-icon">⚠</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml(analytics['Total_Gear_ActionRequired'] || analytics['Total Gear ActionRequired'] || analytics.total_action_required || 0)}</div>
                    <div class="card-label">Action Required</div>
                </div>
            </div>
        </div>
        </div>

        <!-- Second Row Container - Gear Types -->
        <div class="summary-row-container" style="background-color: #ffffff; border-color: #ed2c2a; margin-top: 16px;">
            <div class="row-title" style="color: #ed2c2a; border-bottom-color: rgba(237, 44, 42, 0.3);">
                Gear Type Breakdown
            </div>
            <div class="summary-row">
            <div class="summary-card gear-type">
                <img src="${GEAR_IMAGE_URLS.jacket}" alt="Jackets" class="gear-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="card-icon" style="display: none;">🧥</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml((analytics.jacket_shell || 0) + (analytics.jacket_liner || 0) || analytics['Total jackets'] || analytics.total_jackets || 0)}</div>
                    <div class="card-label">Jackets</div>
                </div>
            </div>

            <div class="summary-card gear-type">
                <img src="${GEAR_IMAGE_URLS.pants}" alt="Pants" class="gear-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="card-icon" style="display: none;">👖</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml((analytics.pant_shell || 0) + (analytics.pant_liner || 0) || analytics['Total pants'] || analytics.total_pants || 0)}</div>
                    <div class="card-label">Pants</div>
                </div>
            </div>

            <div class="summary-card gear-type">
                <img src="${GEAR_IMAGE_URLS.helmet}" alt="Helmets" class="gear-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="card-icon" style="display: none;">⛑️</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml(analytics.total_helmet || analytics['Total helmet'] || analytics.total_helmet || 0)}</div>
                    <div class="card-label">Helmets</div>
                </div>
            </div>

            <div class="summary-card gear-type">
                <img src="${GEAR_IMAGE_URLS.hood}" alt="Hoods" class="gear-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="card-icon" style="display: none;">🧢</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml(analytics.total_hoods || analytics['Total hoods'] || analytics.total_hoods || 0)}</div>
                    <div class="card-label">Hoods</div>
                </div>
            </div>

            <div class="summary-card gear-type">
                <img src="${GEAR_IMAGE_URLS.gloves}" alt="Gloves" class="gear-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="card-icon" style="display: none;">🧤</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml(analytics.total_gloves || analytics['Total gloves'] || analytics.total_gloves || 0)}</div>
                    <div class="card-label">Gloves</div>
                </div>
            </div>

            <div class="summary-card gear-type">
                <img src="${GEAR_IMAGE_URLS.boots}" alt="Boots" class="gear-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="card-icon" style="display: none;">👢</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml(analytics.total_boots || analytics['Total boots'] || analytics.total_boots || 0)}</div>
                    <div class="card-label">Boots</div>
                </div>
            </div>

            <div class="summary-card gear-type">
                <img src="${GEAR_IMAGE_URLS.other}" alt="Other Gear" class="gear-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="card-icon" style="display: none;">📦</div>
                <div class="card-content">
                    <div class="card-value">${escapeHtml(analytics.total_other || analytics['Total other'] || analytics.total_other || 0)}</div>
                    <div class="card-label">Other Gear</div>
                </div>
            </div>
        </div>
        </div>

        <!-- Roster and Gears Section -->
        <h2 class="section-title">Roster & Gear Assignments</h2>
        ${generateRosterSections()}

        <!-- Footer -->
        <div class="report-footer">
            <div class="footer-divider"></div>
            <a href="https://${REDLINE_WEBSITE}" class="footer-link">${REDLINE_WEBSITE}</a>
        </div>
    </div>
</body>
</html>
  `;

  // Log the final HTML for debugging
  console.log('===== FINAL RENDERED HTML =====');
  console.log(htmlTemplate);
  console.log('===== END OF HTML =====');

  return htmlTemplate;
};

/**
 * Generate PDF from HTML
 * Note: This requires react-native-html-to-pdf to be properly linked
 * If you get errors, rebuild the app: npx react-native run-android
 */
export const generatePDF = async (
  htmlContent: string,
  fileName: string = 'PPE_Inspection_Report'
): Promise<string> => {
  try {
    // Try multiple import patterns
    let RNHTMLtoPDF: any;
    let PDFConverter: any;
    
    try {
      // Try default import
      RNHTMLtoPDF = require('react-native-html-to-pdf');
      
      // Try different export patterns
      if (RNHTMLtoPDF && RNHTMLtoPDF.default) {
        PDFConverter = RNHTMLtoPDF.default;
      } else if (RNHTMLtoPDF && typeof RNHTMLtoPDF.convert === 'function') {
        PDFConverter = RNHTMLtoPDF;
      } else if (RNHTMLtoPDF && RNHTMLtoPDF.RNHTMLtoPDF) {
        PDFConverter = RNHTMLtoPDF.RNHTMLtoPDF;
      } else {
        PDFConverter = RNHTMLtoPDF;
      }
      
      // Debug: Log the module structure
      console.log('RNHTMLtoPDF module keys:', Object.keys(RNHTMLtoPDF || {}));
      console.log('PDFConverter type:', typeof PDFConverter);
      console.log('PDFConverter keys:', PDFConverter ? Object.keys(PDFConverter) : 'null');
      
    } catch (requireError: any) {
      console.error('Failed to require react-native-html-to-pdf:', requireError);
      throw new Error(
        'react-native-html-to-pdf module not found. ' +
        'Please ensure the library is installed and the app is rebuilt: ' +
        'npm install react-native-html-to-pdf && npx react-native run-android'
      );
    }
    
    if (!PDFConverter) {
      throw new Error(
        'react-native-html-to-pdf module is undefined. ' +
        'The native module may not be properly linked. ' +
        'Please rebuild the app: npx react-native run-android'
      );
    }
    
    // Check if convert method exists
    if (typeof PDFConverter.convert !== 'function') {
      // Try alternative method names
      const convertMethod = PDFConverter.convert || 
                           PDFConverter.createPDF || 
                           PDFConverter.generatePDF ||
                           PDFConverter.htmlToPDF;
      
      if (typeof convertMethod === 'function') {
        PDFConverter.convert = convertMethod;
      } else {
        console.error('Available methods on PDFConverter:', Object.keys(PDFConverter));
        throw new Error(
          'react-native-html-to-pdf.convert is not a function. ' +
          'The library may not be properly linked. ' +
          'Please rebuild the app: cd android && ./gradlew clean && cd .. && npx react-native run-android'
        );
      }
    }

    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: Platform.OS === 'ios' ? 'Documents' : 'Documents',
      width: 595, // A4 width in points (210mm)
      height: 842, // A4 height in points (297mm)
      base64: false,
      padding: 0,
    };

    console.log('Calling PDFConverter.convert with options:', { ...options, html: '[HTML content]' });
    const file = await PDFConverter.convert(options);
    
    console.log('PDF generation result:', file);
    
    if (!file || !file.filePath) {
      throw new Error('PDF generation failed: No file path returned. Result: ' + JSON.stringify(file));
    }
    
    return file.filePath;
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    const errorMessage = error?.message || 'Unknown error occurred';
    
    // Provide helpful error message with rebuild instructions
    throw new Error(
      `PDF generation failed: ${errorMessage}\n\n` +
      `To fix this issue:\n` +
      `1. Ensure react-native-html-to-pdf is installed: npm install react-native-html-to-pdf\n` +
      `2. Clean and rebuild the app:\n` +
      `   cd android && ./gradlew clean && cd ..\n` +
      `   npx react-native run-android\n` +
      `3. If the issue persists, the native module may need manual linking.`
    );
  }
};

/**
 * Share PDF file on iOS using Share Sheet
 * This allows users to save to Files app, iCloud Drive, etc.
 */
export const sharePDFOnIOS = async (filePath: string, fileName: string): Promise<void> => {
  try {
    console.log('Sharing PDF on iOS...');
    console.log('File path:', filePath);
    console.log('File name:', fileName);
    
    const ReactNativeBlobUtil = require('react-native-blob-util');
    let RNFetchBlob: any = ReactNativeBlobUtil.default || ReactNativeBlobUtil;
    
    // Remove any file:// scheme prefix if present (openDocument requires path without scheme)
    let cleanPath = filePath.replace(/^file:\/\//, '');
    
    // Check if the file exists
    const exists = await RNFetchBlob.fs.exists(cleanPath);
    if (!exists) {
      throw new Error(`PDF file not found at path: ${cleanPath}`);
    }
    
    // For iOS, use the openDocument method from react-native-blob-util
    // This opens the iOS share sheet with the file
    // The path should NOT contain any scheme prefix (like "file://")
    if (RNFetchBlob.ios && typeof RNFetchBlob.ios.openDocument === 'function') {
      console.log('Opening iOS share sheet with path:', cleanPath);
      await RNFetchBlob.ios.openDocument(cleanPath);
      console.log('iOS share sheet opened successfully');
    } else {
      throw new Error('iOS openDocument method is not available in react-native-blob-util');
    }
  } catch (error: any) {
    console.error('Error sharing PDF on iOS:', error);
    throw new Error(`Failed to share PDF: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Download PDF file
 * On Android: Saves to Downloads folder using MediaStore (Android 10+) or direct copy (Android 9-)
 * On iOS: Saves to Documents folder and returns path for sharing
 */
export const downloadPDF = async (
  filePath: string,
  fileName: string = 'PPE_Inspection_Report.pdf',
  openShareSheet: boolean = false
): Promise<string> => {
  try {
    console.log('Starting PDF download...');
    console.log('Source file path:', filePath);
    console.log('Target file name:', fileName);
    
    // Note: Permission should be checked before calling this function
    // For Android, verify permission is granted before proceeding
    if (Platform.OS === 'android') {
      const { checkStoragePermission } = require('./permissions');
      try {
        const isGranted = await checkStoragePermission();
        console.log('Storage permission reported granted?', isGranted);
        if (!isGranted) {
          console.warn('Storage permission not reported as granted; attempting copy anyway.');
        }
      } catch (permErr) {
        console.warn('Storage permission check failed; attempting copy anyway.', permErr);
      }
    }
    console.log('Storage permission check complete');
    
    // Dynamically require react-native-blob-util
    const ReactNativeBlobUtil = require('react-native-blob-util');
    
    // Try different ways to access the module
    let RNFetchBlob: any = ReactNativeBlobUtil.default || ReactNativeBlobUtil;
    
    console.log('RNFetchBlob type:', typeof RNFetchBlob);
    console.log('RNFetchBlob keys:', RNFetchBlob ? Object.keys(RNFetchBlob).slice(0, 10) : 'null');
    
    if (!RNFetchBlob) {
      throw new Error('react-native-blob-util module not found');
    }
    
    // Access fs property
    if (!RNFetchBlob.fs) {
      console.error('RNFetchBlob structure:', JSON.stringify(Object.keys(RNFetchBlob), null, 2));
      throw new Error('react-native-blob-util.fs is not available. The library may not be properly linked.');
    }
    
    const { dirs } = RNFetchBlob.fs;
    
    if (!dirs) {
      throw new Error('react-native-blob-util.fs.dirs is not available.');
    }

    let destPath: string;
    
    if (Platform.OS === 'android') {
      // Android: Use MediaCollection API for Android 10+ to save to Downloads folder
      console.log('Android detected, API level:', Platform.Version);
      
      if (Platform.Version >= 29) {
        // Android 10+ (API 29+): Use MediaCollection to add file to Downloads
        console.log('Using MediaCollection API for Android 10+');
        
        try {
          // Use MediaCollection to copy file to Downloads
          const downloadPath = await RNFetchBlob.MediaCollection.copyToMediaStore(
            {
              name: fileName,
              parentFolder: 'Download', // This is the Downloads folder
              mimeType: 'application/pdf',
            },
            'Download', // Download folder
            filePath // source file path
          );
          
          console.log('PDF saved to Downloads via MediaCollection:', downloadPath);
          destPath = downloadPath;
        } catch (mediaError: any) {
          console.error('MediaCollection failed, trying alternative method:', mediaError);
          
          // Fallback: Try using DownloadDir directly (might work on some devices)
          const downloadDir = dirs.DownloadDir;
          destPath = `${downloadDir}/${fileName}`;
          await RNFetchBlob.fs.cp(filePath, destPath);
          console.log('PDF saved using fallback method:', destPath);
        }
      } else {
        // Android 9 and below: Direct copy to Downloads folder
        console.log('Using direct copy for Android 9 and below');
        const downloadDir = dirs.DownloadDir;
        console.log('Download directory:', downloadDir);
        
        if (!downloadDir) {
          throw new Error('Download directory not available for Android');
        }
        
        destPath = `${downloadDir}/${fileName}`;
        await RNFetchBlob.fs.cp(filePath, destPath);
        console.log('PDF copied to:', destPath);
        
        // Register the file with Android's DownloadManager so it appears in Downloads
        if (RNFetchBlob.android && RNFetchBlob.android.addCompleteDownload) {
          try {
            await RNFetchBlob.android.addCompleteDownload({
              title: fileName,
              description: 'PPE Inspection Report',
              mime: 'application/pdf',
              path: destPath,
              showNotification: true,
            });
            console.log('File registered with DownloadManager');
          } catch (dmError) {
            console.warn('Failed to register with DownloadManager:', dmError);
          }
        }
      }
    } else {
      // iOS: Save to Documents folder
      const documentDir = dirs.DocumentDir;
      console.log('Document directory:', documentDir);
      
      if (!documentDir) {
        throw new Error('Document directory not available for iOS');
      }
      
      destPath = `${documentDir}/${fileName}`;
      await RNFetchBlob.fs.cp(filePath, destPath);
      console.log('PDF copied to:', destPath);
    }

    console.log('PDF saved successfully to:', destPath);

    return destPath;
  } catch (error: any) {
    console.error('Error downloading PDF:', error);
    console.error('Error stack:', error?.stack);
    const errorMessage = error?.message || 'Unknown error occurred';
    throw new Error(`Failed to download PDF: ${errorMessage}`);
  }
};

