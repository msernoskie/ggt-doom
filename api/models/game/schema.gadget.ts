import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "game" model, go to https://ggt-doom.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "mjAhaJmOep_2",
  fields: {
    description: {
      type: "richText",
      storageKey: "SBBNcb1tCtHv::oCce2Z7LB_C8",
    },
    fileSize: {
      type: "number",
      decimals: 0,
      storageKey: "nLFI7grkttzY",
    },
    gameSaves: {
      type: "hasMany",
      children: { model: "gameSaves", belongsToField: "gameSave" },
      storageKey: "DB1g2lht_Gnp",
    },
    gameType: {
      type: "enum",
      default: "Flash",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["Flash", "HTML5", "Native"],
      validations: { required: true },
      storageKey: "OMc1_G-CRVZT",
    },
    name: {
      type: "string",
      validations: { required: true, unique: true },
      storageKey: "OGDfLe-tvHOP::lmckfQCCnhVZ",
    },
    originalFileName: { type: "string", storageKey: "8F4ACHfNeBhw" },
    swfFile: {
      type: "file",
      allowPublicAccess: true,
      storageKey: "B-55itN47zYz",
    },
    user: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "DVYHFsuyF7oF",
    },
  },
};
