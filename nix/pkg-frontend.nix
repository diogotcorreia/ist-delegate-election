{ buildNpmPackage, nodejs }:
buildNpmPackage {
  pname = "ist-delegate-election-frontend";
  version = "1.2.0";

  src = ../frontend;
  npmDepsHash = "sha256-1TYC9KJx7C5QEOnQposNh6PqoNKWLsKrMjiLFeuWjTI=";

  nativeBuildInputs = [ nodejs ];

  installPhase = ''
    runHook preInstall

    mkdir $out
    npm run build
    cp -r build/* $out

    runHook postInstall
  '';
}
