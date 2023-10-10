{ buildNpmPackage, nodejs }:
buildNpmPackage {
  pname = "ist-delegate-election-frontend";
  version = "1.1.0";

  src = ../frontend;
  npmDepsHash = "sha256-CQ3AuPQvoUJjNwKNDkDOrFk0JeqH1fRk6GzU9SBsHdU=";

  nativeBuildInputs = [ nodejs ];

  installPhase = ''
    runHook preInstall

    mkdir $out
    npm run build
    cp -r build/* $out

    runHook postInstall
  '';
}
