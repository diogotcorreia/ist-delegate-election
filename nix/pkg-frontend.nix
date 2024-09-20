{ buildNpmPackage, nodejs }:
buildNpmPackage {
  pname = "ist-delegate-election-frontend";
  version = "1.3.0";

  src = ../frontend;
  npmDepsHash = "sha256-6FMYrbs/fpjhgx/4cLbZZDpHEoIW0g8Fg6UmYcmPbG4=";

  nativeBuildInputs = [ nodejs ];

  installPhase = ''
    runHook preInstall

    mkdir $out
    npm run build
    cp -r build/* $out

    runHook postInstall
  '';
}
