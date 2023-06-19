use serde::Serialize;

const TECNICO_API_BASE_URL: &str = "https://fenix.tecnico.ulisboa.pt/tecnico-api/v2";
const FENIX_OAUTH_BASE_URL: &str = "https://fenix.tecnico.ulisboa.pt/oauth";

pub struct DegreeEntryDto {
    degree_id: String,
    curricular_year: u8,
}

pub struct AuthDto {
    jwt: String,
    username: String,
    display_name: String,
    degree_entries: Vec<DegreeEntryDto>,
}

#[derive(Serialize, Deserialize)]
struct OAuthResponse {
    access_token: String,
    refresh_token: String,
    expires_in: String,
}

#[derive(Serialize, Deserialize)]
struct PersonResponse {
    username: String,
    display_name: String,
}

pub async fn authenticate_from_code(code: &str) -> Result<AuthDto, ()> {
    let oauth_response: OAuthResponse = reqwest::get(format!("{FENIX_OAUTH_BASE_URL}/access_token"))
        .query(&[("client_id", ""), ("client_secret", ""), ("redirect_uri", ""), ("code", ""), ("grant_type", "authorization_code")])
        .send()
        .await?
        .json()
        .await?;

    let person_response: PersonResponse = reqwest::get(format!("{TECNICO_API_BASE_URL}/person"))
        .header("Authorization", format!("Bearer {oauth_response.access_token}"))
        .send()
        .await?
        .json()
        .await?;

    // let curriculum_response: CurriculumResponse = reqwest::get(format!("{TECNICO_API_BASE_URL}/student/curriculum"))
        // .header("Authorization", format!("Bearer {oauth_response.access_token}"))
        // .send()
        // .await?
        // .json()
        // .await?;
}
