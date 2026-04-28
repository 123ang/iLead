import * as followupService from "../services/followup.service.js";

export const listFollowUps = async (req, res) => res.json(await followupService.listFollowUps());
export const createFollowUp = async (req, res) => res.status(201).json(await followupService.createFollowUp(req.body));
export const listOverdueLeads = async (req, res) => res.json(await followupService.listOverdueLeads());
export const listLeadFollowUps = async (req, res) => res.json(await followupService.listLeadFollowUps(req.params.leadId));
