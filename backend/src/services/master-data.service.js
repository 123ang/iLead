import { prisma } from "../config/db.js";

const modelMap = {
  countries: prisma.country,
  faculties: prisma.faculty,
  programmes: prisma.programme,
  currencies: prisma.currency,
  "fx-rates": prisma.fXRate,
  "tuition-fees": prisma.tuitionFee,
  scholarships: prisma.scholarship,
  sponsors: prisma.sponsor,
};

export const listMasterData = async (resource) => {
  const model = modelMap[resource];
  return model.findMany({ orderBy: { createdAt: "desc" } });
};

export const createMasterData = async (resource, payload) => {
  const model = modelMap[resource];
  return model.create({ data: payload });
};

export const updateMasterData = async (resource, id, payload) => {
  const model = modelMap[resource];
  return model.update({ where: { id }, data: payload });
};
