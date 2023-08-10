use crate::services::fenix::FenixService;
use std::env;
use std::net::{IpAddr, Ipv6Addr, SocketAddr};

use axum::routing::{delete, get, post};
use axum::Router;
use axum_sessions::SessionLayer;
use migration::{Migrator, MigratorTrait};
use sea_orm::Database;
use tower::ServiceBuilder;
use tower_http::add_extension::AddExtensionLayer;
use tower_http::trace::TraceLayer;
use tracing::{info, warn};

use rand::Rng;

mod dtos;
mod errors;
mod routes;
mod services;

#[tokio::main]
async fn main() {
    // enable console logging
    tracing_subscriber::fmt::init();

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

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL is not set");
    let conn = Database::connect(database_url)
        .await
        .expect("Database connection failed");
    Migrator::up(&conn, None).await.expect("Migration failed");

    let api_routes = Router::new()
        .route("/login", get(routes::login::login))
        .route("/admins", get(routes::admin::list_admins))
        .route("/admin", post(routes::admin::add_admin))
        .route("/admin", delete(routes::admin::remove_admin))
        .route("/setup/admin", post(routes::admin::setup_first_admin))
        .route("/whoami", get(routes::login::whoami));

    let app = Router::new().nest("/api", api_routes).layer(
        ServiceBuilder::new()
            .layer(session_layer)
            .layer(AddExtensionLayer::new(fenix_service))
            .layer(AddExtensionLayer::new(conn))
            .layer(TraceLayer::new_for_http()),
    );

    let sock_addr = SocketAddr::from((IpAddr::V6(Ipv6Addr::LOCALHOST), 5000));

    info!("listening on http://{}", sock_addr);

    axum::Server::bind(&sock_addr)
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .expect("Unable to start server");
}
