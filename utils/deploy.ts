export function deployTruffleArtifacts(
  loader: ArtifactsLoader,
  deployer: TruffleDeployer
) {
  const Registry = loader.require("Registry");
  const StaticCall = loader.require("StaticCall");
  const Test = loader.require("Test");
  
  
  deployer.deploy(StaticCall).then(() => {
    deployer.link(StaticCall, [Test]);
  });

  deployer.deploy(Registry);
  deployer.deploy(StaticCall);
}
