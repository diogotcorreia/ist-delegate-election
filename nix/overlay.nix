final: prev: {
  ist-delegate-election-backend = prev.callPackage ./pkg-backend.nix { };
  ist-delegate-election-frontend = prev.callPackage ./pkg-frontend.nix { };
}
