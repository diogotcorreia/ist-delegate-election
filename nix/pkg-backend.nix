{ rustPlatform, openssl, pkg-config }:
rustPlatform.buildRustPackage {
  pname = "ist-delegate-election-backend";
  version = "1.2.0";

  nativeBuildInputs = [ pkg-config ];

  buildInputs = [ openssl ];

  src = ../backend;
  cargoLock.lockFile = ../backend/Cargo.lock;
}
