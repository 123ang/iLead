import * as campaignService from "../services/campaign.service.js";
import { computeCampaignMetrics } from "../services/metrics.service.js";

export const listCampaigns = async (req, res) => res.json(await campaignService.listCampaigns());
export const getCampaign = async (req, res) => res.json(await campaignService.getCampaign(req.params.id));
export const createCampaign = async (req, res) =>
  res.status(201).json(await campaignService.createCampaign(req.body, req.user.id, req.auditContext));
export const updateCampaign = async (req, res) =>
  res.json(await campaignService.updateCampaign(req.params.id, req.body, req.user.id, req.auditContext));
export const deleteCampaign = async (req, res) =>
  res.json(await campaignService.deleteCampaign(req.params.id, req.user.id, req.auditContext));
export const addCampaignCost = async (req, res) =>
  res.status(201).json(await campaignService.addCampaignCost(req.params.id, req.body, req.user.id, req.auditContext));
export const refreshMetrics = async (req, res) =>
  res.json(await computeCampaignMetrics(req.params.id, new Date()));
