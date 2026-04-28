import * as applicationService from "../services/application.service.js";

export const listApplications = async (req, res) => res.json(await applicationService.listApplications());
export const uploadApplications = async (req, res) =>
  res.status(201).json(await applicationService.uploadApplicationsScaffold(req.body, req.user.id, req.auditContext));
export const matchLeads = async (req, res) => res.json(await applicationService.matchApplicationsToLeads());
export const listUnmatched = async (req, res) => res.json(await applicationService.listUnmatchedApplications());
export const listMatchConflicts = async (req, res) => res.json(await applicationService.listMatchConflicts());
export const resolveConflictScaffold = async (req, res) => res.json({ ok: true, id: req.params.id });
export const uploadOffers = async (req, res) => res.status(201).json(await applicationService.uploadOffersScaffold(req.body));
export const uploadEnrolments = async (req, res) => res.status(201).json(await applicationService.uploadEnrolmentsScaffold(req.body));
export const manualAttribution = async (req, res) =>
  res.json(await applicationService.manualAttribution(req.params.id, req.body.campaignId));
