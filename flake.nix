{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        packages = rec {
          ist-delegate-election-frontend = pkgs.callPackage ./nix/pkg-frontend.nix {};
          default = ist-delegate-election-frontend;
        };

        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            cargo
            openssl
            pkg-config
            rustc
            rustfmt
            rust-analyzer
            clippy
            sea-orm-cli
            typeshare
            nodejs
          ];

          shellHook = ''
            export RUST_LOG=debug
          '';
        };
      }
    );
}
