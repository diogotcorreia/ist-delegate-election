use serde::{Deserialize, Serialize};

// const TECNICO_API_BASE_URL: &str = "https://fenix.tecnico.ulisboa.pt/tecnico-api/v2";
// const FENIX_OAUTH_BASE_URL: &str = "https://fenix.tecnico.ulisboa.pt/oauth";
const TECNICO_API_BASE_URL: &str = "http://192.168.100.4:8080/tecnico-api/v2";
const FENIX_OAUTH_BASE_URL: &str = "http://192.168.100.4:8080/oauth";

#[derive(Serialize)]
pub struct DegreeEntryDto {
    degree_id: String,
    curricular_year: u8,
}

impl From<CurriculumResponse> for DegreeEntryDto {
    fn from(value: CurriculumResponse) -> Self {
        DegreeEntryDto {
            degree_id: value.degree.id,
            curricular_year: value.curricular_year,
        }
    }
}

#[derive(Serialize)]
pub struct AuthDto {
    username: String,
    display_name: String,
    degree_entries: Vec<DegreeEntryDto>,
}

pub async fn authenticate_from_code(code: &str) -> reqwest::Result<AuthDto> {
    let oauth_response = authorize_fenix_oauth_code(code).await?;
    let access_token = &oauth_response.access_token;
    let person = get_user_details(access_token).await?;
    let curriculum_response = get_curricular_details(access_token).await?;

    let degree_entries: Vec<DegreeEntryDto> = curriculum_response
        .into_iter()
        .filter(|entry| entry.state == "REGISTERED")
        .map(|entry| entry.into())
        .collect();

    Ok(AuthDto {
        username: person.username,
        display_name: person.display_name,
        degree_entries,
    })
}

#[derive(Deserialize)]
struct OAuthResponse {
    access_token: String,
}

async fn authorize_fenix_oauth_code(code: &str) -> reqwest::Result<OAuthResponse> {
    let client = reqwest::Client::new();

    client
        .post(format!("{FENIX_OAUTH_BASE_URL}/access_token"))
        .query(&[
            // TODO get this from somewhere
            ("client_id", "1695915081466315"),
            ("client_secret", "X9mqe4vY2pe6wq9TcXX7PAmhzCyK+0R3iO3HSf4UgC34Na+o+eHBMFOwfT/WctfIX60prUVr/gizjEthDzPxkw=="),
            ("redirect_uri", "http://localhost:5000/api/login"),
            ("code", code),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await?
        .json()
        .await
}

#[derive(Deserialize)]
struct PersonResponse {
    username: String,
    #[serde(rename = "displayName")]
    display_name: String,
}

async fn get_user_details(oauth_token: &str) -> reqwest::Result<PersonResponse> {
    let client = reqwest::Client::new();

    client
        .get(format!("{TECNICO_API_BASE_URL}/person"))
        .header("Authorization", format!("Bearer {}", oauth_token))
        .send()
        .await?
        .json()
        .await
}

#[derive(Deserialize)]
struct CurriculumResponse {
    degree: Degree,
    #[serde(rename = "curricularYear")]
    curricular_year: u8,
    state: String,
}

#[derive(Deserialize)]
struct Degree {
    id: String,
}

async fn get_curricular_details(oauth_token: &str) -> reqwest::Result<Vec<CurriculumResponse>> {
    let client = reqwest::Client::new();

    client
        .get(format!("{TECNICO_API_BASE_URL}/student/curriculum"))
        .header("Authorization", format!("Bearer {}", oauth_token))
        .send()
        .await?
        .json()
        .await
}
