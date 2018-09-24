export function deployTruffleArtifacts(
  loader: ArtifactsLoader,
  deployer: TruffleDeployer
) {
  const ProxyFactory = loader.require("ProxyFactory");
  const Registry = loader.require("Registry");
  deployer.deploy(ProxyFactory);
  deployer.deploy(Registry);
}
