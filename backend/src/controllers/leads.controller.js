import * as leadService from "../services/lead.service.js";

export const listLeads = async (req, res) => res.json(await leadService.listLeads());
export const getLead = async (req, res) => res.json(await leadService.getLead(req.params.id));
export const createLead = async (req, res) =>
  res.status(201).json(await leadService.createLead(req.body, req.user.id, req.auditContext));
export const updateLead = async (req, res) =>
  res.json(await leadService.updateLead(req.params.id, req.body, req.user.id, req.auditContext));
export const deleteLead = async (req, res) =>
  res.json(await leadService.deleteLead(req.params.id, req.user.id, req.auditContext));
export const assignLead = async (req, res) =>
  res.json(await leadService.assignLead(req.params.id, req.body.assignedStaffId, req.user.id, req.auditContext));
export const updateLeadStatus = async (req, res) =>
  res.json(await leadService.updateLeadStatus(req.params.id, req.body.status, req.body.reason, req.user.id, req.auditContext));
export const listDuplicates = async (req, res) => res.json(await leadService.listDuplicateLeads());
export const mergeLeadsScaffold = async (req, res) => res.json({ ok: true, message: "Merge workflow scaffolded for V1 pass one." });
