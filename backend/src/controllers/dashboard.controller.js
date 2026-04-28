import * as dashboardService from "../services/dashboard.service.js";

export const executive = async (req, res) => res.json(await dashboardService.getExecutiveDashboard(req.query));
export const faculty = async (req, res) => res.json(await dashboardService.getFacultyDashboard(req.params.facultyId));
export const staff = async (req, res) => res.json(await dashboardService.getStaffDashboard(req.params.staffId));
export const countryPerformance = async (req, res) => res.json(await dashboardService.getCountryPerformance());
export const programmePerformance = async (req, res) => res.json(await dashboardService.getProgrammePerformance());
export const campaignRoi = async (req, res) => res.json(await dashboardService.getCampaignRoiChart());
export const funnel = async (req, res) => res.json(await dashboardService.getRecruitmentFunnel());
