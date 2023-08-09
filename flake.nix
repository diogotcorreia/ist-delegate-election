{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
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
            nodejs
            yarn
          ];

          shellHook = ''
            export RUST_LOG=debug
          '';
        };
      }
    );
}
