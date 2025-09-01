import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "user" model, go to https://ggt-doom.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "DataModel-AppAuth-User",
  fields: {
    email: {
      type: "email",
      validations: { required: true, unique: true },
      storageKey: "eNarRUA04JaK",
    },
    emailVerificationToken: {
      type: "string",
      storageKey: "4fDdKgjo3nT7",
    },
    emailVerificationTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "k3qPCFe7AUqk",
    },
    emailVerified: {
      type: "boolean",
      default: false,
      storageKey: "RlLhu8RPfPw0",
    },
    firstName: { type: "string", storageKey: "YDP_gZ40ZQb0" },
    googleImageUrl: { type: "url", storageKey: "MK7MuhHrIlx9" },
    googleProfileId: { type: "string", storageKey: "2cyVr8ioKEzp" },
    lastName: { type: "string", storageKey: "82zzFEhqyBSY" },
    lastSignedIn: {
      type: "dateTime",
      includeTime: true,
      storageKey: "fNCtsVoIWp0u",
    },
    password: {
      type: "password",
      validations: { strongPassword: true },
      storageKey: "SlSz5HyyLr43",
    },
    profilePicture: {
      type: "file",
      allowPublicAccess: true,
      storageKey: "X9hlHtzM0qPp",
    },
    resetPasswordToken: {
      type: "string",
      storageKey: "5VCqAqqD1lDF",
    },
    resetPasswordTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "Wb86YQ7PKzFR",
    },
    roles: {
      type: "roleList",
      default: ["unauthenticated"],
      storageKey: "M9soRpC5ujT4",
    },
  },
};
