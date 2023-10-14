{ buildNpmPackage, nodejs }:
buildNpmPackage {
  pname = "ist-delegate-election-frontend";
  version = "1.1.1";

  src = ../frontend;
  npmDepsHash = "sha256-NgPsufBCCzBLA2rG3hh4dMoLVep+Qku2v4rkjWiexS4=";

  nativeBuildInputs = [ nodejs ];

  installPhase = ''
    runHook preInstall

    mkdir $out
    npm run build
    cp -r build/* $out

    runHook postInstall
  '';
}
