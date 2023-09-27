{ mkYarnPackage
, nodejs
}:
mkYarnPackage {
  pname = "ist-delegate-election-frontend";
  version = "1.0.0";
  src = ../frontend;

  nativeBuildInputs = [ nodejs ];

  buildPhase = ''
    runHook preBuild

    yarn build

    runHook postBuild
  '';
}
