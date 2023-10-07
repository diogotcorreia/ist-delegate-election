use crate::services::fenix::FenixService;
use std::env;
use std::net::{IpAddr, Ipv6Addr, SocketAddr};
use std::path::PathBuf;

use axum::extract::FromRef;

use axum::routing::{delete, get, patch, post};
use axum::Router;
use axum_sessions::SessionLayer;
use migration::{Migrator, MigratorTrait};
use sea_orm::{Database, DatabaseConnection};

use tower::ServiceBuilder;

use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;
use tracing::{info, warn};

use rand::Rng;

mod auth_utils;
mod cache;
mod crypto_utils;
mod dtos;
mod election_utils;
mod errors;
mod routes;
mod services;

#[derive(Clone, FromRef)]
struct AppState {
    fenix_service: FenixService,
    conn: DatabaseConnection,
    signing_key: [u8; 64],
}

#[tokio::main]
async fn main() {
    // enable console logging
    tracing_subscriber::fmt::init();

    let port: u16 = std::env::var("PORT")
        .map(|port_str| {
            port_str
                .parse()
                .expect("port must be a number between 0 and 65525")
        })
        .unwrap_or(5000);
    let static_dir = std::env::var("STATIC_DIR").ok();

    let fenix_service = FenixService::new().expect("Failed to initialize FenixService");

    // TODO store session in database
    let session_store = async_session::MemoryStore::new();
    let session_secret = env::var("SESSION_SECRET").map_or_else(
        |_| {
            warn!("SESSION_SECRET not set, generating a random one. Set this to, at least, a 64-byte hex string to persist sessions");
            let mut random_bytes = [0u8; 64];
            rand::thread_rng().fill(&mut random_bytes);
            random_bytes.to_vec()
        },
        |secret| hex::decode(secret).expect("Invalid SESSION_SECRET: not a hex string"));
    let session_layer = SessionLayer::new(session_store, &session_secret);

    let mut signing_key = [0u8; 64];
    rand::thread_rng().fill(&mut signing_key);

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL is not set");
    let conn = Database::connect(database_url)
        .await
        .expect("Database connection failed");
    Migrator::up(&conn, None).await.expect("Migration failed");

    let state = AppState {
        fenix_service,
        conn,
        signing_key,
    };

    let api_routes = Router::new()
        .route("/admins", get(routes::admin::list_admins))
        .route("/admin", post(routes::admin::add_admin))
        .route("/admin/:username", delete(routes::admin::remove_admin))
        .route("/config", get(routes::config::get_config))
        .route("/degrees", get(routes::degrees::list_degrees))
        .route(
            "/elections/bulk",
            post(routes::elections::bulk_create_elections),
        )
        .route(
            "/elections/nominations/unverified",
            get(routes::elections::get_unverified_nominations),
        )
        .route(
            "/elections/nominations/unverified-count",
            get(routes::elections::get_unverified_nominations_count),
        )
        .route(
            "/elections/user",
            get(routes::elections::get_user_elections),
        )
        .route(
            "/election/:election_id",
            get(routes::elections::get_election),
        )
        .route(
            "/election/:election_id/details",
            get(routes::elections::get_election_details),
        )
        .route(
            "/election/:election_id/nominate",
            post(routes::elections::nominate_others),
        )
        .route(
            "/election/:election_id/nomination",
            patch(routes::elections::edit_nomination),
        )
        .route(
            "/election/:election_id/self-nominate",
            post(routes::elections::self_nominate),
        )
        .route(
            "/election/:election_id/vote",
            post(routes::elections::cast_vote),
        )
        .route(
            "/election/:election_id/vote-options",
            get(routes::elections::get_vote_options),
        )
        .route("/login", post(routes::login::login))
        .route("/logout", post(routes::login::logout))
        .route("/search-user", post(routes::search_user::search_user))
        .route("/setup/admin", post(routes::admin::setup_first_admin))
        .route("/whoami", get(routes::login::whoami));

    let mut app = Router::new()
        .nest("/api", api_routes)
        .layer(
            ServiceBuilder::new()
                .layer(session_layer)
                .layer(TraceLayer::new_for_http()),
        )
        .with_state(state);

    if let Some(static_dir) = &static_dir {
        app = app.fallback_service(
            ServeDir::new(static_dir)
                .fallback(ServeFile::new(PathBuf::from(static_dir).join("index.html"))),
        );
    }

    let sock_addr = SocketAddr::from((IpAddr::V6(Ipv6Addr::LOCALHOST), port));

    info!("listening on http://{}", sock_addr);

    axum::Server::bind(&sock_addr)
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .expect("Unable to start server");
}
