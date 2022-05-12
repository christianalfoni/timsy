"use strict";
const semver = require("semver");

module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
  coverageDirectory: "./coverage/",
  coverageReporters: ["json", "html", "text", "text-summary"],
  globals: { "ts-jest": { tsconfig: { target: "es2018" } } },
  moduleNameMapper: {
    "^timsy$": "<rootDir>/src/index.ts",
    "^timsy/(.*)$": "<rootDir>/src/$1.ts",
  },
  modulePathIgnorePatterns: ["dist"],
  preset: "ts-jest",
  rootDir: ".",
  testEnvironment: "jsdom",
  testEnvironmentOptions: { url: "http://localhost" },
  testRegex: "test.(ts|tsx)$",
};
