"use strict";
const semver = require("semver");

module.exports = {
  testEnvironmentOptions: {
    url: "http://localhost",
  },
  preset: "ts-jest",
  modulePathIgnorePatterns: ["<rootDir>/cjs", "<rootDir>/react"],
  collectCoverageFrom: ["src/**/*.{t,j}s?(x)", "!src/**/*.d.ts"],
  globals: {
    "ts-jest": {
      tsconfig: {
        target: "es2018",
      },
    },
  },
};
