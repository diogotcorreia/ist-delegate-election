use std::net::{IpAddr, Ipv6Addr, SocketAddr};

use axum::routing::get;
use axum::Router;
use tracing::info;

mod services;

#[tokio::main]
async fn main() {
    // enable console logging
    tracing_subscriber::fmt::init();

    let api_routes = Router::new().route("/test", get(|| async { "Hello, world!" })); // TODO: temporary, remove later

    let app = Router::new().nest("/api", api_routes);

    let sock_addr = SocketAddr::from((IpAddr::V6(Ipv6Addr::LOCALHOST), 5000));

    info!("listening on http://{}", sock_addr);

    axum::Server::bind(&sock_addr)
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .expect("Unable to start server");
}
