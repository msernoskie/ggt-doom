import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "gameSaves" model, go to https://ggt-doom.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "zM9B22qMtSTF",
  fields: {
    description: { type: "string", storageKey: "6g1AqePJ8m1g" },
    game: {
      type: "belongsTo",
      parent: { model: "game" },
      storageKey: "zGozNyEpBVA1",
    },
    name: { type: "string", storageKey: "j1g_pWuGrNPV" },
    saveFile: {
      type: "file",
      allowPublicAccess: false,
      storageKey: "sTdfF34gy8_A",
    },
  },
};
