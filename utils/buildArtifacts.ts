import { AbstractContract } from "./contract";

export const Registry = AbstractContract.loadBuildArtifact("Registry");
export const StaticCall = AbstractContract.loadBuildArtifact("StaticCall");

export const Test = AbstractContract.loadBuildArtifact(
  "Test",
  {
    StaticCall
  }
);

export default {
  Registry,
  StaticCall,
  Test
};
