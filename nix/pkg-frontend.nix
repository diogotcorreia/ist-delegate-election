{ buildNpmPackage, nodejs }:
buildNpmPackage {
  pname = "ist-delegate-election-frontend";
  version = "1.0.0";

  src = ../frontend;
  npmDepsHash = "sha256-1GK4e12K7uPR76t+EUHcK04CGa1WwUkOazks0H9KkbM=";

  nativeBuildInputs = [ nodejs ];

  installPhase = ''
    runHook preInstall

    mkdir $out
    npm run build
    cp -r build/* $out

    runHook postInstall
  '';
}
