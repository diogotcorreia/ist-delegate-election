{ config, pkgs, lib, ... }:

let
  inherit (lib) types mkEnableOption mkOption mkIf literalExpression;
  cfg = config.services.ist-delegate-election;

  backendPkg = pkgs.callPackage ./pkg-backend.nix { };
  frontendPkg = pkgs.callPackage ./pkg-frontend.nix { };
in {
  options = {
    services.ist-delegate-election = {
      enable = mkEnableOption (lib.mdDoc "IST Delegate Election");

      fqdn = mkOption {
        type = types.str;
        default = "http://localhost:${cfg.port}";
        defaultText = literalExpression
          ''"http://localhost:''${services.ist-delegate-election.port}"'';
        description = lib.mdDoc ''
          FQDN of IST Delegate Election, to be used to SSO callback.
          Must not have trailing slash.
        '';
      };

      port = mkOption {
        type = types.port;
        default = 5000;
        description = lib.mdDoc "Port where IST Delegate Election listens.";
      };

      user = mkOption {
        type = types.str;
        default = "ist-delegate-election";
        description =
          lib.mdDoc "User account under which IST Delegate Election runs.";
      };

      group = mkOption {
        type = types.str;
        default = "ist-delegate-election";
        description = lib.mdDoc "Group under which IST Delegate Election runs.";
      };

      package = mkOption {
        type = types.package;
        default = backendPkg;
        defaultText = literalExpression "pkgs.ist-delegate-election-backend";
        description = lib.mdDoc ''
          IST Delegate Election (backend) package to use.
        '';
      };

      frontendPackage = mkOption {
        type =
          types.nullOr (types.oneOf [ types.str types.path types.package ]);
        default = frontendPkg;
        defaultText = literalExpression "pkgs.ist-delegate-election-frontend";
        description = lib.mdDoc ''
          IST Delegate Election (frontend) package to use.
          Can also be a directory that contains the static files to serve,
          or null if the backend shouldn't serve them.
        '';
      };

      settings = mkOption {
        type = types.attrsOf types.anything;
        default = { };
        description = lib.mdDoc ''
          Structural IST Delegate Election configuration.
          Refer to upstream's documentation for details and supported values.
        '';
        example = literalExpression ''
          {
            FENIX_BASE_URL = "https://ceres.diogotc.com";
            FENIX_CLIENT_ID = "...";
            FENIX_CLIENT_SECRET = "...";

            # 128-char (64-byte) hex-string
            SESSION_SECRET = "...";

            DATABASE_URL=postgres://postgresql:postgresql@localhost/ist-delegate-election
          }
        '';
      };

      settingsFile = mkOption {
        type = types.nullOr types.path;
        default = null;
        description = lib.mdDoc ''
          File containing settings to pass onto IST Delegate Election.
          This is useful for secret configuration that should not be copied
          into the world-readable Nix store, for example, FENIX_CLIENT_SECRET,
          SESSION_SECRET and DATABASE_URL.

          File must be in the following format:

          ```
          KEY=value
          ```
        '';
      };
    };
  };

  config = mkIf cfg.enable {
    systemd.services.ist-delegate-election = {
      description = "IST Delegate Election";
      after = [ "network.target" ];
      wantedBy = [ "multi-user.target" ];

      environment = {
        RUST_LOG = "info,sqlx=warn";
        PORT = toString cfg.port;
        STATIC_DIR = cfg.frontendPackage;
        FENIX_REDIRECT_URL = "${cfg.fqdn}/login-callback";
      } // cfg.settings;

      serviceConfig = {
        Type = "simple";
        User = cfg.user;
        Group = cfg.group;
        ExecStart = "${cfg.package}/bin/ist-delegate-election";
        Restart = "on-failure";
        EnvironmentFile = [ cfg.settingsFile ];

        # systemd hardening
        NoNewPrivileges = true;
        SystemCallArchitectures = "native";
        RestrictAddressFamilies = [ "AF_UNIX" "AF_INET" "AF_INET6" ];
        RestrictNamespaces = !config.boot.isContainer;
        RestrictRealtime = true;
        RestrictSUIDSGID = true;
        ProtectControlGroups = !config.boot.isContainer;
        ProtectHostname = true;
        ProtectKernelLogs = !config.boot.isContainer;
        ProtectKernelModules = !config.boot.isContainer;
        ProtectKernelTunables = !config.boot.isContainer;
        LockPersonality = true;
        PrivateTmp = !config.boot.isContainer;
        PrivateDevices = true;
        PrivateUsers = true;
        RemoveIPC = true;

        SystemCallFilter = [
          "~@clock"
          "~@aio"
          "~@chown"
          "~@cpu-emulation"
          "~@debug"
          "~@keyring"
          "~@memlock"
          "~@module"
          "~@mount"
          "~@obsolete"
          "~@privileged"
          "~@raw-io"
          "~@reboot"
          "~@setuid"
          "~@swap"
        ];
        SystemCallErrorNumber = "EPERM";
      };
    };

    users.users = mkIf (cfg.user == "ist-delegate-election") {
      ist-delegate-election = {
        isSystemUser = true;
        group = cfg.group;
      };
    };

    users.groups = mkIf (cfg.group == "ist-delegate-election") {
      ist-delegate-election = { };
    };
  };
}
