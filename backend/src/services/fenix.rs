use std::{collections::HashMap, env, time::Duration};

use serde::{Deserialize, Serialize};
use tracing::debug;

use crate::{
    cache::Cached,
    dtos::{DegreeDto, DegreeEntryDto, FenixConfigDto, UserDto},
    errors::AppError,
};

const FENIX_DEFAULT_BASE_URL: &str = "https://fenix.tecnico.ulisboa.pt";
const TECNICO_API_PREFIX: &str = "/tecnico-api/v2";
const FENIX_OAUTH_PREFIX: &str = "/oauth";

const CACHE_DURATION: Duration = Duration::from_secs(60 * 10); // 10 minutes

#[derive(Clone)]
pub struct FenixService {
    base_url: String,
    client_id: String,
    client_secret: String,
    redirect_url: String,

    cached_degrees: Cached<HashMap<String, DegreeDto>>,
    cached_academic_year: Cached<String>,
}

impl FenixService {
    /// Create a new FenixService instance from environment variables.
    ///
    /// At least the env variables FENIX_CLIENT_ID, FENIX_CLIENT_SECRET
    /// and FENIX_REDIRECT_URL must be defined, whereas FENIX_BASE_URL
    /// is optional.
    pub fn new() -> Result<FenixService, String> {
        let service = FenixService {
            base_url: env::var("FENIX_BASE_URL").unwrap_or(FENIX_DEFAULT_BASE_URL.to_string()),
            client_id: env::var("FENIX_CLIENT_ID")
                .map_err(|_| "Environment variable FENIX_CLIENT_ID is not defined")?,
            client_secret: env::var("FENIX_CLIENT_SECRET")
                .map_err(|_| "Environment variable FENIX_CLIENT_SECRET is not defined")?,
            redirect_url: env::var("FENIX_REDIRECT_URL")
                .map_err(|_| "Environment variable FENIX_REDIRECT_URL is not defined")?,

            cached_degrees: Cached::new(CACHE_DURATION),
            cached_academic_year: Cached::new(CACHE_DURATION),
        };

        debug!(
            "initialized FenixService with base url '{}', client id '{}' and redirect url '{}'",
            service.base_url, service.client_id, service.redirect_url
        );

        Ok(service)
    }

    /// Export this service's configuration as a DTO
    pub fn to_dto(&self) -> FenixConfigDto {
        FenixConfigDto {
            base_url: self.base_url.clone(),
            client_id: self.client_id.clone(),
            redirect_url: self.redirect_url.clone(),
        }
    }

    /// Given an OAuth code, authenticate with Fénix and fetch information about
    /// the user.
    ///
    /// Fetched information includes the user's name, username and attending degrees.
    pub async fn authenticate_from_code(
        &self,
        code: &str,
    ) -> Result<(UserDto, OAuthResponse), AppError> {
        let oauth_response = self
            .authorize_fenix_oauth_code(code)
            .await
            .map_err(|_| AppError::Unauthorized)?;
        let access_token = &oauth_response.access_token;
        let person = self
            .get_user_details(access_token)
            .await
            .map_err(|_| AppError::FenixError)?;
        let curriculum_response = self
            .get_curricular_details(access_token)
            .await
            .map_err(|_| AppError::FenixError)?;
        let academic_year = self.get_active_year().await?;

        let degree_entries: Vec<DegreeEntryDto> = curriculum_response
            .into_iter()
            .filter(|entry| entry.state == "REGISTERED")
            .filter(|entry| {
                entry
                    .academic_terms
                    .iter()
                    .any(|term| term.year.to_string() == academic_year)
            })
            .map(|entry| entry.into())
            .collect();

        Ok((
            UserDto {
                username: person.username,
                name: person.name,
                display_name: person.display_name,
                degree_entries,
            },
            oauth_response,
        ))
    }

    /// Validate a OAuth code with Fenix's OAuth endpoint, getting the access and refresh tokens.
    async fn authorize_fenix_oauth_code(&self, code: &str) -> reqwest::Result<OAuthResponse> {
        let client = reqwest::Client::new();

        client
            .post(format!(
                "{}{}/access_token",
                self.base_url, FENIX_OAUTH_PREFIX
            ))
            .query(&[
                ("grant_type", "authorization_code"),
                ("client_id", &self.client_id),
                ("client_secret", &self.client_secret),
                ("redirect_uri", &self.redirect_url),
                ("code", code),
            ])
            .send()
            .await?
            .json()
            .await
    }

    /// Get basic details about the user, such as their username and display name.
    async fn get_user_details(&self, oauth_token: &str) -> reqwest::Result<PersonResponse> {
        let client = reqwest::Client::new();

        client
            .get(format!("{}{}/person", self.base_url, TECNICO_API_PREFIX))
            .header("Authorization", format!("Bearer {}", oauth_token))
            .send()
            .await?
            .json()
            .await
    }

    /// Get curricular information about the user, such as the degrees they're in, as well as the
    /// respective curricular years.
    async fn get_curricular_details(
        &self,
        oauth_token: &str,
    ) -> reqwest::Result<Vec<CurriculumResponse>> {
        let client = reqwest::Client::new();

        client
            .get(format!(
                "{}{}/student/curriculum",
                self.base_url, TECNICO_API_PREFIX
            ))
            .header("Authorization", format!("Bearer {}", oauth_token))
            .send()
            .await?
            .json()
            .await
    }

    /// Search for Fénix user in specific degree.
    pub async fn search_user_in_degree(
        &self,
        oauth_token: &str,
        query: &str,
        _degree_id: &str,
    ) -> reqwest::Result<PersonSearchResponse> {
        let client = reqwest::Client::new();

        client
            .post(format!("{}/api/bennu-core/users/find", self.base_url,))
            .query(&[
                ("query", query),
                ("includeInactive", "false"),
                ("maxHits", "20"),
            ])
            .header("Authorization", format!("Bearer {}", oauth_token))
            .header("X-Requested-With", "XMLHttpRequest")
            .send()
            .await?
            .json()
            .await
    }

    /// Get cached degree list from Fénix
    /// If no degrees are cached, or if the cached list has been invalidated, they will be fetched
    /// again.
    pub async fn get_degrees(&self) -> Result<impl Iterator<Item = DegreeDto>, AppError> {
        self.get_degrees_map().await.map(|map| map.into_values())
    }

    /// Get cached degree from Fénix
    /// If no degrees are cached, or if the cached list has been invalidated, they will be fetched
    /// again.
    pub async fn get_degree(&self, degree_id: &str) -> Result<Option<DegreeDto>, AppError> {
        self.get_degrees_map()
            .await
            .map(|map| map.get(degree_id).cloned())
    }

    async fn get_degrees_map(&self) -> Result<HashMap<String, DegreeDto>, AppError> {
        self.cached_degrees
            .get(|| async {
                self.fetch_degrees_from_fenix()
                    .await
                    .map_err(|_| AppError::FenixError)
            })
            .await
    }

    async fn fetch_degrees_from_fenix(&self) -> reqwest::Result<HashMap<String, DegreeDto>> {
        let client = reqwest::Client::new();

        client
            .get(format!("{}{}/degrees", self.base_url, TECNICO_API_PREFIX))
            .send()
            .await?
            .json::<Vec<DegreeDto>>()
            .await
            .map(|degrees| {
                degrees
                    .into_iter()
                    .map(|degree| (degree.id.clone(), degree))
                    .collect()
            })
    }

    /// Get cached active academic year from Fénix
    /// If no year is cached, or if the cached year has been invalidated, it will be fetched
    /// again.
    pub async fn get_active_year(&self) -> Result<String, AppError> {
        self.cached_academic_year
            .get(|| async {
                self.fetch_active_year_from_fenix()
                    .await
                    .map_err(|_| AppError::FenixError)
            })
            .await
    }

    async fn fetch_active_year_from_fenix(&self) -> reqwest::Result<String> {
        let client = reqwest::Client::new();

        let response: AboutResponse = client
            .get(format!("{}{}/about", self.base_url, TECNICO_API_PREFIX))
            .send()
            .await?
            .json()
            .await?;

        let year = response.active_semester.year;

        Ok(year.to_string())
    }
}

impl From<CurriculumResponse> for DegreeEntryDto {
    fn from(value: CurriculumResponse) -> Self {
        DegreeEntryDto {
            degree_id: value.degree.id,
            curricular_year: value.curricular_year,
        }
    }
}

#[derive(Deserialize, Serialize, Clone)]
pub struct OAuthResponse {
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PersonResponse {
    username: String,
    name: String,
    display_name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CurriculumResponse {
    degree: Degree,
    curricular_year: u8,
    state: String,
    academic_terms: Vec<ExecutionSemester>,
}

#[derive(Deserialize)]
struct Degree {
    id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AboutResponse {
    active_semester: ExecutionSemester,
}

#[derive(Deserialize)]
struct ExecutionSemester {
    year: ExecutionYear,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExecutionYear {
    begin_year: u32,
    end_year: u32,
}

impl ToString for ExecutionYear {
    fn to_string(&self) -> String {
        format!("{}/{}", self.begin_year, self.end_year)
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonSearchResponse {
    pub users: Vec<PersonSearchResult>,
}

#[derive(Deserialize)]
pub struct PersonSearchResult {
    pub username: String,
    pub name: String,
}
