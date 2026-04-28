import * as masterDataService from "../services/master-data.service.js";

export const listMasterData = async (req, res) =>
  res.json(await masterDataService.listMasterData(req.params.resource));

export const createMasterData = async (req, res) =>
  res.status(201).json(await masterDataService.createMasterData(req.params.resource, req.body));

export const updateMasterData = async (req, res) =>
  res.json(await masterDataService.updateMasterData(req.params.resource, req.params.id, req.body));
