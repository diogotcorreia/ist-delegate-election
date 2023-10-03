{ buildNpmPackage, nodejs }:
buildNpmPackage {
  pname = "ist-delegate-election-frontend";
  version = "1.0.0";

  src = ../frontend;
  npmDepsHash = "sha256-eDYmfj0wNgsVqnb6te15oRkRvJanIefzQZ7T4mfX1sQ=";

  nativeBuildInputs = [ nodejs ];

  installPhase = ''
    runHook preInstall

    mkdir $out
    npm run build
    cp -r build/* $out

    runHook postInstall
  '';
}
