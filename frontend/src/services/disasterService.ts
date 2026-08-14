/**
 * disasterService.ts — Location-aware disaster advisory and risk assessment service.
 */
import { LocationModel } from './locationService.ts';

export interface RegionalRiskInfo {
  district: string;
  city: string;
  overallRisk: 'CRITICAL' | 'MODERATE' | 'LOW';
  weatherSummary: string;
  floodWatch: string;
  landslideRisk: string;
  heatwaveStatus: string;
  activeAlertsCount: number;
}

export const getRegionalRiskAssessment = (location: LocationModel): RegionalRiskInfo => {
  const district = location.district || 'Pune';
  const city = location.city || district;

  const isKonkan = ['Mumbai', 'Thane', 'Raigad', 'Ratnagiri', 'Sindhudurg'].includes(district);

  return {
    district,
    city,
    overallRisk: isKonkan ? 'CRITICAL' : 'MODERATE',
    weatherSummary: isKonkan
      ? 'Heavy rainfall & high-tide monsoon advisory in effect along coastline.'
      : 'Moderate rainfall expected. River water levels within safety thresholds.',
    floodWatch: isKonkan ? 'ELEVATED FLOOD WATCH (High Tide 4.2m)' : 'NORMAL MONITORING',
    landslideRisk: isKonkan ? 'GHAT SECTION ADVISORY' : 'LOW RISK',
    heatwaveStatus: 'NORMAL MONSOON TEMPERATURE (27°C)',
    activeAlertsCount: isKonkan ? 3 : 1,
  };
};
