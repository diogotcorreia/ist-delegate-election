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
    jwt: String,
    username: String,
    display_name: String,
    degree_entries: Vec<DegreeEntryDto>,
}

#[derive(Deserialize)]
struct OAuthResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct PersonResponse {
    username: String,
    #[serde(rename = "displayName")]
    display_name: String,
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

pub async fn authenticate_from_code(code: &str) -> Result<AuthDto, ()> {
    let client = reqwest::Client::new();
    let oauth_response: OAuthResponse = client
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
        .await
        .expect("oauth failed") // TODO proper error
        .json()
        .await
        .expect("can't convert oauth to json"); // TODO proper error

    let person_response: PersonResponse = client
        .get(format!("{TECNICO_API_BASE_URL}/person"))
        .header(
            "Authorization",
            format!("Bearer {}", oauth_response.access_token),
        )
        .send()
        .await
        .expect("person endpoint failed") // TODO proper error
        .json()
        .await
        .expect("can't convert person to json"); // TODO proper error

    let curriculum_response: Vec<CurriculumResponse> = client
        .get(format!("{TECNICO_API_BASE_URL}/student/curriculum"))
        .header(
            "Authorization",
            format!("Bearer {}", oauth_response.access_token),
        )
        .send()
        .await
        .expect("curriculum endpoint failed")
        .json()
        .await
        .expect("can't convert curriculum to json");

    let degree_entries: Vec<DegreeEntryDto> = curriculum_response
        .into_iter()
        .filter(|entry| entry.state == "REGISTERED")
        .map(|entry| entry.into())
        .collect();

    Ok(AuthDto {
        jwt: "".to_string(),
        username: person_response.username,
        display_name: person_response.display_name,
        degree_entries,
    })
}
