import * as settingsService from "../services/settings.service.js";

export const listSettings = async (req, res) => res.json(await settingsService.listSettings());
export const updateSetting = async (req, res) =>
  res.json(await settingsService.updateSetting(req.params.key, req.body.value, req.user.id));
