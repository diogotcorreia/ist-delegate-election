{
rustPlatform
,openssl
, pkg-config
}:
rustPlatform.buildRustPackage {
  pname = "ist-delegate-election-frontend";
  version = "1.0.0";

  nativeBuildInputs = [
    pkg-config
  ];

  buildInputs =[
    openssl
  ];

  src = ../backend;
  cargoLock = {
    lockFile = ../backend/Cargo.lock;
  };

}
