use crate::services::fenix::FenixService;
use std::net::{IpAddr, Ipv6Addr, SocketAddr};

use axum::routing::get;
use axum::Router;
use tower::ServiceBuilder;
use tower_http::add_extension::AddExtensionLayer;
use tower_http::trace::TraceLayer;
use tracing::info;

mod routes;
mod services;

#[tokio::main]
async fn main() {
    // enable console logging
    tracing_subscriber::fmt::init();

    let fenix_service = FenixService::new().expect("Failed to initialize FenixService");

    let api_routes = Router::new()
        .route("/login", get(routes::login::login))
        .route("/test", get(|| async { "Hello, world!" })); // TODO: temporary, remove later

    let app = Router::new().nest("/api", api_routes).layer(
        ServiceBuilder::new()
            .layer(AddExtensionLayer::new(fenix_service))
            .layer(TraceLayer::new_for_http()),
    );

    let sock_addr = SocketAddr::from((IpAddr::V6(Ipv6Addr::LOCALHOST), 5000));

    info!("listening on http://{}", sock_addr);

    axum::Server::bind(&sock_addr)
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .expect("Unable to start server");
}
